// String.prototype.capitalize = function () {
//   return this.charAt(0).toUpperCase() + this.slice(1);
// };

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

// const selectionUtil = {
//   getTagsOfSelectionText() {
//     const selection = document.getSelection();
//     if (selection.rangeCount > 1) return [];
//     return selectionUtil.getContainerTags(selection);
//   },

//   getContainerTags(selection) {
//     const container = selectionUtil.getContainer(selection);
//     if (!container) return [];
//     return selectionUtil.getParentTags(container, 'div');
//   },

//   getContainer(selection) {
//     // Если взять обычный startContainer или endContainer, то все будет работать, но
//     // через раз, т.к. иногда выделение прихватывает для одного из контейнеров соседние ноды.
//     // Поэтому, правильные условия для нужного контейнера будут такими:

//     // startContainer === endContainer -> startContainer
//     // startContainer.textContent === selection.toString() -> startContainer
//     // endContainer.textContent === selection.toString() -> endContainer

//     const { startContainer, endContainer } = selection.getRangeAt(0);

//     if (startContainer === endContainer)
//       return startContainer;

//     switch (selection.toString()) {
//       case startContainer.textContent: return startContainer;
//       case endContainer.textContent: return endContainer;
//     }

//     return null;
//   },

//   getParentTags({ localName, parentNode }, breakTag, initialList = []) {
//     // Св-во localName - это название тега в нижнем регистре 
//     if (localName) {
//       if (localName === breakTag) return initialList;
//       initialList.push(localName);
//     }

//     return selectionUtil.getParentTags(parentNode, breakTag, initialList);
//   },

//   hasSelectionText() {
//     const selection = document.getSelection();
//     return !selection.isCollapsed;
//   }
// };

const selectionUtil = {
  getTagsOfSelectionText() {
    this.temp();
    return [];
  },

  temp() {
    const selection = document.getSelection();
    const range = selection.getRangeAt(0);

    let { startContainer, startOffset, endContainer, endOffset, 
      commonAncestorContainer } = range;

    const isTextNode = ({ nodeType }) => nodeType === Node.TEXT_NODE;

    // Получает самый верхний узел, чтобы его можно было найти 
    // среди дочерних commonAncestorContainer
    const fn = (node, breakNode) => {
      const { parentNode } = node;
      if (parentNode === breakNode) return node;
      return fn(parentNode, breakNode);      
    };

    // Получает кол-во дочерних узлов нода (когда диапазон задается через элементы 
    // а не текстовые ноды, то offset должен иметь как раз такое значение)
    const fn2 = (node, prop, index = 0) => {
      const child = node[prop];
      if (!child) return index;
      return fn2(child, prop, ++index);
    };

    console.clear();

    // Клик по слову либо выделение в пределеах одного текстового нода
    if (startContainer === endContainer) {
      console.log(startContainer);
      return;
    } 

    // Прихвачен мусорный нод слева
    if (startOffset === startContainer.textContent.length) {
      startContainer = fn(startContainer, commonAncestorContainer);
      startContainer = startContainer.nextSibling;
      startOffset = isTextNode(startContainer) ? 0 : fn2(startContainer, 'firstChild');
    } 

    // Прихвачен мусорный нод справа
    if (endOffset === 0) {
      endContainer = fn(endContainer, commonAncestorContainer);
      endContainer = endContainer.previousSibling;
      endOffset = isTextNode(endContainer) ? 
        endContainer.textContent.length : fn2(endContainer, 'lastChild');
    }

    // // Прихвачен любой нод слева
    // if (startOffset > 0) {
    //   startContainer = fn(startContainer, commonAncestorContainer);
    //   startContainer = startContainer.nextSibling;
    //   startOffset = isTextNode(startContainer) ? 0 : fn2(startContainer, 'firstChild');
    // } 

    // // Прихвачен любой нод справа
    // if (endOffset !== endContainer.textContent.length) {
    //   endContainer = fn(endContainer, commonAncestorContainer);
    //   endContainer = endContainer.previousSibling;
    //   // Здесь длина текста уже не такая, как в условии выше, т.к. нод уже изменился
    //   endOffset = isTextNode(endContainer) ? 
    //     endContainer.textContent.length : fn2(endContainer, 'lastChild');
    // }
    
    const newRange = document.createRange();
    newRange.setStart(startContainer, startOffset);
    newRange.setEnd(endContainer, endOffset);

    console.log(newRange.commonAncestorContainer);    
  },

  getTagsOfSelectionTextObsolete() {
    const selection = document.getSelection();
    const range = selection.getRangeAt(0);

    const fn = (node, breakNode) => {
      const { parentNode } = node;
      if (parentNode === breakNode) return node;
      return fn(parentNode, breakNode);      
    };

    const bfs = (tree, outRes) => {
      const children = [];

      for (const { childNodes, ...rest } of tree) {
        outRes.push(rest);
        for (const child of childNodes)
          children.push(child)
      }

      if (children.length) bfs(children, outRes);
    };

    const isTextNode = ({ nodeType }) => nodeType === Node.TEXT_NODE;
    const { childNodes } = range.commonAncestorContainer;

    console.clear();

    // Когда выделяется нестилизованный текст либо когда выделенный 
    // текст соответствует тексту общего контейнера
    if (!childNodes.length) {
      console.log(range.commonAncestorContainer);
      return [];
    }

    // Нужно помнить, что в разных ситуациях startNode и endNode 
    // могут быть как текстовыми узлами так и элементами

    let startNode = fn(range.startContainer, range.commonAncestorContainer);
    if (range.startOffset === startNode.textContent.length)
      startNode = startNode.nextSibling;

    let endNode = fn(range.endContainer, range.commonAncestorContainer);
    if (range.endOffset === 0)
      endNode = endNode.previousSibling;

    // Срабатывает, когда выделенное слово или фраза прихватыват пустой узел.
    // Это происходит когда курсор находится немного дальше от края в момент выделения.
    if (startNode === endNode) {
      console.log(startNode);
      return [];
    }

    // Если в выделение попадают несколько узлов, то возвращаться должен текстовый, 
    // т.к. именно он содержит минимальный набор тегом среди всего перечня

    if (isTextNode(startNode)) {
      console.log(startNode);
      return [];
    }

    if (isTextNode(endNode)) {
      console.log(endNode);
      return [];
    }

    const startIndex = [].findIndex.call(childNodes, node => node === startNode);
    const endIndex = [].findIndex.call(childNodes, node => node === endNode);
    const middleNodes = [].slice.call(childNodes, startIndex + 1, endIndex);

    const textNodeInMiddle = middleNodes.find(node => isTextNode(node));
    if (textNodeInMiddle) {
      console.log(textNodeInMiddle);
      return [];
    }

    // Если ни один из узлов не является текстовым, тогда надо найти тот узел, 
    // который имеет минимальный набор, общих для всех, тегов. 
    // Если и такого узла нет, то вернуть общий контейнер.

    const selNodes = [startNode, ...middleNodes, endNode];
    console.log(selNodes);

    return [];
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
    constructor(type, data, wgt) {
      super(`wgt_${type}`, { detail: { ...data, wgt } });
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
    this.onItemToggle(item, item.toggleClass('active'));
  }

  onItemToggle(item, isActive) {
    this.dispatchEvent(new widget.Event('itemtoggle', { item, isActive }, this));
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
          e.preventDefault();
          this.activate();

          // TODO: Добавить событие выбора текста при двойном щелчке, т.к. если обрабатывать 
          // только 1 mouseup то можно попасть на слово, которое разделено стилизацей пополам, 
          // и вместо того, чтобы вернуть для него пустой массив тегов, вернется те теги, 
          // на которые указывает курсор. Подумать, как можно это реализовать, 
          // чтобы не пересекаться с событием 1 mouseup... 
        }
      });

      this.addEventListener('mouseup', e => {
        if (e.detail === 1 && this.isEditable())
          this.onTextSelection(selectionUtil.getTagsOfSelectionText());
      });


    }

    activate() {
      // TODO: Вызывать также событие выделения текста, чтобы сразу, 
      // после двойного щелчка, получить стили 
      this.setEditable(true);
      this.elem.focus();
    }

    setEditable(value) {
      this.elem.setBoolAttribute('contenteditable', value);
    }

    isEditable() {
      return this.elem.hasAttribute('contenteditable');
    }

    onTextSelection(textTags) {
      this.dispatchEvent(new widget.Event('textselection', { textTags }, this));
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

    // Здесь нет связи с другими виджетами. Поэтому весь этот ф-ционал можно 
    // вынести в конструктор виджета ToolsWgt, вместе с execCommand и commandMap
    toolsWgt.addEventListener('wgt_itemtoggle', e => {
      const { item, isActive } = e.detail;
      const { command } = item.dataset;
      const [val1, val2] = app.commandMap[command];
      app.execCommand(command, isActive ? val1 : val2);
    });

    // BUG: Если одинаково стилизовать несколько слов по отдельности, а затем выделить их вместе 
    // и стилизовать снова, то при следующем выделении панель с инструметами ничего не покажет. 
    // Это из-за того, что когда слова стилизуются по отдельности пробле между ними заменяется 
    // на "whitespace". Нужно как-то игнорировать его, или удалять при повторной стилизации.

    for (const cnt of contents) {
      cnt.addEventListener('wgt_textselection', e => {
        for (const item of toolsWgt.items) {
          if (e.detail.textTags.some(tag => tag === item.dataset.tag))
            widget.CheckBox.checkItem(item);
        }
      });
    }

    document.addEventListener('selectionchange', () => {
      if (!selectionUtil.hasSelectionText())
        toolsWgt.resetItems();
    });

    // Перехватываем события на этапе "погружения", чтобы обработать их первее
    document.addEventListener('mousedown', e => {
      if (e.detail === 2) {
        // Выбираем ближейшего предка т.к. при стилизации узлы разбиваются на подузлы
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
};

app.init();
