// sniff matchesSelector() method name.
var matches = 'atchesSelector',
    prefixes = ['m', 'webkitM', 'mozM', 'msM']

prefixes.some(function (prefix) {
  var match = prefix + matches
  if (document.body[match]) {
    matches = match
    return true
  }
})

function delegateCheck (current, top, selector) {
  if (current.webkitMatchesSelector(selector)) {
    return current
  } else if (current === top) {
    return false
  } else {
    return delegateCheck(current.parentNode, top, selector)
  }
}

module.exports = {
  fn: true,
  update (handler) {
    this.unbind()
    if (!handler) return

    var self = this,
        event = this.arg,
        selector  = this.selector,
        delegator = this.delegator

    if (delegator) {
      // for for blocks, delegate for better performance
      if (!delegator[selector]) {
        delegator[selector] = function (e) {
          var target = delegateCheck(e.target, delegator, selector)
          if (target) {
            handler.call(self.sim.scope, {
              el: target,
              originalEvent: e,
              scope: target.sim.scope
            })
          }
        }
        delegator.addEventListener(event, delegator[selector])
      }
    } else {
      // a normal handler
      this.handler = function (e) {
        handler.call(self.sim.scope, {
          el: e.currentTarget,
          originalEvent: e,
          scope: this.sim.scope
        })
      }
    }

    if (handler) {
      var proxy = function (e) {
        handler({
          el: e.currentTarget,
          originalEvent: e,
          directive: self,
          sim: self.sim
        })
      }
      this.el.addEventListener(event, this.handler)
    }
  },
  bind: function () {
    if (this.seed.each) {
      this.selector = '[' + this.directiveName + '*="' + this.expression + '"]'
      this.delegator = this.seed.el.parentNode
    }
  },
  unbind () {
    var event = this.arg
        selector = this.selector,
        delegator = this.delegator

    if (delegator && delegator[selector]) {
      delegator.removeEventListener(event, delegator[selector])
      delete delegator[selector]
    } else if (this.handlers) {
      this.el.removeEventListener(event, this.handler)
    }
  }
}
