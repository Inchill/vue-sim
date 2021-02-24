const Emitter = require('emitter'),
      config = require('../compiler/config'),
      controllers = require('../compiler/controllers'),
      DirectiveParser = require('../compiler/directive-parser')

var slice= Array.prototype.slice

var ctrlAttr,
    forAttr

function Sim(el, data, options) {
  ctrlAttr = config.prefix + '-controller'
  forAttr = config.prefix + '-for'

  if (typeof el === 'string') {
    el = document.querySelector(el)
  }

  // bindings is the scope object
  el.sim = this
  this.el = el
  this.scope = data
  this._bindings = {}

  if (options) {
    this.parentSim = options.parentSim
    this.eachPrefixRE = new RegExp('^' + options.eachPrefixRE + '.')
    this.eachIndex = options.eachIndex
  }

  var key
  // keep a temporary data for all the real data
  // so we can overwrite the passed in data object
  // with getter/setters.
  this._dataCopy = {}
  for (key in data) {
    this._dataCopy[key] = data[key]
  }

  // if has container
  var ctrlID = el.getAttribute(ctrlAttr),
      controller = null

  if (ctrlID) {
    controller = controllers[ctrlID]
    el.removeAttribute(ctrlAttr)
    if (!controller) {
      throw new Error(`controller ${ctrlID} is not defined`)
    }
  }

  // process nodes for directives
  // and store directives into bindings，each binding key is an object which has directives[] and value
  // first, child with s-for directive
  this._compileNode(el, true)

  // initialize all variables by invoking setters
  for (key in this._dataCopy) {
    this.scope[key] = this._dataCopy[key]
  }
  delete this._dataCopy

  // copy in methods from controller
  if (controller) {
    controller.call(this, this.scope, this)
  }
}

Emitter(Sim.prototype)

Sim.prototype._compileNode = function (node, root) {
  var self = this

  if (node.nodeType === 3) {
    // text node.
    self._compileTextNode(node)
  } else if (node.attributes && node.attributes.length) {
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
    } else if (ctrlExp && !root) { // normal node (non controller)
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
    if (!forExp && !ctrlExp) {
      if (node.childNodes.length) {
        slice.call(node.childNodes).forEach((child, i) => {
          self._compileNode(child)
        })
      }
    }
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
  } else if (snr) {
    scopeOwner = this.parentSim
  }

  directive.key = key

  var binding = scopeOwner._bindings[key] || scopeOwner._createBinding(key)

  // add directive to this binding
  binding.instances.push(directive)

  // invoke bind hook if exists
  if (directive.bind) {
    directive.bind(binding.value)
  }
}

Sim.prototype._createBinding = function (key) {
  var binding = {
    value: null,
    instances: []
  }

  this._bindings[key] = binding

  Object.defineProperty(this.scope, key, {
    get () {
      return binding.value
    },
    set (value) {
      binding.value = value
      binding.instances.forEach(instance => {
        instance.update(value)
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
    this._bindings[key].instances.forEach(unbind)
    delete this._bindings[key]
  }
  this.el.parentNode.removeChild(this.el)

  function unbind(instance) {
    if (instance.unbind) {
      instance.unbind()
    }
  }
}

module.exports = Sim
