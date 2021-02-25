module.exports = {
  capitalize (value) {
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
  },

  uppercase (value) {
    return value.toString().toUpperCase()
  },

  delegate (handler, args) {
    var selector = args[0]
    return function (e) {
      var oe = e.originalEvent,
          target = delegateCheck(oe.target, oe.currentTarget, selector)

      if (target) {
        e.el = target
        e.sim = target.sim
        handler.call(this, e)
      }
    }
  }
}

function delegateCheck (current, top, selector) {
  if (current.webkitMatchesSelector(selector)) {
    return current
  } else if (current === top) {
    return false
  } else {
    return delegateCheck(current.parentNode, top, selector)
  }
}
