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
    let { startContainer, startOffset, endContainer, endOffset, 
      commonAncestorContainer } = selection.getRangeAt(0);

    // Клик по слову либо выделение в пределеах одного текстового нода
    if (startContainer === endContainer) 
      return startContainer;

    // Прихвачен мусорный нод слева от выделения
    if (startOffset === startContainer.textLength) {
      startContainer = f.closest(startContainer, commonAncestorContainer);
      startContainer = f.deepest(startContainer.nextSibling, 'firstChild');
      startOffset = 0;
    }

    // BUG: Если выбрать два слова, сделать их курсивом, а затем, первое из них, 
    // сделать жирным и выбрать его двойным кликом, то endContainer и endOffset 
    // станут аналогичными startContainer и startOffset.

    // Прихвачен мусорный нод справа от выделения
    if (endOffset === 0) {
      endContainer = f.closest(endContainer, commonAncestorContainer);
      endContainer = f.deepest(endContainer.previousSibling, 'lastChild');
      endOffset = endContainer.textLength;
    }

    return f.commonContainer(startContainer, startOffset, endContainer, endOffset);
  }, {
    // Возвращает самый верхний нод, чтобы его можно было 
    // найти среди потомков commonAncestorContainer
    closest(node, commonNode) {
      const { parentNode } = node;
      if (parentNode === commonNode) return node;
      return this.closest(parentNode, commonNode);      
    },

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
      if (localName === contentTag) return initialList;
      initialList.push(localName);
    }

    return selectionUtil.getParentTags(parentNode, contentTag, initialList);
  },

  hasSelectionText() {
    const selection = document.getSelection();
    return !selection.isCollapsed;
  }
};