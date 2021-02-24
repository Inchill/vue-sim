const config = require('./compiler/config'),
      Sim = require('./core/sim'),
      directives = require('./compiler/directives'),
      filters = require('./compiler/filters'),
      controllers = require('./compiler/controllers')

Sim.config = config

Sim.extend = function (opts) {
  var Spore = function () {
    Sim.apply(this, arguments)
    for (let prop in this.extensions) {
      var ext = this.extensions[prop]
      this.scope[prop] = (typeof ext === 'function')
        ? ext.bind(this)
        : ext
    }
  }

  Spore.prototype = Object.create(Sim.prototype)
  Spore.prototype.extensions = {}

  for (let prop in opts) {
    Spore.prototype.extensions[prop] = opts[prop]
  }

  return Spore
}

Sim.directive = function (name, fn) {
  directives[name] = fn
  // updateSelector()
}

Sim.filter = function (name, fn) {
  filters[name] = fn
}

Sim.controller = function (id, extensions) {
  if (controllers[id]) {
    console.warn(`controller ${id} was already registered and has been overwritten`)
  }

  controllers[id] = extensions
}

// this can access multiple sim instances as an array parameters into the bootstrap function.
// this could be used in the such a situation which the page has several independent root instances.
Sim.bootstrap = function (sims) {
  if (!Array.isArray(sims)) {
    sims = [sims]
  }

  var instances = []

  sims.forEach(sim => {
    var el = sim.el
    if (typeof el === 'string') {
      el = document.querySelector(el)
    }
    if (!el) {
      console.warn(`invalid element or selector: ${sim.el}`)
    }

    instances.push(new Sim(el, sim.data, sim.options))
  })

  return instances.length > 1
    ? instances
    : instances[0]
}

Sim.plant = Sim.controller
Sim.sprout = Sim.bootstrap

module.exports = Sim
