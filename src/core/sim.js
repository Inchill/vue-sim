const Emitter = require('events').EventEmitter,
      config = require('../compiler/config'),
      DirectiveParser = require('../compiler/directive-parser')

var slice= Array.prototype.slice,
    ancestorKeyRE = /\^/g,
    ctrlAttr = config.prefix + '-controller'
    forAttr = config.prefix + '-for'

function Sim(el, options) {
  if (typeof el === 'string') {
    el = document.querySelector(el)
  }

  // bindings is the scope object
  this.el = el
  el.sim = this
  this._bindings = {}

  // copy options
  options = options || {}
  for (var op in options) {
    this[op] = options[op]
  }

  // initialize the scope object
  var dataPrefix = config.prefix + '-data'
  this.scope =
    (options && options.data)
    || config.datum[el.getAttribute(dataPrefix)]
    || {}
  el.removeAttribute(dataPrefix)

  // keep a temporary data for all the real data
  // so we can overwrite the passed in data object
  // with getter/setters.
  var key
  this._dataCopy = {}
  for (key in this.scope) {
    this._dataCopy[key] = this.scope[key]
  }

  // if has container
  this.scope.$sim = this
  this.scope.$destroy = this._destroy.bind(this)
  this.scope.$dump = this._dump.bind(this)
  this.scope.$index= options.index
  this.scope.$parent = options.parentSim && options.parentSim.scope

  // process nodes for directives
  // and store directives into bindings，each binding key is an object which has directives[] and value
  // first, child with s-for directive
  this._compileNode(el, true)

  // if has controller, apply it
  var ctrlID = el.getAttribute(ctrlAttr)
  if (ctrlID) {
    el.removeAttribute(ctrlAttr)
    var controller = config.controllers[ctrlID]
    if (controller) {
      controller.call(this, this.scope, this)
    } else {
      console.warn('controller ' + ctrlID + ' is not defined.')
    }
  }
}

Sim.prototype._compileNode = function (node, root) {
  var self = this

  if (node.nodeType === 3) {
    // text node.
    self._compileTextNode(node)
  } else {
    var forExp = node.getAttribute(forAttr),
        ctrlExp = node.getAttribute(ctrlAttr)

    if (forExp) { // for block
      var binding = DirectiveParser.parse(forAttr, forExp)
      if (binding) {
        self._bind(node, binding)
        // need to set for block so it can inherit
        // parent scope. i.e. the childSims must have been
        // initialized when parent setters are invoked
        self.scope[binding.key] = self._dataCopy[binding.key]
        delete self._dataCopy[binding.key]
      }
    } else if (ctrlExp && !root) { // (nested controllers)
      var id = node.id,
          sim = new Sim(node, {
            child: true,
            parentSim: self
          })
      if (id) {
        self['$' + id] = sim
      }
    } else { // normal node
      // parse if has attributes
      if (node.attributes && node.attributes.length) {
        slice.call(node.attributes).forEach(attr => {
          var valid = false
          attr.value.split(',').forEach(exp => {
            var binding = DirectiveParser.parse(attr.name, exp)
            if (binding) {
              valid = true
              self._bind(node, binding)
            }
          })

          if (valid) {
            node.removeAttribute(attr.name)
          }
        })
      }
    }
  }

  // recursively compile childNodes.
  if (node.childNodes.length) {
    slice.call(node.childNodes).forEach(child => {
      self._compileNode(child)
    })
  }
}

Sim.prototype._compileTextNode = function (node, directive) {
  return node
}

Sim.prototype._bind = function (node, directive) {
  directive.sim = this
  directive.el = node

  var key = directive.key,
      snr = this.eachPrefixRE,
      isEachKey = snr && snr.test(key),
      scopeOwner = this

  if (isEachKey) {
    key = key.replace(snr, '')
  }

  // handle scope nesting
  if (snr && !isEachKey) {
    scopeOwner = this.parentSim
  } else {
    var ancestors = key.match(ancestorKeyRE),
        root = key.charAt(0) === '$'

    if (ancestors) {
      key = key.replace(ancestorKeyRE, '')
      var levels = ancestors.length
      while (scopeOwner.parentSim && levels--) {
        scopeOwner = scopeOwner.parentSim
      }
    } else if (root) {
      key = key.slice(1)
      while (scopeOwner.parentSim) {
        scopeOwner = scopeOwner.parentSim
      }
    }
  }

  directive.key = key

  var binding = scopeOwner._bindings[key] || scopeOwner._createBinding(key)

  // add directive to this binding
  binding.instances.push(directive)

  // invoke bind hook if exists
  if (directive.bind) {
    directive.bind(binding.value)
  }

  // set initial value
  if (binding.value) {
    directive.update(binding.value)
  }
}

Sim.prototype._createBinding = function (key) {
  var binding = {
    value: this.scope[key],
    changed: false,
    instances: []
  }

  this._bindings[key] = binding

  Object.defineProperty(this.scope, key, {
    get () {
      return binding.value
    },
    set (value) {
      if (value === binding) return
      binding.changed = true
      binding.value = value
      binding.instances.forEach(instance => {
        instance.update(value)
      })
    }
  })

  return binding
}

Sim.prototype._unbind = function () {
  var unbind = function (instance) {
    if (instance.unbind) {
      instance.unbind()
    }
  }

  for (var key in this._bindings) {
    this._bindings[key].instances.forEach(unbind)
  }
  this.childSims.forEach(child => {
    child.unbind()
  })
}

Sim.prototype._destroy = function () {
  this._unbind()
  delete this.el.sim
  this.el.parentNode.removeChild(this.el)
  if (this.parentSim && this.id) {
    delete this.parentSim[`$${this.id}`]
  }
}

Sim.prototype._dump = function () {
  var dump = {}, val,
      subDump = function (scope) {
        return scope.$dump()
      }
  for (var key in this.scope) {
    if (key.charAt(0) !== '$') {
      val = this._bindings[key]
      if (!val) continue
      if (Array.isArray(val)) {
          dump[key] = val.map(subDump)
      } else {
          dump[key] = this._bindings[key].value
      }
    }
  }
  return dump
}

console.log('emitter', Emitter)

Emitter(Sim.prototype)

module.exports = Sim
