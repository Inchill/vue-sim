const config = require('./config'),
      watchArray = require('../core/observer/watch-array')

module.exports = {
  text (value) {
    this.el.textContent = value === null
      ? '' : value.toString()
  },
  show (value) {
    this.el.style.display = value ? '' : 'none'
  },
  class (value, classname) {
    this.el.classList[value ? 'add' : 'remove'](classname)
  },
  checked: {
    bind: function () {
      var el = this.el,
          self = this

      this.change = function () {
        self.sim.scope[self.key] = el.checked
      }

      el.addEventListener('change', this.change)
    }
  },
  on: {
    update (handler) {
      var self = this,
          event = this.arg
      if (this.handler) {
        this.el.removeEventListener(event, this.handler)
      }

      if (handler) {
        var proxy = function (e) {
          handler({
            el: e.currentTarget,
            originalEvent: e,
            directive: self,
            sim: self.sim
          })
        }
        this.el.addEventListener(event, proxy)
        this.handler = proxy
      }
    },
    unbind () {
      var event = this.arg
      if (this.handlers) {
        this.el.removeEventListener(event, this.handler)
      }
    }
  },
  for: {
    bind () {
      this.el.removeAttribute(config.prefix + '-for')
      var ctn = this.container = this.el.parentNode
      this.marker = document.createComment('s-for-' + this.arg)
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
          eachPrefixRE: this.arg,
          parentSim: this.sim,
          eachIndex: index,
          eachCollection: collection
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
