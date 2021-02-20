var prefix = 'sim',
    Directives = require('./compiler/directives'),
    Directive = require('./directive'),
    // add prefix to the directives so we can identify the ele which uses directive in the following process steps.
    selector = Object.keys(Directives).map(d => {
      return `[${prefix}-${d}]`
    }).join()

function VueSim (opts) {
  var self = this,
      root = this.el = document.getElementById(opts.id),
      els = root.querySelectorAll(selector)

  self.bindings = {}
  self.scope = {}

  // process nodes for directives
  ;[].forEach.call(els, this.compileNode.bind(this))
  this.compileNode(root)

  // initialize all variables by invoking setters
  for (var key in self.bindings) {
    self.scope[key] = opts.scope[key]
  }
}

VueSim.prototype.compileNode = function (node) {
  var self = this
  // the attributes of node are the custom directives
  cloneAttributes(node.attributes).forEach(attr => {
    var directive = Directive.parse(attr, prefix)
    if (directive) {
      self.bind(node, directive)
    }
  })
}

VueSim.prototype.dump = function () {
  var data = {}
  for (var key in this._bindings) {
    data[key] = this._bindings[key].value
  }
  return data
}

VueSim.prototype.destroy = function () {
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

VueSim.prototype.bind = function (node, directive) {
  directive.el = node
  node.removeAttribute(directive.attr.name)

  var key = directive.key,
      binding = this.bindings[key] || this.createBinding(key)

  binding.directives.push(directive)

  if (directive.bind) {
    directive.bind(node, binding.value)
  }
}

VueSim.prototype.createBinding = function (key) {
  var binding = {
    value: undefined,
    directives: []
  }

  this.bindings[key] = binding

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

// clone attributes so they don't change
function cloneAttributes (attributes) {
  return [].map.call(attributes, attr => {
    return {
      name: attr.name,
      value: attr.value
    }
  })
}

module.exports = {
  create (opts) {
    return new VueSim(opts)
  },
  filter () {

  },
  directives () {

  }
}
