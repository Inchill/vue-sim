const config = require('../compiler/config'),
      Directives = require('../compiler/directives'),
      Filters = require('../compiler/filters'),
      Directive = require('../directive')

function Sim (el, data) {
  if (typeof el === 'string') {
    el = document.querySelector(el)
  }

  // bindings is the scope object
  this.el = el
  this._bindings = {}
  this.scope = {}

  // process nodes for directives
  // and store directives into bindings，each binding key is an object which has directives[] and value
  var els = el.querySelectorAll(config.selector)
  ;[].forEach.call(els, this._compileNode.bind(this))
  this._compileNode(el)

  // initialize all variables by invoking setters
  for (var key in this._bindings) {
    this.scope[key] = data[key]
  }
}

Sim.prototype._compileNode = function (node) {
  var self = this
  // the attributes of node are the custom directives
  cloneAttributes(node.attributes).forEach(attr => {
    var directive = Directive.parse(attr)
    if (directive) {
      self._bind(node, directive)
    }
  })
}

Sim.prototype._bind = function (node, directive) {
  directive.el = node
  node.removeAttribute(directive.attr.name)

  var key = directive.key,
      binding = this._bindings[key] || this._createBinding(key)

  binding.directives.push(directive)

  if (directive.bind) {
    directive.bind(node, binding.value)
  }
}

Sim.prototype._createBinding = function (key) {
  var binding = {
    value: undefined,
    directives: []
  }

  this._bindings[key] = binding

  Object.defineProperty(this.scope, key, {
    get () {
      return binding.value
    },
    set (value) {
      binding.value = value
      binding.directives.forEach(directive => {
        directive.update(value)
      })
    }
  })

  return binding
}

Sim.prototype.dump = function () {
  var data = {}
  for (var key in this._bindings) {
    data[key] = this._bindings[key].value
  }
  return data
}

Sim.prototype.destroy = function () {
  for (var key in this._bindings) {
    this._bindings[key].directives.forEach(unbind)
  }
  this.el.parentNode.removeChild(this.el)

  function unbind (directive) {
    if (directive.unbind) {
      directive.unbind()
    }
  }
}

// clone attributes so they don't change
function cloneAttributes (attributes) {
  return [].map.call(attributes, attr => {
    return {
      name: attr.name,
      value: attr.value
    }
  })
}

module.exports = Sim
