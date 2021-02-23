const config = require('../compiler/config'),
      controllers = require('../compiler/controllers'),
      bindingParser = require('../compiler/binding')

var map = Array.prototype.map,
    each = Array.prototype.forEach

var ctrlAttr,
    forAttr

function Sim(el, data, options) {
  ctrlAttr = config.prefix + '-controller'
  forAttr = config.prefix + '-for'

  if (typeof el === 'string') {
    el = document.querySelector(el)
  }

  // bindings is the scope object
  this.el = el
  this._bindings = {}
  this.scope = data
  this._options = options || {}

  var key, dataCopy = {}
  for (key in data) {
    dataCopy[key] = data[key]
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
  this._compileNode(el, true)

  // copy in methods from controller
  if (controller) {
    controller.call(null, this.scope, this)
  }

  // initialize all variables by invoking setters
  for (key in dataCopy) {
    this.scope[key] = dataCopy[key]
  }
}

Sim.prototype._compileNode = function (node, root) {
  var self = this,
      ctrl = config.prefix + '-controller'

  if (node.nodeType === 3) {
    // text node.
    self._compileTextNode(node)
  } else if (node.attributes && node.attributes.length) {
    var forExp = node.getAttribute(forAttr),
        ctrlExp = node.getAttribute(ctrlAttr)

    if (forExp) {
      // for block
      var binding = bindingParser.parse(forAttr, forExp)
      if (binding) {
        self._bind(node, binding)
      }
    } else if (!ctrlExp || root) {
      // normal node
      // clone attributes because the list can change
      var attrs = map.call(node.attributes, attr => {
        return {
          name: attr.name,
          expressions: attr.value.split(',')
        }
      })
      attrs.forEach(attr => {
        var valid = false
        attr.expressions.forEach(exp => {
          var binding = bindingParser.parse(attr.name, exp)
          if (binding) {
            valid = true
            self._bind(node, binding)
          }
        })

        if (valid) {
          node.removeAttribute(attr.name)
        }
      })

      if (node.childNodes.length) {
        each.call(node.childNodes, child => {
          self._compileNode(child)
        })
      }
    }
  }
}

Sim.prototype._compileTextNode = function (node, bindingInstance) {
  return node
}

Sim.prototype._bind = function (node, bindingInstance) {
  bindingInstance.sim = this
  bindingInstance.el = node

  var key = bindingInstance.key,
      epr = this._options.eachPrefixER,
      isEachKey = epr && epr.test(key),
      sim = this

  if (isEachKey) {
    key = key.replace(epr, '')
  } else if (epr) {
    sim = this._options.sim
  }

  var binding = sim._bindings[key] || sim._createBinding(key)

  // add directive to this binding
  binding.instances.push(bindingInstance)

  // invoke bind hook if exists
  if (bindingInstance.bind) {
    bindingInstance.bind(binding.value)
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
    ;delete this._bindings[key]
  }
  this.el.parentNode.removeChild(this.el)

  function unbind(instance) {
    if (instance.unbind) {
      instance.unbind()
    }
  }
}

module.exports = Sim
