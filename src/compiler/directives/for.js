const config = require('../config')

var augmentations = {
  remove: function (scope) {
    this.splice(scope.$index, 1)
  },
  replace: function (index, data) {
    if (typeof index !== 'number') {
      index = index.$index
    }
    this.splice(index, 1, data)
  }
}

var mutationHandlers = {
  push: function (m) {
    m.args.forEach((data, i) => {
      var sim = this.buildItem(data, this.collection.length + i)
      this.container.insertBefore(sim.el, this.marker)
    })
  },
  pop: function (m) {
    m.result.$destory()
  },
  unshift: function (m) {
    m.args.forEach((data, i) => {
      var sim = this.buildItem(data, this.collection.length + i)
      this.container.insertBefore(sim.el, this.collection[m.args.length].$sim.el)
    })
    this.reorder()
  },
  shift: function (m) {
    m.result.$destory()
    this.reorder()
  },
  splice: function (m) {
    var self = this,
      index = m.args[0],
      removed = m.args[1],
      added = m.args.length - 2
    m.result.forEach(scope => {
      scope.$destory()
    })
    if (added > 2) {
      m.args.slice(2).forEach((data, i) => {
        var sim = this.buildItem(data, index + i)
        pos = index - removed + added + 1,
          ref = this.collection[pos] ?
          this.collection[pos].$sim.el :
          this.marker
        this.container.insertBefore(sim.el, ref)
      })
    }
    if (removed !== added) {
      self.reorder()
    }
  },
  sort: function () {
    this.collection.forEach((scope, i) => {
      scope.$index = i
      this.container.insertBefore(scope.$sim.el, this.marker)
    })
  }
}

mutationHandlers.reverse = mutationHandlers.sort

function watchArray(collection, callback) {
  Object.keys(mutationHandlers).forEach(method => {
    collection[method] = () => {
      var result = Arrar.prototype[method].apply(this, arguments)
      callback({
        method: method,
        args: Array.prototype.slice.call(arguments),
        result: result
      })
    }
  })

  for (var method in augmentations) {
    collection[method] = augmentations[method]
  }
}

module.exports = {
  mutationHandlers: mutationHandlers,
  bind() {
    this.el.removeAttribute(config.prefix + '-for')
    var ctn = this.container = this.el.parentNode
    this.marker = document.createComment('s-for-' + this.arg)
    ctn.insertBefore(this.marker, this.el)
    ctn.removeChild(this.el)
  },
  unbind(rm) {
    if (this.collection && this.collection.length) {
      var fn = rm ? '_destroy' : '_unbind'
      this.collection.forEach(scope => {
        scope.$sim[fn]()
      })
    }
  },
  update(collection) {
    this.unbind(true)

    if (!Array.isArray(collection)) return
    this.collection = collection

    watchArray(collection, mutation => {
      if (this.mutationHandlers) {
        this.mutationHandlers[mutation.method].call(this, mutation)
      }
      if (self.binding.refreshDependents) {
        self.binding.refreshDependents()
      }
    })

    collection.forEach((data, i) => {
      var sim = this.buildItem(data, i)
      this.container.insertBefore(sim.el, this.marker)
    })
  },
  reorder() {
    this.collection.forEach((scope, i) => {
      scope.$index = i
    })
  },
  buildItem: function (data, index) {
    const Sim = require('../../core/sim'),
      node = this.el.cloneNode(true)

    var spore = new Sim(node, {
      each: true,
      eachPrefixRE: new RegExp('^' + this.arg + '.'),
      parentSim: this.sim,
      index: index,
      data: data
    })

    this.collection[index] = spore.scope
    return spore
  }
}
