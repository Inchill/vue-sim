const config = require('./compiler/config'),
      Sim = require('./core/sim'),
      directives = require('./compiler/directives'),
      filters = require('./compiler/filters')

function buildSelector () {
  // add prefix to the directives so we can identify the ele which uses directive in the following process steps.
  config.selector = Object.keys(directives).map(directive => {
    return `[${config.prefix}-${directive}]`
  })
}

Sim.config = config
buildSelector()

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
  buildSelector()
}

Sim.filter = function (name, fn) {
  filters[name] = fn
}

module.exports = Sim
