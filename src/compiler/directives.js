
module.exports = {
  text (value) {
    this.el.textContent = value || ''
  },
  show (value) {
    this.el.style.display = value ? '' : 'none'
  },
  class (value, classname) {
    this.el.classList[value ? 'add' : 'remove'](classname)
  },
  on: {
    update (handler) {
      var event = this.arg
      if (!this.handlers) {
        this.handlers = {}
      }

      var handlers = this.handlers

      if (handlers[event]) {
        this.el.removeEventListener(event, handlers[event])
      }

      if (handler) {
        handler = handler.bind(this.el)
        this.el.addEventListener(event, handler)
        handlers[event] = handler
      }
    },
    unbind () {
      var event = this.arg
      if (this.handlers) {
        this.el.removeEventListener(event, this.handlers[event])
      }
    }
  },
  for: {
    update (collection) {
      // watchArray(collection, this.mutate.bind(this))
    },
    mutate (mutation) {

    }
  }
}

var push = [].push
    slice = [].slice

function argumentArray (collection, directive) {
  collection.push = function (element) {
    push.call(this, arguments)
    directive.mutate({
      event: 'push',
      elements: slice.call(arguments),
      collection: collection
    })
  }
}
