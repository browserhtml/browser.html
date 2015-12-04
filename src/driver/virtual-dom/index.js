/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {identity} from '../../lang/functional'
import {forward, Effects, Task} from 'reflex'
export {Renderer} from 'reflex-virtual-dom-driver'

// @TODO documentation
// I think this is some kind of memoization class? - GB 2015-11-12
class On {
  static handleEvent(event) {
    const {currentTarget, type} = event

    const handler = currentTarget[`on:${type}`]
    if (handler) {
      const data = handler.decode == null ?
        void(0) :
        handler.decode(event)

      if (handler.stopPropagation) {
        if (handler.stopPropagation(data)) {
          event.stopPropagation()
        }
      }

      if (handler.preventDefault) {
        if (handler.preventDefault(data)) {
          event.preventDefault()
        }
      }

      handler.address(data)
    }
  }
  constructor(address, decode, options, getTarget) {
    this.address = address
    this.decode = decode
    this.getTarget = getTarget
    this.stopPropagation = false
    this.preventDefault = false
    this.type = 'On'

    if (options != null) {
      if (options.stopPropagation != null) {
        this.stopPropagation = options.stopPropagation
      }

      if (options.preventDefault != null) {
        this.preventDefault = options.preventDefault
      }
    }
  }
  hook(node, name, previous) {
    const type = name.indexOf('on') === 0 ?
      name.substr(2).toLowerCase() :
      name

    const target = this.getTarget != null ?
      this.getTarget(node) :
      node

    if (previous == null || previous.type != this.type) {
      target.addEventListener(type, this.constructor.handleEvent)
    }

    target[`on:${type}`] = this
  }
  unhook(node, name, next) {
    const type = name.indexOf('on') === 0 ?
      name.substr(2).toLowerCase() :
      name.toLowerCase()

    const target = this.getTarget != null ?
      this.getTarget(node) :
      node

    if (next == null || next.type != this.type) {
      node.removeEventListener(type, this.constructor.handleEvent)
    }

    delete node[`on:${type}`]
  }
}

const $hash = Symbol.for("hash")
let nextHash = 0

const hash = v => {
  if (v == null) {
    return `#_`
  } else if (v === false) {
    return `#f`
  } else if (v === true) {
    return `#t`
  } else {
    if (v[$hash] == null) {
      v[$hash] = `f#${++nextHash}`
    }

    if (v[$hash] == null) {
      throw TypeError(`Invalid value of type ${typeof(value)} passed to a hashing function`)
    }

    return v[$hash]
  }
}

const blank = Object.create(null)
export const on = (address, decode, options, getTarget) => {
  const {stopPropagation, preventDefault} = options || blank
  const id = `on:${hash(decode)}@${hash(getTarget)}:${hash(stopPropagation)}:${hash(preventDefault)}}`

  if (!address[id]) {
    address[id] = new On(address, decode, options, getTarget)
  }

  return address[id]
}

const getRoot = target => target.ownerDocument
export const onWindow = (address, decode, options) =>
  on(address, decode, options, getRoot)

class MetaProperty {
  constructor(value, update) {
    this.value = value
    this.update = update
    this.type = 'MetaProperty'
  }
  hook(node, name, previous) {
    const before = previous == null ?
        previous :
      previous.type != this.type ?
        previous :
        previous.value

    this.update(node, this.value, before)
  }
  unhook(node, name, next) {
  }
}

export const metaProperty = update => value =>
  new MetaProperty(value, update)


export const zoom = metaProperty((node, next, previous) => {
  if (previous != next) {
    if (node.zoom) {
      Promise.resolve().then(() => {
        try {
          node.zoom(next);
        } catch (error) {
          if (!node.isZoomBroken) {
            console.error(error);
          }
        }
      })
    }
  }
})

// Bunch of meta properties are booleans, meaning they can be toggled on
// or off. This function is an optimized version of metaProperty for such
// cases, it lazily caches both on and off instances and reuses them in
// subsequent calls. Note: `false`, `null`, and `undefined` are treated as
// logical `false` everything else is treated as `true`.
const metaBooleanProperty = update => {
  let [on, off] = [null, null]
  const property = metaProperty(update)

  return value => {
    if (value === false || value == null) {
      if (off == null) {
        off = property(false)
      }
      return off
    } else {
      if (on == null) {
        on = property(true)
      }
      return on
    }
  }
}

export const visiblity = metaBooleanProperty((node, next, previous) => {
  if (next != previous) {
    if (node.setVisible) {
      Promise.resolve().then(() => {
        try {
          node.setVisible(next);
        } catch (error) {
          if (!node.isSetVisibleBroken) {
            console.error(error);
          }
        }
      })
    }
  }
});

export const focus = metaBooleanProperty((node, next, previous) => {
  if (next != previous) {
    Promise.resolve().then(() => {
      if (next) {
        node.focus();
      } else {
        node.blur();
      }
    })
  }
});

export const navigate = metaProperty((node, next, previous) => {
  if (next != previous) {
    if (next) {
      if (next.isStop) {
        node.stop()
      }
      if (next.isReload) {
        node.reload()
      }
      if (next.isGoBack) {
        node.goBack()
      }
      if (next.isGoForward) {
        node.goForward()
      }
    }
  }
});

class UseElement {
  constructor() {
  }
  use(element) {
    this.element = element
  }
  hook(target, name, previous) {
    const {element} = this;
    if (element != null) {
      this.element = null;
      if (target != element) {
        for (let {name, value} of target) {
          element.setAttribute(name, value);
        }

        for (let name of target.properties.names) {
          element[name] = target[name]
        }
      }
      return element;
    }
  }
}

export const element = new UseElement()

const $onAnimationFrame = Symbol.for('onAnimationFrame')
class OnAnimationFrame {
  static request(target) {
    const targets
      = this.targets
      || (this.targets = []);

    if (targets.indexOf(target) < 0) {
      targets.push(target);
    }

    if (!OnAnimationFrame.id) {
      const window = target.ownerDocument.defaultView;
      OnAnimationFrame.id = window.requestAnimationFrame(this.run);
    }
  }
  static run(timeStamp) {
    OnAnimationFrame.id = null
    const targets = OnAnimationFrame.targets.splice(0)
    const count = targets.length
    let index = 0

    while (index < count) {
      const handler = targets[index][$onAnimationFrame]
      if (handler != null) {
        handler(timeStamp)
      }
      index = index + 1
    }
  }
  constructor(address) {
    this.address = address
    this.field = Symbol.for('onAnimationFrame')
    this.type = 'OnAnimationFrame'
  }
  hook(target, name, previous) {
    this.constructor.request(target)

    target[$onAnimationFrame] = this.address
  }
  onhook(target, name, next) {
    if (previous == null || previous.type !== this.type) {
      delete target[$onAnimationFrame]
    }
  }
}


export const onAnimationFrame = (address, decode) => {
  address = decode != null ? forward(address, decode) : address
  if (address[$onAnimationFrame] == null) {
    address[$onAnimationFrame] = new OnAnimationFrame(address)
  }

  return address[$onAnimationFrame]
}

// Equality checking for selections.
const isSameSelection = (a, b) =>
  (a && b && a.start === b.start && a.end === b.end && a.direction === b.direction);

export const selection = metaProperty((node, next, previous) => {
  if (next != null && !isSameSelection(next, previous)) {
    const {start, end, direction} = next;
    if (node.setSelectionRange) { // FIXME: remove once Servo supports setSelectionRange
      const {start, end, direction} = next;
      Promise.resolve().then(() => {
        node.setSelectionRange(start === Infinity ? node.value.length : start,
                               end === Infinity ? node.value.length : end,
                               direction);
      })
    }
  }
});

export const title = metaProperty((node, next, previous) => {
  if (next != previous) {
    node.ownerDocument.title = next
  }
});


// In fact virtual-dom driver does not have a white list of properties
// it sets so there is no need for a metaProperty, but react driver does
// not so we use this identity function to use a same API in the application.
export const scrollGrab = identity

const GO_FORWARD_CHANGE = 'mozbrowsercangoforwardchange'
const GO_BACK_CHANGE = 'mozbrowsercangobackchange'
const LOCATION_CHANGE = 'mozbrowserlocationchange'

class OnNavigationStateChange extends On {
  static handleEvent({target, currentTarget}) {
    target.getCanGoForward().onsuccess = request => {
      On.handleEvent({type: GO_FORWARD_CHANGE,
                      target,
                      currentTarget,
                      detail: request.target.result})
    };

    target.getCanGoBack().onsuccess = request => {
      On.handleEvent({type: GO_BACK_CHANGE,
                      target,
                      currentTarget,
                      detail: request.target.result})
    };
  }
  constructor(eventType, address, decode) {
    super(address, decode, null, null)
    this.eventType = eventType
    this.type = 'OnNavigationStateChange'
  }
  hook(node, name, previous) {
    super.hook(node, this.eventType, previous)

    if (previous == null || previous.type !== this.type) {
      node.addEventListener(LOCATION_CHANGE,
                            this.constructor.handleEvent)
    }
  }
  unhook(node, name, next) {
    super.unhook(node, this.eventType, next)

    if (next == null || next.type !== this.type) {
      node.removeEventListener(LOCATION_CHANGE,
                               this.constructor.handleEvent)
    }
  }
}

export const onCanGoBackChange = (address, decode) => {
  const id = `onCanGoBackChange:${hash(decode)}`

  if (!address[id]) {
    address[id] = new OnNavigationStateChange(GO_BACK_CHANGE, address, decode)
  }

  return address[id]
}

export const onCanGoForwardChange = (address, decode) => {
  const id = `onCanGoForwardChange:${hash(decode)}`

  if (!address[id]) {
    address[id] = new OnNavigationStateChange(GO_FORWARD_CHANGE, address, decode)
  }

  return address[id]
}



export const force = Effects.task(Task.succeed({type: "Driver.Execute"}));
