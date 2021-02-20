function VueSim (id, initData) {
  var bindingMark = 'data-element-binding'
  var self = this,
      el = self.el = document.getElementById(id),
      bindings = {},
      data = self.data = {},
      content = el.innerHTML.replace(/\{\{(.*)\}\}/g, markToken)

  el.innerHTML = content

  for (var variable in bindings) {
    bind(variable)
  }

  if (initData) {
    for (var variable in initData) {
      data[variable] = initData[variable]
    }
  }

  function markToken (match, variable) {
    bindings[variable] = {}
    return `<span ${bindingMark} = ${variable}></span>`
  }

  function bind (variable) {
    bindings[variable].els = el.querySelectorAll(`[${bindingMark}=${variable}]`)
    ;[].forEach.call(bindings[variable].els, function (e) {
      e.removeAttribute(bindingMark)
    })

    Object.defineProperty(data, variable, {
      set: function (newVal) {
        [].forEach.call(bindings[variable].els, function (e) {
          bindings[variable].value = e.textContent = newVal
        })
      },
      get: function () {
        return bindings[variable].value
      }
    })
  }
}

module.exports = VueSim
