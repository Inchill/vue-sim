const config = require('./config'),
  directives = require('./directives/for'),
  filters = require('./filters')

const KEY_RE = /^[^\|<]+/,
  ARG_RE = /([^:]+):(.+)$/,
  FILTERS_RE = /\|[^\|<]+/g,
  FILTER_TOKEN_RE = /[^\s']+|'[^']+'/g,
  DEPS_RE = /<[^<\|]+/g,
  NESTING_RE = /^\^+/

// parse a key, extract argument and nesting/root info
function parseKey(rawKey) {

  var res = {},
    argMatch = rawKey.match(ARG_RE)

  res.key = argMatch ?
    argMatch[2].trim() :
    rawKey.trim()

  res.arg = argMatch ?
    argMatch[1].trim() :
    null

  var nesting = res.key.match(NESTING_RE)
  res.nesting = nesting ?
    nesting[0].length :
    false

  res.root = res.key.charAt(0) === '$'

  if (res.nesting) {
    res.key = res.key.replace(NESTING_RE, '')
  } else if (res.root) {
    res.key = res.key.slice(1)
  }

  return res
}

function parseFilter(filter) {

  var tokens = filter.slice(1)
    .match(FILTER_TOKEN_RE)
    .map(function (token) {
      return token.replace(/'/g, '').trim()
    })

  return {
    name: tokens[0],
    apply: filters[tokens[0]],
    args: tokens.length > 1 ?
      tokens.slice(1) : null
  }
}

function Directive(directiveName, expression) {
  // here we get the directive process function which is defined in the directives.js file
  var prop, directive = directives[directiveName]

  if (typeof directive === 'function') {
    this._update = directive
  } else {
    for (prop in directive) {
      if (prop === 'update') {
        this['_update'] = directive.update
      } else {
        this[prop] = directive[prop]
      }
    }
  }

  this.directiveName = directiveName
  this.expression = expression

  // for example, (msg | capitalize), the msg is the rawKey and (| capitalize) the filterExpressions.
  var rawKey = expression.match(KEY_RE)[0],
    keyInfo = parseKey(rawKey)

  this.key = argMatch ?
    argMatch[2].trim() :
    rawKey.trim()

  for (var prop in keyInfo) {
    this[prop] = keyInfo[prop]
  }

  var filterExps = expression.match(FILTERS_RE)

  this.filters = filterExps ?
    filterExps.map(parseFilter) :
    null

  var depExp = expression.match(DEPS_RE)
  this.deps = depExp ?
    depExp[0].slice(1).trim().split(/\s+/).map(parseKey) :
    null
}

// called when a dependency has changed
Directive.prototype.refresh = function () {
  if (this.value) {
    this._update(this.value.call(this.sim.scope))
  }
  if (this.binding.refreshDependents) {
    this.binding.refreshDependents()
  }
}

Directive.prototype.update = function (value) {
  // computed properties
  if (typeof value === 'function' && !this.fn) {
    value = value()
  }

  // apply filters
  if (this.filters) {
    value = this.applyFilters(value)
  }
  this._update(value)
  if (this.deps) this.refresh()
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
  // here we can get directive name and expression, this is necessary for making directive working correctly.
  parse(dirname, expression) {
    const prefix = config.prefix
    if (dirname.indexOf(prefix) === -1) return null
    dirname = dirname.slice(prefix.length + 1)

    var dir = directives[dirname], // dir is a function that we defined in the directives before so it can correctly process the directive.
      valid = KEY_RE.test(expression)

    if (!dir) {
      console.warn(`unknown directive: ${dirname}`)
    }
    if (!valid) {
      console.warn(`invalid directive expression: ${expression}`)
    }

    // if the directive process function exists and the expression valid, we need to bind the directive by accessing directive name and expression.
    return dir && valid ?
      new Directive(dirname, expression) :
      null
  }
}
