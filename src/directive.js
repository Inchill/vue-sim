const config = require('./compiler/config'),
      Directives = require('./compiler/directives'),
      Filters = require('./compiler/filters')

const KEY_RE = /^[^\|]+/,
      FILTERS_RE = /\|[^\|]+/g

function Directive (def, attr, arg, key) {
  if (typeof def === 'function') {
    this._update = def
  } else {
    for (var prop in def) {
      if (prop === 'update') {
        this['_update'] = def.update
        continue
      }
      this[prop] = def[prop]
    }
  }

  this.attr = attr
  this.arg = arg
  this.key = key

  // sometimes we will use filters so that this step is necessary.
  // if we wanna filter logo、license plate number and carrying limit in turn, this is helpful.
  var filters = attr.value.match(FILTERS_RE)
  if (filters) {
    this.filters = filters.map(filter => {
      var tokens = filter.replace('|', '').trim().split(/\s+/)
      return {
        name: tokens[0],
        apply: Filters[tokens[0]],
        args: tokens.length > 1 ? tokens.slice(1) : null
      }
    })
  }
}

Directive.prototype.update = function (value) {
  // apply filters
  if (this.filters) {
    value = this.applyFilters(value)
  }
  this._update(value)
}

Directive.prototype.applyFilters = function (value) {
  var filtered = value
  // apply filters to value in turn.
  this.filters.forEach(filter => {
    if (!filter.apply) {
      throw new Error('Unknown filter: ' + filter.name)
    }
    filtered = filter.apply(filtered, filter.args)
  })
  return filtered
}

module.exports = {
  parse (attr) {
    const prefix = config.prefix
    if (attr.name.indexOf(prefix) === -1) return null

    // parse directive name & arugment
    // here we get the noprefix directive, for example text、show、class，etc.
    // the name is name of the directive, and the value is what we want directive to do.
    var noprefix = attr.name.slice(prefix.length + 1),
      argIndex = noprefix.indexOf('-'),
      arg = argIndex === -1
        ? null
        : noprefix.slice(argIndex + 1),
      name = arg
        ? noprefix.slice(0, argIndex)
        : noprefix,
      // the def is an object which has hooks we defined before.
      def = Directives[name]

    var key = attr.value.match(KEY_RE)

    return def && key
      ? new Directive(def, attr, key, key[0].trim())
      : null
  }
}
