const config = require('./config'),
      watchArray = require('../core/observer/watchArray')

module.exports = {
  text (value) {
    this.el.textContent = value || ''
  },
  show (value) {
    this.el.style.display = value ? '' : 'none'
  },
  class (value, classname) {
    this.el.classList[value ? 'add' : 'remove'](classname)
  },
  on: {
    update (handler) {
      var event = this.arg
      if (this.handler) {
        this.el.removeEventListener(event, this.handler)
      }

      if (handler) {
        this.el.addEventListener(event, handler)
        this.handler = handler
      }
    },
    unbind () {
      var event = this.arg
      if (this.handlers) {
        this.el.removeEventListener(event, this.handlers[event])
      }
    }
  },
  for: {
    bind () {
      this.el.removeAttribute(config.prefix + '-for')
      this.prefixRE = new RegExp('^' + this.arg + '.')
      var ctn = this.container = this.el.parentNode
      this.marker = document.createComment('s-for-' + this.arg + '-marker')
      ctn.insertBefore(this.marker, this.el)
      ctn.removeChild(this.el)
      this.childSims = []
    },
    update (collection) {
      if (this.childSims.length) {
        this.childSims.forEach(child => {
          child.destroy()
        })
        this.childSims = []
      }

      watchArray(collection, this.mutate.bind(this))

      collection.forEach((item, i) => {
        this.childSims.push(this.buildItem(item, i, collection))
      })
    },
    mutate (mutation) {
      console.log(mutation)
      console.log(this)
    },
    buildItem: function (data, index, collection) {
      const Sim = require('../core/sim'),
            node = this.el.cloneNode(true)

      var spore = new Sim(node, data, {
        eachPrefixRE: this.prefixRE,
        parentSim: this.sim
      })

      this.container.insertBefore(node, this.marker)
      collection[index] = spore.scope
      return spore
    }
  }
}

var push = [].push
    slice = [].slice

function argumentArray (collection, directive) {
  collection.push = function (element) {
    push.call(this, arguments)
    directive.mutate({
      event: 'push',
      elements: slice.call(arguments),
      collection: collection
    })
  }
}
