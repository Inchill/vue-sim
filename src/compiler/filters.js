module.exports = {
  capitalize (value) {
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
  },
  uppercase (value) {
    return value.toUpperCase()
  }
}
