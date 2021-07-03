export default class LayoutHandler {
  _scrollElement = null
  _layoutElement = null

  _countOfDisplayedElementsOnPage = null

  firstCallOccurred = false
  _setLayoutShift = null
  layoutSize = null
  oneElementSize = null

  _layoutShift = null

  _lastComputedLayoutSize = null

  set layoutShift(value) {
    this._layoutShift = value
  }

  get layoutShift() {
    return this._layoutShift
  }

  _setLayoutSize = (layoutSize) => {}

  constructor({ layoutElement, scrollElement, setLayoutShift, setLayoutSize }) {
    this._scrollElement = scrollElement
    this._layoutElement = layoutElement
    this._setLayoutShift = setLayoutShift
    this._setLayoutSize = setLayoutSize
  }

  computeLayoutSize({ total, displayCollectionLength }) {
    this.firstCallOccurred = true
    return (
      Math.ceil(total / displayCollectionLength) * this.getElementSize() // Can be multiply on Approximately how many times will the content stretch after filling with data
    )
  }

  computeOneElementSize(displayCollectionLength, grid) {
    if (!grid) {
      return Math.ceil(this.getElementSize() / displayCollectionLength)
    }
    this.oneElementSize = Math.ceil(
      this.getElementSize() / Math.ceil(displayCollectionLength / grid)
    )
    return this.oneElementSize
  }

  computeOneScreenElementsCount(oneElementSize, grid) {
    this._countOfDisplayedElementsOnPage =
      Math.ceil(
        this.getParentContainerSize() / oneElementSize || this.oneElementSize
      ) * grid
    return this._countOfDisplayedElementsOnPage
  }

  setLayoutSize(layoutSize = this.layoutSize) {
    this._setLayoutSize(layoutSize)
  }

  setLayoutShift(shift) {
    this.layoutShift = shift
    this._setLayoutShift(shift)
  }

  getElementSize() {
    return (
      this._layoutElement.offsetHeight || this._layoutElement.innerHeight || 0
    )
  }

  getParentContainerSize() {
    const parentNode = this._scrollElement.parentNode
    if (
      ['HTML', 'BODY', undefined, null].includes(
        parentNode && parentNode.tagName
      )
    ) {
      return window[this._isHorizontal ? 'innerWidth' : 'innerHeight']
    }
    return parentNode[this._isHorizontal ? 'offsetWidth' : 'offsetHeight']
  }

  initMutationObserver({ total, displayCollectionLength }) {
    return new Promise((resolve) => {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect()
      }
      this.mutationObserver = new MutationObserver(() => {
        if (!this._layoutElement.offsetHeight) {
          return
        }
        const layoutSize = this.computeLayoutSize({
          total,
          displayCollectionLength,
        })
        this.handleMutationObserver(layoutSize)
        if (layoutSize) {
          this.mutationObserver.disconnect()
          resolve({
            layoutSize,
            // TODO: Реализовать установку данного свойства
            displayedElementsCount: this._countOfDisplayedElementsOnPage,
          })
        }
      })
      this.mutationObserver.observe(this._layoutElement, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    })
  }

  handleMutationObserver(layoutSize) {
    this._lastComputedLayoutSize = layoutSize
  }
}
