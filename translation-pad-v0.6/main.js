Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

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

// Node.prototype.formatText = function (...args) {
//   this.textContent = this.textContent.format(...args);
// };

Object.defineProperties(Node.prototype, {
  textLength: {
    get() { return this.textContent.length; }
  },

  isTextNode: {
    get() { return this.nodeType === Node.TEXT_NODE; } 
  }
});

Object.assign(Node.prototype, {
  format(...args) {
    this.textContent = this.textContent.format(...args);
  },

  closestElement(selector) {
    const that = this.isTextNode ? this.parentNode : this;
    return that.closest(selector);
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

const objectUtil = {
  findIndexOfKey(obj, key) {
    const keys = Object.keys(obj);
    return keys.findIndex(k => k === key);
  }
};

// По контейнеру можно определить ближайшего "желтого" предка и подставить 
// ему свой id, чтобы выводить связанную с ним подсказку.

const selectionUtil = {
  getSelection() {
    return (selection => {

      const container = selectionUtil.getContainer(selection);
      const tags = selectionUtil.getTags(container, 'div');
      return { container, tags };

    })(document.getSelection());
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

    return f.container(startContainer, startOffset, endContainer, endOffset);
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
    container(sNode, sOffset, eNode, eOffset) {
      const range = document.createRange();
      range.setStart(sNode, sOffset);
      range.setEnd(eNode, eOffset);
      return range.commonAncestorContainer;
    },
  }),

  getTags: ({ tagName, parentNode }, breakTag, initialList = []) => {
    if (tagName) {
      tagName = tagName.toLowerCase();
      if (tagName === breakTag) return initialList;
      initialList.push(tagName);
    }

    return selectionUtil.getTags(parentNode, breakTag, initialList);
  },
};

const widget = {
  Widget: class {
    constructor(elem, opts = {}) { 
      this.elem = elem; 
      this.opts = opts;
    }

    get hidden() { return this.elem.hidden; }
    set hidden(value) { this.elem.hidden = value; };

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
      const item = e.target;
      if ([].includes.call(this.items, item))
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

widget.Tooltip = (() => {
  // По хорошему наследоваться от какого-нибудь 
  // WidgetBase, который без событий, но с конструктором
  const Arrow = (() => {
    const calcOffset = (targetOffset, parentSize, width, gap) => {
      const offset = targetOffset - parentSize.left - width / 2;
      return offset.clamp(gap, parentSize.width - (width + gap));
    }

    return class {
      constructor(elem, opts) {
        this.elem = elem;
        this.opts = opts;
      }
  
      get style() { return this.elem.style; }
      get width() { return this.opts.width; }
      
      /** Минимальное смещение стрелки от края */
      get gap() { return this.opts.gap; }
  
      setOffset(targetOffset, parentLeft, parentWidth) {
        const parentSize = { left: parentLeft, width: parentWidth }; 
        const offset = calcOffset(targetOffset, parentSize, this.width, this.gap);
        this.style.left = offset + 'px';
      }
    };
  })();

  const getTop = ({ top, height }) => top + height + window.scrollY + 2;

  const getLeft = (width, targetCenterX, cntrRect, offset) => {
    const halfWidth = width / 2;

    if (targetCenterX - cntrRect.left < halfWidth)
      return cntrRect.left + offset;

    if (cntrRect.right - targetCenterX < halfWidth)
      return cntrRect.right - width - offset;

    return targetCenterX - halfWidth;
  };

  return class extends widget.Widget {
    get arrow() {
      if (!this._arrow) {
        const elem = this.findChild(this.opts.arrow);
        this._arrow = new Arrow(elem, { width: 20, gap: 10 });
      }

      return this._arrow;
    }

    get offset() { return this.opts.offset; }

    open(target) {
      this.hidden = false;
      this.setOffsetBy(target);
    }

    setOffsetBy(target) {
      const targetRect = target.getBoundingClientRect();

      // HACK: Здесь контейнер захардкоден, т.к. архитектура toolbar предполагает 
      // что каждый item - это html-элемент, а нужно чтобы он был классом 
      // с нужными свойствами, типа container и т.п.
      const cntrRect = target.closest('.content')
        .getBoundingClientRect();

      this.setOffset(targetRect, cntrRect);
    }

    setOffset(targetRect, cntrRect) {
      const { style, offsetWidth } = this.elem;
      const targetCenterX = targetRect.left + targetRect.width / 2;

      style.top = getTop(targetRect) + 'px';
      style.left = getLeft(offsetWidth, targetCenterX, 
        cntrRect, this.offset) + 'px';

      // Здесь важно передавать уже пересчитанный offsetLeft
      this.arrow.setOffset(targetCenterX, this.elem.offsetLeft, offsetWidth);
    }

    close() {
      this.hidden = true;
    }
  };

})();

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
        // TODO: Попробовать и здесь использовать паттерн "Команда"
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

      this.addEventListener('click', () => {
        if (!this.isEditable()) return;
        this.onSelectText();
      });

      this.addEventListener('mousedown', e => {
        if (e.detail > 1 && !this.isEditable()) {
          e.preventDefault(); // Предотвращаем выделение
          this.activate();
        }
      });
    }

    get container() {
      return this._container 
        ??= this.elem.closest(this.opts.container);
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
      const selection = selectionUtil.getSelection();
      this.dispatchEvent(new widget.Event('textselect', selection));
    }
  },

  Tooltip: class extends widget.Tooltip {
    static triggerTag = 'span';

    constructor(elem, opts) {
      super(elem, opts);
      this.content.addEventListener('focusout', 
        e => this.onBlur(e.explicitOriginalTarget));
    }

    get content() {
      return this._content ??= this.findChild(this.opts.content);
    }

    onBlur(causer) {
      // Событие focusout можно отменить, а это событие 
      // отменить не получится. Поэтому blur.
      this.dispatchEvent(new widget.Event('blur', causer));
    }
  },

  DictDialog: (() => {
    const cloneTypeBlock = templNode => {
      const typesMap = {
        'noun': 'Существительные',
        'adjective': 'Прилагательные',
        'adverb': 'Наречия',
        'verb': 'Глаголы',
        'phrasal_verb': 'Фразовые глаголы',
        'idiom': 'Устойчивые связки (идиомы)',
      };

      const getOrderFor = type => 
        objectUtil.findIndexOfKey(typesMap, type);

      const fillNodeByData = (node, { type, words }) => {
        node.dataset.type = type;
        node.dataset.order = getOrderFor(type);
  
        node.querySelector('.title')
            .formatText(typesMap[type]);

        node.querySelector('.text')
            .formatText(words[0], words[1]);

        node.hidden = false;
      };

      const fillNode = (node, formData) => {
        fillNodeByData(node, formData.toPlainObj());
      };

      return formData => {
        const node = templNode.cloneNode(true);
        fillNode(node, formData);
        return node;
      };
    };

    // Вместо замыканий можно сделать каждую команду объектом с методом exec 
    // и вспомогательные ф-ции стали бы доступны в других командах
    const commands = {
      add(wgt) {
        const findSameNode = (node, container) => {
          const { type } = node.dataset;
          return container.querySelector(`[data-type=${type}]`);
        };

        const findNextNode = (node, { children }) => {
          const { order } = node.dataset;
          return [].find.call(children, 
            child => child.dataset.order > order);
        };
          
        const insertItemOfNode = (node, sameNode) => {
          const list = sameNode.querySelector('.list');
          list.append(node.querySelector('.item'));
        };

        const insertNode = (node, container) => {
          const sameNode = findSameNode(node, container);
          if (sameNode) {
            insertItemOfNode(node, sameNode);
            return;
          }

          const nextNode = findNextNode(node, container);
          if (nextNode) {
            container.insertBefore(node, nextNode);
            return;
          }
  
          container.append(node);
        };
  
        return target => {
          const { form, words, typeBlock } = wgt;

          const typeBlockFn = cloneTypeBlock(typeBlock);
          insertNode(typeBlockFn(new FormData(form)), words);

          form.reset();
        };
      },

      update(wgt) {
        const changeControlOf = ({ control }) => {
          const { dataset } = control;
          control.textContent = dataset.addText;
          dataset.command = 'add';
        };

        const removeAndAddNew = target => {
          wgt.execCommand('remove', target).execCommand('add');
        };  

        return target => {
          const { form } = wgt;
          const { targetNode } = form;

          changeControlOf(form);
          removeAndAddNew(targetNode);

          form.targetNode = null;
        };
      },

      edit(wgt) {
        const takeWords = ({ textContent }) => {
          let words = textContent.split('-');
          return words.map(word => word.trim());
        };

        const getWordType = node => {
          const { dataset } = node.closest('.type-block');
          return dataset.type;
        };

        const fillInputsOfForm = (form, wordsFromText) => {
          const inputs = form['words[]'];
          wordsFromText.forEach((word, index) => {
            inputs[index].value = word;
          });
        };

        const fillForm = (form, wordsFromText, wordType) => {
          fillInputsOfForm(form, wordsFromText);
          form.type.value = wordType;
        };

        const enableInnerContainersOf = node => {
          const containers = node.querySelectorAll('.item.disabled');
          for (const container of containers) 
            container.removeClass('disabled');
        };         

        const disableContainerOf = node => {
          const container = node.closest('.item');
          container.addClass('disabled');
        }

        const changeControlOf = ({ control }) => {
          const { dataset } = control;
          control.textContent = dataset.updateText;
          dataset.command = 'update';
        };

        return target => {
          const { form, words } = wgt;

          const wordsFromText = takeWords(target);
          const wordType = getWordType(target);
          fillForm(form, wordsFromText, wordType);

          enableInnerContainersOf(words);  
          disableContainerOf(target);
          changeControlOf(form);

          form.targetNode = target;
        };
      },
  
      remove(wgt) {
        const removeNode = node => {
          const { children } = node.parentNode;
          if (children.length === 1)
            node = node.closest('.type-block');
  
          node.remove();
        };
  
        return target => {
          removeNode(target.closest('.item'));
        }
      },

      close(wgt) { 
        return target => {
          const { targetNode } = wgt.form;
          if (targetNode) return;
          wgt.close(); 
        };
      }
    };

    return class extends widget.Dialog {
      constructor(elem, opts) {
        super(elem, opts);
        this.setCommands(commands);

        this.addEventListener('click', e => {
          const { command } = e.target.dataset;
          if (!command) return;
          this.execCommand(command, e.target);
          e.preventDefault();
        });
      }

      setCommands(commands) {
        this.commands = {};
        for (const key in commands) {
          if (Object.hasOwnProperty.call(commands, key))
            this.commands[key] = commands[key](this);
        }
      }

      execCommand(command, target) {
        this.commands[command](target);
        this.dispatchEvent(new widget.Event(command));
        return this;
      }

      get form() {
        return this._form ??= this.findChild(this.opts.form);
      }

      get words() {
        return this._words ??= this.findChild(this.opts.words);
      }

      get typeBlock() {
        return this._typeBlock ??= this.findChild(this.opts.typeBlock);
      }
    };
  })(),

  init() {
    const [toolbar] = app.Toolbar.initAll('.toolbar', { item: '.tool' });
    const [tooltip] = app.Tooltip.initAll('.tooltip', { 
      arrow: '.arrow',
      content: '.content',
      offset: 16 // соотвт. padding у .content, для более эстетичного вида
    });

    const contents = app.Content.initAll('.text-block .content', 
      { container: '.text-block' });

    const [dictDialog] = app.DictDialog.initAll('#dict_dialog', { 
      form: 'form', 
      words: '.words', 
      typeBlock: '.type-block' 
    });

    const dictBtn = document.querySelector('#dictionary');
    dictBtn.addEventListener('click', () => dictDialog.open());

    toolbar.addEventListener('wgt_tool', e => {
      app.execCommand(e.detail);
    });

    tooltip.addEventListener('wgt_blur', e => {
      const canClose = causer => 
        !causer.closestElement('.text-block .content');

      // Закрывать можно и без этой проверки. Она лишь убирает неприятный 
      // эффект мерцания, если кликнуть по тому же "желтому" слову, 
      // после того как tooltip уже имел фокус
      if (canClose(e.detail)) 
        tooltip.close();
    });

    for (const content of contents) {
      content.addEventListener('focusin', () => {
        toolbar.canToggle = true;
      });

      content.addEventListener('focusout', e => {
        const canStayInFocus = causer => !!causer.closestElement('button');
        if (canStayInFocus(e.explicitOriginalTarget)) {
          // В текущем потоке не получится установить фокус
          setTimeout(() => e.target.focus());
          return;
        }

        toolbar.resetItems();
        toolbar.canToggle = false;
      });

      content.addEventListener('focusout', e => {
        const canCloseTooltip = causer => 
          !causer.closestElement('.tooltip > .content');

        if (canCloseTooltip(e.explicitOriginalTarget))
          tooltip.close();
      });

      content.addEventListener('wgt_active', e => {
        const cnt = contents.find(c => c.elem !== e.target);
        if (cnt) cnt.setEditable(false);
      });

      content.addEventListener('wgt_textselect', e => {
        toolbar.resetItems();
        for (const item of toolbar.items) {
          if (e.detail.tags.includes(item.dataset.tag))
            widget.CheckBox.checkItem(item);
        }
      });

      content.addEventListener('wgt_textselect', e => {
        const { container, tags } = e.detail;
        const { triggerTag } = app.Tooltip;

        if (tags.includes(triggerTag)) {
          tooltip.open(container.closestElement(triggerTag));
          return;
        }

        tooltip.close();
      });
    }

    document.addEventListener('mousedown', e => {
      if (e.detail < 2) return;

      const inAvailableArea = elem => 
        !!elem.closest('.content, button, dialog');

      if (inAvailableArea(e.target)) return;

      contents.filter(cnt => cnt.isEditable())
              .forEach(cnt => cnt.setEditable(false));
    });
  },

  execCommand({ command, value }) {
    document.execCommand(command, false, value);
  },
};

app.init();