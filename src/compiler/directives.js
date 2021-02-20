module.exports = {
  text (el, value) {
    el.textContent = value || ''
  },
  show (el, value) {
    el.style.display = value ? '' : 'none'
  },
  class (el, value, classname) {
    el.classList[value ? 'add' : 'remove'](classname)
  },
  on: {
    update (el, handler, event, directive) {
      if (!directive.handlers) {
        directive.handlers = {}
      }

      var handlers = directive.handlers

      if (handlers[event]) {
        el.removeEventListener(event, handlers[event])
      }

      if (handler) {
        handler = handler.bind(el)
        el.addEventListener(event, handler)
        handlers[event] = handler
      }
    },
    unbind (el, event, directive) {
      if (directive.handlers) {
        el.removeEventListener(event, directive.handlers[event])
      }
    },
    customFilter (handler, selectors) {
      return function (e) {
        var match = selectors.every(selector => {
          return e.target.webkitMatchesSelector(selector)
        })
        if (match) {
          handler.apply(this, arguments)
        }
      }
    },
    repeat () {
      
    }
  }
}
