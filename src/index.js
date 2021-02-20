var prefix = 'sim',
    Directives = require('./compiler/directives'),
    Filters = require('./compiler/filters'),
    // add prefix to the directives so we can identify the ele which uses directive in the following process steps.
    selector = Object.keys(Directives).map(d => {
      return `[${prefix}-${d}]`
    }).join()

function VueSim (opts) {
  var self = this,
      root = this.el = document.getElementById(opts.id),
      els = root.querySelectorAll(selector)

  var bindings = self._bindings = {}
  self.scope = {}

  // process nodes for directives
  ;[].forEach.call(els, processNode)
  processNode(root)

  // initialize all variables by invoking setters
  for (var key in bindings) {
    self.scope[key] = opts.scope[key]
  }

  function processNode (el) {
    cloneAttributes(el.attributes).forEach(attr => {
      var directive = parseDirective(attr)
      if (directive) {
        bindDirective(self, el, bindings, directive)
      }
    })
  }
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
    this._bindings[key].directives.forEach(directive => {
      if (directive.definition.unbind) {
        directive.definition.unbind(
          directive.el,
          directive.argument,
          directive
        )
      }
    })
  }
  this.el.parentNode.removeChild(this.el)
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

function bindDirective (vueSim, el, bindings, directive) {
  directive.el = el
  el.removeAttribute(directive.attr.name)
  var key = directive.key,
      binding = bindings[key]
  if (!binding) {
    bindings[key] = binding = {
      value: undefined,
      directives: []
    }
  }
  binding.directives.push(directive)
  // invoke bind hook if exists
  if (directive.bind) {
    directive.bind(el, binding.value)
  }
  if (!vueSim.scope.hasOwnProperty(key)) {
    bindAccessors(vueSim, key, binding)
  }
}

function bindAccessors (vueSim, key, binding) {
  Object.defineProperty(vueSim.scope, key, {
    get () {
      return binding.value
    },
    set (value) {
      binding.value = value
      binding.directives.forEach(directive => {
        var filteredValue = value && directive.filters
          ? applyFilters(value, directive)
          : value
        directive.update(
          directive.el,
          filteredValue,
          directive.argument,
          directive,
          vueSim
        )
      })
    }
  })
}

function parseDirective (attr) {
  if (attr.name.indexOf(prefix) === -1) return

  // parse directive name & arugment
  var noprefix = attr.name.slice(prefix.length + 1),
      argIndex = noprefix.indexOf('-'),
      dirname = argIndex === -1
        ? noprefix
        : noprefix.slice(0, argIndex),
      def = Directives[dirname],
      arg = argIndex === -1
        ? null
        : noprefix.slice(argIndex + 1)

  // parse scope variable key and pipe filters
  var exp = attr.value,
      pipeIndex = exp.indexOf('|'),
      key = pipeIndex === -1
        ? exp.trim()
        : exp.slice(0, pipeIndex).trim(),
      filters = pipeIndex === -1
        ? null
        : exp.slice(pipeIndex + 1).split('|').map(filter => {
          return filter.trim()
        })

  return def ? {
    attr: attr,
    key: key,
    filters: filters,
    definition: def,
    argument: arg,
    update: typeof def === 'function'
      ? def
      : def.update
  } : null
}

function applyFilters (value, directive) {
  if (directive.definition.customFilter) {
    return directive.definition.customFilter(value, directive.filters)
  } else {
    directive.filters.forEach(filter => {
      if (Filters[filter]) {
        value = Filters[filter](value)
      }
    })
    return value
  }
}

module.exports = {
  create (opts) {
    return new VueSim(opts)
  },
  filters: Filters,
  directives: Directives
}
