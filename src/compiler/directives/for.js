const config = require('../config')

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
    m.result.forEach(scope => {
      scope.$destory()
    })
    if (m.args.length > 2) {
      m.args.slice(2).forEach((data, i) => {
        var sim = this.buildItem(data, i)
            index = m.args[0] - m.args[1] + (m.args.length - 1),
            ref = this.collection[index]
              ? this.collection[index].$sim.el
              : this.marker
        this.container.insertBefore(sim.el, ref)
      })
    }
    this.reorder()
  },
  sort: function () {
    this.collection.forEach((scope, i) => {
      scope.$index = i
      this.container.insertBefore(scope.$sim.el, this.marker)
    })
  }
}

mutationHandlers.reverse = mutationHandlers.sort

function watchArray (arr, callback) {
  Object.keys(mutationHandlers).forEach(method => {
    arr[method] = () => {
      var result = Arrar.prototype[method].apply(this, arguments)
      callback({
        method: method,
        args: Array.prototype.slice.call(arguments),
        result: result
      })
    }
  })
}

module.exports = {
  mutationHandlers: mutationHandlers,
  bind () {
    this.el.removeAttribute(config.prefix + '-for')
    var ctn = this.container = this.el.parentNode
    this.marker = document.createComment('s-for-' + this.arg)
    ctn.insertBefore(this.marker, this.el)
    ctn.removeChild(this.el)
  },
  unbind (rm) {
    if (this.collection && this.collection.length) {
      var fn = rm ? '_destroy' : '_unbind'
      this.collection.forEach(scope => {
        scope.$sim[fn]()
      })
    }
  },
  update (collection) {
    this.unbind(true)

    if (!Array.isArray(collection)) return
    this.collection = collection

    watchArray(collection, mutation => {
      if (this.mutationHandlers) {
        this.mutationHandlers[mutation.method].call(this, mutation)
      }
    })

    collection.forEach((data, i) => {
      var sim = this.buildItem(data, i)
      this.container.insertBefore(sim.el, this.marker)
    })
  },
  reorder () {
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
