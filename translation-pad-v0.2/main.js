String.prototype.format = function() {
  return this.replace(/{(\d+)}/g, (match, number) => { 
    return typeof arguments[number] != 'undefined' 
      ? arguments[number] 
      : match
    ;
  });
};

Array.prototype.remove = function (item) {
  const index = this.findIndex(item);
  return ~index ? this.splice(index, 1) : index;
};

FormData.prototype.toPlainObj = function () {
  const obj = {};

  for (let [key, value] of this) {
    if (!key.endsWith('[]')) {
      obj[key] = value;
      continue;
    }

    key = key.substring(0, key.length - 2);
    if ((key in obj) === false) 
      obj[key] = [];

    obj[key].push(value);
  }

  return obj;
};

Node.prototype.formatText = function (...args) {
  this.textContent = this.textContent.format(...args);
};

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

  // getParentTags({ localName, parentNode }, contentTag, initialList = []) {
  //   // Св-во localName - это название тега в нижнем регистре 
  //   if (localName) {
  //     if (localName === contentTag) 
  //       return initialList;
        
  //     initialList.push(localName);
  //   }

  //   return selectionUtil.getParentTags(parentNode, contentTag, initialList);
  // },

  getParentTags({ tagName, parentNode }, contentTag, initialList = []) {
    if (tagName) {
      tagName = tagName.toLowerCase();
      if (tagName === contentTag) return initialList;
      initialList.push(tagName);
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

    findChild(selector) {
      return this.elem.querySelector(selector);
    }

    static initAll(selector, opts) {
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
      // const item = e.target;
      // if (item.hasClass(this.item))
      //   this.toggleItem(item);

      const item = e.target;
      if ([].some.call(this.items, it => it === item))
        this.toggleItem(item);
    });
  }

  get items() {
    return this._items ??= this.elem.querySelectorAll(this.opts.item);
  }

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

widget.Dialog = class extends widget.Widget {
  open() { this.elem.showModal(); }
  close() { this.elem.close(); }
};

const app = {

  Toolbar: class extends widget.CheckBox {

    static commandMap = {
      'foreColor': ['red', 'black'],
      'bold': ['on', 'off'],
      'italic': ['on', 'off'],
      'strikeThrough': ['on', 'off'],
      'backColor': ['yellow', 'white'],
    }

    canToggle = false;

    constructor(elem, opts) {
      super(elem, opts);

      this.addEventListener('wgt_itemtoggle', e => {
        const { item, isActive } = e.detail;
        const { command } = item.dataset;
        const [val1, val2] = app.Toolbar.commandMap[command];
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

      this.addEventListener('click', e => {
        if (e.target.localName !== 'span') return;
        console.log('show dialog');
      });

      this.addEventListener('mousedown', e => {
        if (e.detail > 1 && !this.isEditable()) {
          e.preventDefault(); // Предотвращаем выделение
          this.activate();
          this.onSelectText();
        }
      });

      this.addEventListener('mouseup', () => {
        if (!this.isEditable()) return;
        this.onSelectText();
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

    onSelectText() {
      const textTags = selectionUtil.getTagsOfSelectionText();
      this.dispatchEvent(new widget.Event('textselect', textTags));
    }
  },

  DictDialog: (() => {
    const TypeBlock = class {
      static typesMap = {
        'noun': 'Существительные',
        'adjective': 'Прилагательные',
        'adverb': 'Наречия',
        'verb': 'Глаголы',
        'phrasal_verb': 'Фразовые глаголы',
        'idiom': 'Устойчивые связки (идиомы)',
      }

      constructor(elem) { this.elem = elem; }

      build({ words, type }) {
        const clone = this.elem.cloneNode(true);

        clone.removeAttribute('hidden');
        clone.dataset.type = type;
        
        clone.querySelector('.title')
          .formatText(TypeBlock.typesMap[type]);

        clone.querySelector('.text')
          .formatText(words[0], words[1]);

        return clone;
      }
    };

    const Words = (() => {
      const mergeNode = (container, node) => {
        container.append(node);
      };

      return class {
        constructor(elem) { this.elem = elem; }
  
        add(data, typeBlock) {
          mergeNode(this.elem, typeBlock.build(data));
        }

        addBy(formData, typeBlock) {
          this.add(formData.toPlainObj(), typeBlock);
        }
      };
    })();

    return class extends widget.Dialog {
      constructor(elem, opts) {
        super(elem, opts);

        this.addEventListener('click', e => {
          const elem = e.target;
          const { action } = elem.dataset;

          if (!action) return;
          e.preventDefault();

          switch (action) {
            case 'add': this.addWord(this.form, this.typeBlock); break;
            case 'edit': this.editWord(elem); break;
            case 'remove': this.removeWord(elem); break;
          }
        });
      }

      addWord(form, typeBlock) {
        this.words.addBy(new FormData(form), typeBlock);
      }

      editWord(target) {
      }

      removeWord(target) {
      }

      get form() {
        return this._form ??= this.findChild(this.opts.form);
      }

      get words() {
        return this._words ??= new Words(this.findChild(this.opts.words));
      }

      get typeBlock() {
        return this._typeBlock ??= new TypeBlock(this.findChild(this.opts.typeBlock));
      }
    };
  })(),

  init() {
    const [toolbar] = app.Toolbar.initAll('.toolbar', { item: '.tool' });
    const contents = app.Content.initAll('.content', { container: '.text-block' });

    const dictBtn = document.querySelector('#dictionary');
    const [dictDialog] = app.DictDialog.initAll('#dict_dialog', {
      form: 'form',
      words: '.words',
      typeBlock: '.type-block',
    });

    toolbar.addEventListener('wgt_tool', e => {
      app.execCommand(e.detail);
    });

    dictBtn.addEventListener('click', () => dictDialog.open());

    for (const content of contents) {
      content.addEventListener('focusin', () => {
        toolbar.canToggle = true;
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

        toolbar.resetItems();
        toolbar.canToggle = false;
      });

      content.addEventListener('wgt_active', e => {
        const cnt = contents.find(c => c.elem !== e.target);
        if (cnt) cnt.setEditable(false);
      });

      content.addEventListener('wgt_textselect', e => {
        toolbar.resetItems();
        for (const item of toolbar.items) {
          if (e.detail.some(tag => tag === item.dataset.tag))
            widget.CheckBox.checkItem(item);
        }
      });
    }

    document.addEventListener('mousedown', e => {
      if (e.detail < 2) return;

      const inAvailableArea = elem => 
        !!elem.closest('.content, button, dialog');

      if (inAvailableArea(e.target)) return;

      const editables = contents.filter(cnt => cnt.isEditable());
      editables.forEach(cnt => cnt.setEditable(false));
    });
  },

  execCommand({ command, value }) {
    document.execCommand(command, false, value);
  },
};

app.init();

