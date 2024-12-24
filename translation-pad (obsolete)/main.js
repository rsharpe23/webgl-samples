Object.defineProperties(Node.prototype, {
  textLength: {
    get: function () { return this.textContent.length; }
  },
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
    constructor(elem) { this.elem = elem; }

    get dataset() { return this.elem.dataset; }

    addEventListener(type, listener) {
      this.elem.addEventListener(type, listener);
    }

    dispatchEvent(event) {
      this.elem.dispatchEvent(event);
    }

    static init(selector) {
      return [].map.call(document.querySelectorAll(selector), 
        elem => new this(elem));
    }
  },

  Event: class extends CustomEvent {
    constructor(type, detail) {
      super(`wgt_${type}`, { detail });
    }
  },
};

widget.CheckBox = class extends widget.Widget {
  constructor(elem) {
    super(elem);

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

  Content: class extends widget.Widget {
    constructor(elem) {
      super(elem);

      this.addEventListener('mousedown', e => {
        // HACK: Удаляем старое выделене от двойного щелчка, т.к. если кликнуть 
        // по нему заново, то getTagsOfSelectionText() вернет пустой массив.
        if (e.detail === 1 && this.isEditable()) {
          const selection = document.getSelection();
          if (!selection.isCollapsed) 
            selection.removeAllRanges();
        }

        if (e.detail === 2 && !this.isEditable()) {
          e.preventDefault(); // Предотвращаем лишнее выделение
          this.activate();
          this.selectText();
        }
      });

      this.addEventListener('mouseup', e => {
        if (!this.isEditable()) return;
        if (e.detail === 1 || e.detail === 2)
          this.selectText();
      });
    }

    activate() {
      this.setEditable(true);
      this.elem.focus();
    }

    setEditable(value) {
      this.elem.setBoolAttribute('contenteditable', value);
      this.dispatchEvent(new widget.Event('editable', { value }));
    }

    isEditable() {
      return this.elem.hasAttribute('contenteditable');
    }

    selectText() {
      const textTags = selectionUtil.getTagsOfSelectionText();
      this.dispatchEvent(new widget.Event('textselect', { textTags }));
    }
  },

  commandMap: {
    'foreColor': ['red', 'black'],
    'bold': ['on', 'off'],
    'italic': ['on', 'off'],
    'strikeThrough': ['on', 'off'],
    'backColor': ['yellow', 'white'],
  },

  init() {
    const [toolsCheckBox] = widget.CheckBox.init('.tools');
    const contents = app.Content.init('.content');

    // TODO: Блокировать toolsCheckBox пока одно из полей контента не станет активным

    toolsCheckBox.addEventListener('wgt_itemtoggle', e => {
      const { item, isActive } = e.detail;
      const { command } = item.dataset;
      const [val1, val2] = app.commandMap[command];
      app.execCommand(command, isActive ? val1 : val2);
    });

    for (const cnt of contents) {
      cnt.addEventListener('wgt_textselect', e => {
        toolsCheckBox.resetItems();
        for (const item of toolsCheckBox.items) {
          if (e.detail.textTags.some(tag => tag === item.dataset.tag))
            widget.CheckBox.checkItem(item);
        }
      });
    }

    // ToolsCheckBox иногда мерцает при выделениях именно из-за этого события.
    // При клике на ЛКМ toolsCheckBox очищается, а при отпускании снова заполняется
    document.addEventListener('selectionchange', () => {
      if (!selectionUtil.hasSelectionText())
        toolsCheckBox.resetItems();
    });

    // Перехватываем события на этапе "погружения", чтобы обработать их первее
    document.addEventListener('mousedown', e => {
      if (e.detail === 2) {
        // Выбираем ближейшего предка т.к. при стилизации ноды разбиваются на сабноды
        const elem = e.target.closest('.content');

        if (!elem) return;

        for (const cnt of contents) {
          // Пропускаем поле, иначе не будет выделяться текст в режиме редактирования
          if (cnt.elem === elem && cnt.isEditable()) 
            continue;
          else
            cnt.setEditable(false);
        }
      }
    }, { capture: true });
  },

  execCommand(commandId, value) {
    document.execCommand(commandId, false, value);
  },
};

app.init();
