module.exports = {
  on: require('./on'),
  for: require('./for'),
  text (value) {
    this.el.textContent = value === null
      ? '' : value.toString()
  },
  show (value) {
    this.el.style.display = value ? '' : 'none'
  },
  class (value, classname) {
    if (this.arg) {
      this.el.classList[value ? 'add' : 'remove'](classname)
    } else {
      this.el.classList.remove(this.lastVal)
      this.el.classList.add(value)
      this.lastVal = value
    }
  },
  checked: {
    bind: function () {
      var el = this.el,
          self = this
      this.change = function () {
        self.sim.scope[self.key] = el.checked
      }
      el.addEventListener('change', this.change)
    },
    update (value) {
      this.el.checked = value
    },
    unbind () {
      this.el.addEventListener('change', this.change)
    }
  }
}
