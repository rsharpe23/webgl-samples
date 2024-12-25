Object.defineProperties(Node.prototype, {
  textLength: {
    get() { return this.textContent.length; }
  },

  isTextNode: {
    get() { return this.nodeType === Node.TEXT_NODE; } 
  }
});

Object.assign(HTMLElement.prototype, {
  addClass(className) {
    this.classList.add(className);
  },

  removeClass(className) {
    this.classList.remove(className);
  },

  toggleClass(className) {
    return this.classList.toggle(className);
  },

  hasClass(className) {
    return this.classList.contains(className);
  },

  setBoolAttribute(attr, value) {
    if (value) 
      this.setAttribute(attr, '');
    else
      this.removeAttribute(attr);
  }, 

  setActiveClass(value) {
    this[value ? 'addClass' : 'removeClass']('active');
  },
});

const selectionUtil = {
  getTagsOfSelectionText() {
    const selection = document.getSelection();
    if (selection.rangeCount > 1) return [];
    return selectionUtil.getContainerTags(selection);
  },

  getContainerTags(selection) {
    const container = selectionUtil.getContainer(selection);
    return selectionUtil.getParentTags(container, 'div');
  },

  // При выделении текста, если захватить немного больше текста чем нужно, а затем 
  // вернуть назад, не отпуская ЛКМ, то в выделение попадет мусорный нод (без текста), 
  // из-за которого получается неправильный диапазон.
  getContainer: Object.assign(function f(selection) {
    let { startContainer, startOffset, 
      endContainer, endOffset} = selection.getRangeAt(0);

    // Клик по слову либо выделение в пределеах одного текстового нода
    if (startContainer === endContainer) 
      return startContainer;

    // Прихвачен мусорный нод слева от выделения
    if (startOffset === startContainer.textLength) {
      startContainer = f.deepest(startContainer.nextSibling, 'firstChild');
      startOffset = 0;
    }

    // Прихвачен мусорный нод справа от выделения
    if (endOffset === 0) {
      endContainer = f.deepest(endContainer.previousSibling, 'lastChild');
      endOffset = endContainer.textLength;
    }

    return f.commonContainer(startContainer, startOffset, endContainer, endOffset);
  }, {
    // Возвращает самый нижний крайний текстовый нод
    deepest(node, childProp) {
      const child = node[childProp];
      if (!child) return node;
      return this.deepest(child, childProp);
    },

    // Набор параметров специфичен только для контекста ф-ции getContainer
    // т.к. именно здесь удобнее всего задавать такую последовательность.
    // В более общем контексте можно было бы передавать 2 объекта: start и end
    commonContainer(sNode, sOffset, eNode, eOffset) {
      const range = document.createRange();
      range.setStart(sNode, sOffset);
      range.setEnd(eNode, eOffset);
      return range.commonAncestorContainer;
    },
  }),

  getParentTags({ localName, parentNode }, contentTag, initialList = []) {
    // Св-во localName - это название тега в нижнем регистре 
    if (localName) {
      if (localName === contentTag) 
        return initialList;
        
      initialList.push(localName);
    }

    return selectionUtil.getParentTags(parentNode, contentTag, initialList);
  },

  hasSelectionText() {
    const selection = document.getSelection();
    return !selection.isCollapsed;
  }
};

const widget = {
  Widget: class {
    constructor(elem, opts = {}) { 
      this.elem = elem; 
      this.opts = opts;
    }

    get dataset() { return this.elem.dataset; }

    addEventListener(type, listener) {
      this.elem.addEventListener(type, listener);
    }

    dispatchEvent(event) {
      this.elem.dispatchEvent(event);
    }

    static init(selector, opts) {
      return [].map.call(document.querySelectorAll(selector), 
        elem => new this(elem, opts));
    }
  },

  Event: class extends CustomEvent {
    constructor(type, detail) {
      super(`wgt_${type}`, { detail });
    }
  },
};

widget.CheckBox = class extends widget.Widget {
  constructor(elem, opts) {
    super(elem, opts);

    this.addEventListener('click', e => {
      const item = e.target;
      if (item.hasClass(this.itemClass))
        this.toggleItem(item);
    });
  }

  get items() {
    return this._items ??= this.elem.getElementsByClassName(this.itemClass);
  }

  get itemClass() { return this.dataset.item; }

  toggleItem(item) {
    const isActive = item.toggleClass('active');
    this.dispatchEvent(new widget.Event('itemtoggle', { item, isActive }));
  }

  resetItems() {
    for (const item of this.items)
      item.removeClass('active');
  }

  static checkItem(item) { item.addClass('active'); }
};

const app = {

  ToolsCheckBox: class extends widget.CheckBox {
    canToggle = false;

    commandMap = {
      'foreColor': ['red', 'black'],
      'bold': ['on', 'off'],
      'italic': ['on', 'off'],
      'strikeThrough': ['on', 'off'],
      'backColor': ['yellow', 'white'],
    }

    constructor(elem, opts) {
      super(elem, opts);

      this.addEventListener('wgt_itemtoggle', e => {
        const { item, isActive } = e.detail;
        const { command } = item.dataset;
        const [val1, val2] = this.commandMap[command];
        this.onTool(command, isActive ? val1 : val2);
      });
    }

    onTool(command, value) {
      this.dispatchEvent(new widget.Event('tool', { command, value }));
    }

    toggleItem(item) {
      if (!this.canToggle) return;
      super.toggleItem(item);
    }
  },

  Content: class extends widget.Widget {
    constructor(elem, opts) {
      super(elem, opts);

      this.addEventListener('mousedown', e => {
        if (e.detail === 2 && !this.isEditable()) {
          e.preventDefault(); // Предотвращаем выделение
          this.activate();
          this.selectText();
        }
      });

      this.addEventListener('mouseup', () => {
        if (this.isEditable()) this.selectText();
      });
    }

    get container() {
      return this._container ??= this.elem.closest(this.opts.container);
    }

    activate() {
      this.setEditable(true);
      this.elem.focus();
      this.dispatchEvent(new widget.Event('active'));
    }

    setEditable(value) {
      this.elem.setBoolAttribute('contenteditable', value);
      this.container.setActiveClass(value);
    }

    isEditable() {
      return this.elem.hasAttribute('contenteditable');
    }

    selectText() {
      const textTags = selectionUtil.getTagsOfSelectionText();
      this.dispatchEvent(new widget.Event('textselect', textTags));
    }
  },

  init() {
    const [toolsCheckBox] = app.ToolsCheckBox.init('.tools');
    const contents = app.Content.init('.content', { 
      container: '.text-block' 
    });

    toolsCheckBox.addEventListener('wgt_tool', e => {
      app.execCommand(e.detail);
    });

    for (const content of contents) {
      content.addEventListener('focusin', () => {
        toolsCheckBox.canToggle = true;
      });

      content.addEventListener('focusout', e => {
        const canStayInFocus = causer => {
          if (causer.isTextNode) causer = causer.parentNode;
          return !!causer.closest('button');
        };

        if (canStayInFocus(e.explicitOriginalTarget)) {
          // В текущем потоке не получится установить фокус
          setTimeout(() => e.target.focus());
          return;
        }

        toolsCheckBox.resetItems();
        toolsCheckBox.canToggle = false;
      });

      content.addEventListener('wgt_active', e => {
        const cnt = contents.find(c => c.elem !== e.target);
        if (cnt) cnt.setEditable(false);
      });

      content.addEventListener('wgt_textselect', e => {
        toolsCheckBox.resetItems();
        for (const item of toolsCheckBox.items) {
          if (e.detail.some(tag => tag === item.dataset.tag))
            widget.CheckBox.checkItem(item);
        }
      });
    }

    document.addEventListener('mousedown', e => {
      if (e.detail < 2 || e.target.closest('.content, button')) return;
      contents.filter(cnt => cnt.isEditable())
        .forEach(cnt => cnt.setEditable(false));
    });
  },

  execCommand({ command, value }) {
    document.execCommand(command, false, value);
  },
};

app.init();
