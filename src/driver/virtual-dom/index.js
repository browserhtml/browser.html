/* @noflow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {identity} from '../../Lang/Functional'
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

      if (data !== null) {
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
      throw TypeError(`Invalid value of type ${typeof(v)} passed to a hashing function`)
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

const getRoot = target => target.ownerDocument.defaultView
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

type Setter <data, element:HTMLElement> =
  (target:element, value:data) => Task<Never, void>

class Setting <data, element:HTMLElement> {
  value: data;
  setter: Setter<data, element>;
  constructor(setter:Setter<data, element>, value:data) {
    this.value = value
    this.setter = setter
  }
  hook(node, name, previous) {
    this
      .setter(node, this.value)
      .fork(this.onSucceed, this.onFail);
  }
  onFail(error) {
    console.error(error);
  }
  onSucceed() {

  }
}


export const setting = <element:HTMLElement, data>
  ( setter:Setter<data, element>
  , value:data
  ) => new Setting(setter, value)

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


export const focus = metaBooleanProperty((node, next, previous) => {
  if (next != previous) {
    if (next) {
      node.focus();
      // If node did not get focused, it is because this is initial render and
      // in such case VirtualDOM library calls hooks before nodes are actualy
      // part of document and there for `.focus()` has no effect. In this case
      // we just repeat `.focus()` on next tick, as by then node will be part
      // of the document.
      if (node.ownerDocument.activeElement !== node) {
        Promise.resolve().then(() => {
          node.focus();
        })
      }
    } else {
      node.blur();
    }
  }
});


export const selection = metaProperty((node, next, previous) => {
  const {direction} = next
  const start =
    ( next.start === Infinity
    ? node.value.length
    : next.start
    );
  const end =
    ( next.end === Infinity
    ? node.value.length
    : next.end
    );

  // Note that call to `node.setSelectionRange` triggers `select` event
  // regardless of whether there was a change in selection. In order to avoid
  // potential inifinite selection change loop we check if call will actually
  // change a selection & only perform call if it will.
  const isUpdateRequired =
    node.selectionStart !== start ||
    node.selectionEnd !== end ||
    node.selectionDirection !== direction

  if (isUpdateRequired) {
    node.setSelectionRange(start, end, direction);
  }
});


export const forceRender:Task<Error, void> =
  new Task
  ( (succeed, fail) => {
      if (window.renderer) {
        window.renderer.execute();
        console.log('Rendered in the same tick');
        succeed(void(0));
      }
      else {
        fail(Error('window.renderer must be set to enable force rendering'))
      }
    }
  )


// @Hack: The following three functions have being copied from:
// https://github.com/Gozala/reflex-virtual-dom-driver/blob/c0248855bcf76123e50ff55a4b41bf19a53ab793/src/hooks/event-handler.js#L103-L119
// As it was impossible to import them.
// This hack can go away once https://github.com/Gozala/reflex-virtual-dom-driver/issues/4 is fixed.
const handleEvent = phase => event => {
  const {currentTarget, type} = event
  const handler = currentTarget[`on${type}${phase}`]

  if (typeof(handler) === 'function') {
    handler(event)
  }

  if (handler != null && typeof(handler.handleEvent) === 'function') {
    handler.handleEvent(event)
  }
}
const handleCapturing:EventListener = handleEvent('capture')
const handleBubbling:EventListener = handleEvent('bubble')


export const replaceElement =
  (query:string, element:HTMLElement):Task<Error, void> =>
  new Task
  ( ( succeed, fail ) => {
      const target = document.querySelector(query)
      if (target == null) {
        fail(Error('could not find node ${query}'))
      }
      else {
        if (target != element) {
          const {attributes} = target
          const count = attributes.length
          let index = 0
          while (index < count) {
            const {name, value} = attributes[index]
            index = index + 1
            element.setAttribute(name, value)
          }

          for (let name in target) {
            if (target.hasOwnProperty(name)) {
              if (name.indexOf('on:') === 0) {
                const type = name.substr(3);
                const handler = target[name];
                element.addEventListener(type, handler.constructor.handleEvent);
              }
              else if (name.indexOf('on') === 0) {
                ( name.endsWith('capture')
                ? element.addEventListener
                  ( name.substring(2, name.length - 'capture'.length)
                  , handleCapturing
                  , true
                  )
                : name.endsWith('bubble')
                ? element.addEventListener
                  ( name.substring(2, name.length - 'bubble'.length)
                  , handleBubbling
                  , false
                  )
                : void(0)
                );
              }

              element[name] = target[name]
            }
          }
        }
        target.parentNode.replaceChild(element, target);
      }
      succeed(void(0));
    }
  );

export const forceReplace =
  (query:string, element:HTMLElement):Task<Error, void> =>
  forceRender
  .chain(_ => replaceElement(query, element));
