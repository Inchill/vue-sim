module.exports = {
  capitalize (value) {
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
  },

  uppercase (value) {
    return value.toUpperCase()
  },

  delegate (handler, selectors) {
    return function (e) {
      var match = selectors.every(selector => {
        return e.target.webkitMatchesSelector(selector)
      })
      if (match) {
        handler.apply(this, arguments)
      }
    }
  }
}
