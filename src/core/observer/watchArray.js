var proto = Array.prototype,
    slice = proto.slice,
    mutatorMethods = [
      'pop',
      'push',
      'reverse',
      'shift',
      'unshift',
      'splice',
      'sort'
    ]

module.exports = (arr, callback) => {
  mutatorMethods.forEach(method => {
    arr[method] = () => {
      proto[method].apply(this, arguments)
      callback({
        event: method,
        args: slice.call(arguments),
        array: arr
      })
    }
  })
}
