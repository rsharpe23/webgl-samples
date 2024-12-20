// String.prototype.capitalize = function () {
//   return this.charAt(0).toUpperCase() + this.slice(1);
// };

// HTMLElement.prototype.hasClass = function (className) {
//   return this.classList.contains(className);
// };

HTMLElement.prototype.setStateAttr = function (attr, state) {
  if (state) 
    this.setAttribute(attr, '');
  else
    this.removeAttribute(attr);
};

const selectionUtil = {
  getTagsOfSelectionText() {
    const selection = window.getSelection();
    if (selection.rangeCount > 1) return [];
    return selectionUtil.getContainerTags(selection);
  },

  getContainerTags(selection) {
    const container = selectionUtil.getContainer(selection);
    if (!container) return [];
    return selectionUtil.getParentTags(container, 'div');
  },

  getContainer(selection) {
    // Если взять обычный startContainer или endContainer, то будет работать, но
    // через раз, т.к. иногда выделение прихватывает для одного из них соседние ноды.

    // Поэтому, правильные условия для нужного контейнера будут такими:
    // startContainer === endContainer -> startContainer
    // startContainer.textContent === selection.toString() -> startContainer
    // endContainer.textContent === selection.toString() -> endContainer

    const { startContainer, endContainer } = selection.getRangeAt(0);

    if (startContainer === endContainer)
      return startContainer;

    switch (selection.toString()) {
      case startContainer.textContent: return startContainer;
      case endContainer.textContent: return endContainer;
    }

    return null;
  },

  getParentTags({ localName, parentNode }, breakTag, initialList = []) {
    // Св-во localName - это название тега в нижнем регистре 
    if (localName) {
      if (localName === breakTag) return initialList;
      initialList.push(localName);
    }

    return selectionUtil.getParentTags(parentNode, breakTag, initialList);
  },

  hasSelectionText() {
    const selection = window.getSelection();
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
    constructor(type, data, wgt) {
      super(`wgt_${type}`, { detail: { ...data, wgt } });
    }
  },
};

widget.CheckBox = class extends widget.Widget {
  constructor(elem) {
    super(elem);
    this.addEventListener('click', e => this.toggleItem(e.target));
  }

  get items() {
    return this._items ??= this.elem.getElementsByClassName(this.itemClass);
  }

  get itemClass() { return this.dataset.item; }

  toggleItem(item) {
    this.toggleItemRaw(item, isActive => this.onItemToggle(item, isActive));
  }

  toggleItemRaw({ classList }, callback) {
    if (!classList.contains(this.itemClass)) return;
    callback(classList.toggle('active'));
  }

  onItemToggle(item, isActive) {
    this.dispatchEvent(new widget.Event('itemtoggle', { item, isActive }, this));
  }

  resetItems() {
    for (const { classList } of this.items)
      classList.remove('active');
  }
};

const app = {

  Content: class extends widget.Widget {
    constructor(elem) {
      super(elem);

      this.addEventListener('mousedown', e => {
        // HACK: Удаляем старое выделене от двойного щелчка, т.к. если кликнуть 
        // по нему заново, то getTagsOfSelectionText() вернет пустой массив.
        if (e.detail === 1 && this.isEditable()) {
          const selection = window.getSelection();
          if (!selection.isCollapsed) 
            selection.removeAllRanges();
        }

        if (e.detail === 2 && !this.isEditable()) {
          e.preventDefault();
          this.activate();
        }
      });

      this.addEventListener('mouseup', e => {
        if (e.detail === 1 && this.isEditable())
          this.onSelection(selectionUtil.getTagsOfSelectionText());
      });
    }

    activate() {
      this.setEditable(true);
      this.elem.focus();
    }

    setEditable(value) {
      this.elem.setStateAttr('contenteditable', value);
    }

    isEditable() {
      return this.elem.hasAttribute('contenteditable');
    }

    onSelection(textTags) {
      this.dispatchEvent(new widget.Event('selection', { textTags }, this));
    }
  },

  commandMap: {
    'foreColor': ['red', 'black'],
    'bold': ['on', 'off'],
    'italic': ['on', 'off'],
    'strikeThrough': ['on', 'off'],
    'backColor': ['yellow', 'white'],
  },

  execCommand(commandId, value) {
    document.execCommand(commandId, false, value);
  },

  init() {
    const [toolsWgt] = widget.CheckBox.init('.tools');
    const contents = app.Content.init('.content');

    toolsWgt.addEventListener('wgt_itemtoggle', e => {
      const { item, isActive } = e.detail;
      const { command } = item.dataset;
      const [val1, val2] = app.commandMap[command];
      app.execCommand(command, isActive ? val1 : val2);
    });

    for (const cnt of contents) {
      cnt.addEventListener('wgt_selection', e => {
        const { textTags } = e.detail;
        toolsWgt.resetItems();
        for (const item of toolsWgt.items) {
          const { tag } = item.dataset;
          if (textTags.some(t => t === tag))
            toolsWgt.toggleItemRaw(item, () => {});
        }
      });
    }

    // Перехватываем события на этапе "погружения", чтобы обработать его первее
    document.addEventListener('mousedown', e => {
      if (e.detail === 2) {
        // Выбираем ближейшего предка т.к. при стилизации узлы разбиваются на подузлы
        const elem = e.target.closest('.content');
        
        for (const cnt of contents) {
          // Пропускаем поле, иначе не будет выделяться текст в режиме редактирования
          if (cnt.elem === elem && cnt.isEditable()) 
            continue;
          else
            cnt.setEditable(false);
        }
      }
    }, { capture: true });


    document.addEventListener('click', e => {
      // if (selectionUtil.hasSelectionText())
    });

  },
};

app.init();
