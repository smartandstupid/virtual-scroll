import cloneDeep from 'lodash.clonedeep'
import deepEqual from 'fast-deep-equal'
import ScrollFacade from './ScrollFacade'
import ScrollHandler from './ScrollHandler'
import LayoutHandler from './LayoutHandler'
import CollectionHandler from './CollectionHandler'

export default {
  name: 'VirtualScroll',
  props: {
    grid: {
      type: Number,
      default: null,
    },
    index: {
      type: Number,
      default: 100,
    },
    min: {
      type: Number,
      default: 4,
    },
    collection: {
      type: Array,
      default: () => [],
    },
    total: {
      type: Number,
      default: 0,
    },
    scrollSelector: {
      type: [String, Object],
      default: null,
    },
    isTable: {
      type: Boolean,
      default: false,
    },
    classes: {
      type: Array,
      default: () => [],
    },
    ScrollHandlerClass: {
      type: Function,
      default: ScrollHandler,
    },
    LayoutHandlerClass: {
      type: Function,
      default: LayoutHandler,
    },
    CollectionHandlerClass: {
      type: Function,
      default: CollectionHandler,
    },
  },
  data() {
    return {
      displayCollectionPromises: [],
      displayCollection: [],
      scrollElement: null,
      collectionHandler: null,
      scrollHandler: null,
      scrollFacade: null,
      layoutSize: null,
      layoutShift: 0,
    }
  },
  watch: {
    collection: {
      immediate: true,
      handler(collection) {
        if (
          !process.client ||
          (this.scrollFacade &&
            deepEqual(
              collection.map(({ index: i }) => i),
              this.scrollFacade.currentCollection.map(({ index: i }) => i)
            ))
        ) {
          return
        }
        if (this.scrollFacade) {
          this.scrollFacade.setCollection(this.buildContext(collection))
          return
        }
        this.$nextTick(() => {
          this.initScrollFacade()
          this.scrollFacade.setCollection(this.buildContext(collection))
        })
      },
    },
  },
  beforeDestroy() {
    if (this.scrollFacade) {
      this.scrollFacade.destroyScroll()
    }
  },
  methods: {
    buildContext(collection = this.collection) {
      return {
        collection: cloneDeep(collection),
        total: this.total,
        minDisplayCollection: this.min,
        index: this.index,
        setDisplayCollection: this.setDisplayCollection,
      }
    },
    initScrollFacade() {
      this.setupScrollElement()
      const {
        scrollHandler,
        collectionHandler,
        layoutHandler,
      } = this.initScrollHandlers()
      this.scrollFacade = new ScrollFacade({
        scrollHandler,
        collectionHandler,
        layoutHandler,
        setDisplayCollection: this.setDisplayCollection,
        grid: this.grid,
      })
      this.scrollFacade.initScroll()
    },
    initScrollHandlers() {
      const layoutHandler = new this.LayoutHandlerClass({
        scrollElement: this.scrollElement,
        layoutElement: this.$el,
        setLayoutShift: this.setLayoutShift,
        setLayoutSize: this.setLayoutSize,
      })
      this.scrollHandler = new this.ScrollHandlerClass({
        layoutHandler,
        scrollElement: this.scrollElement,
      })
      this.collectionHandler = new this.CollectionHandlerClass({
        layoutHandler,
      })
      layoutHandler.registerCollectionHandler(this.collectionHandler)
      return {
        scrollHandler: this.scrollHandler,
        collectionHandler: this.collectionHandler,
        layoutHandler,
      }
    },
    setupScrollElement() {
      this.scrollElement = this.scrollSelector
        ? this.scrollSelector === 'document'
          ? window
          : document.querySelector(this.scrollSelector)
        : document.documentElement || document.body
    },
    /*
     *
     *  Методы обеспечивающие взаимодействие с Vue
     *
     */
    setDisplayCollection({ displayCollection, viewingIndexes }) {
      console.log(
        'VirtualScroll:setDisplayCollection displayCollection.length',
        displayCollection.length
      )
      this.$set(this, 'displayCollection', displayCollection)
      if (viewingIndexes) {
        this.$emit('view', viewingIndexes)
      }
    },
    setLayoutSize(layoutSize) {
      this.layoutSize = layoutSize
    },
    setLayoutShift(size) {
      this.layoutShift = size
    },
  },
  render(h) {
    return h(
      'div',
      {
        class: {
          'scroll-container': true,
          ...Object.fromEntries(this.classes.map((i) => [i, true])),
        },
        style: {
          boxSizing: 'border-box',
          [this.isHorizontal ? 'width' : 'height']: this.layoutSize
            ? `${this.layoutSize}px`
            : 'auto',
          paddingTop: `${this.layoutShift}px`,
          // transform: `matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,${this.layoutShift},0,1)`,
          // transform: `translateY(${this.layoutShift}px)`,
        },
      },
      [
        this.$scopedSlots.default &&
          this.$scopedSlots.default({
            displayCollectionPromises: this.isTable /* || notMeasuring */
              ? this.displayCollectionPromises
              : [],
            displayCollection: this.displayCollection,
          }),
      ]
    )
  },
}
