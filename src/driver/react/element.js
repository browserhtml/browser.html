/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */
  'use strict';

  const React = require('./react');
  const {node} = require('reflex');

  /*::
  type EventHandler = (event: any) => void
  type EventListener = {handleEvent: EventHandler} | EventHandler
  */

  class Hook {}

  /*::
  type AttributeValue = ?string|number|boolean;
  */

  // Attribute can be used to define field mapped to a
  // DOM attribute with a given `name`. If the field is
  // set to `undefined` or `null` attribute is removed
  // othrewise it's set to given value.
  // Example: Element('hbox', {flex: Attribute('flex')})
  class Attribute extends Hook {
    /*::
    name: string;
    */
    constructor(name/*:string*/) {
      super();
      this.name = name
    }
    mounted(node/*:Element*/, value/*:AttributeValue*/) /*:Element*/ {
      if (value != null) {
        node.setAttribute(this.name, String(value));
      }
      return node;
    }
    write(node/*:Element*/, present/*:AttributeValue*/, past/*:AttributeValue*/) /*:Element*/ {
      if (present !== past) {
        if (present == null) {
          node.removeAttribute(this.name);
        } else {
          node.setAttribute(this.name, String(present));
        }
      }
      return node;
    }
  }

  // BeforeAppendAttribute can be used to define attribute on the
  // element that is set once before element is inserted into a
  // document (mounted). Changes to this property are ignored &
  // in general use of `Attribute` is preferred, this should be
  // reserved only for attributes changes to which aren't picked up
  // after node is in the tree.
  // Example: Element('iframe', { browser: BeforeAppendAttribute('mozbrowser') })
  class BeforeAppendAttribute extends Attribute {
    mount(node/*:Element*/, value/*:AttributeValue*/) /*:Element*/ {
      return this.mounted(node, value);
    }
    write(node/*:Element*/, present/*:AttributeValue*/, past/*:AttributeValue*/) /*:Element*/ {
      return super.write(node.cloneNode(true), present, past);
    }
  };

  // VirtualAttribute can be used to define fields that can't be
  // mapped to an attribute in the DOM. VirtualAttribute is defined
  // by providing a function that will be invoked target
  // `node` `current` value & `past` value and it's supposed
  // to reflect changes in the DOM. Note that on initial
  // render `past` will be `void(0)`.
  //
  // Example:
  // Element('iframe', {focused: (node, current, past) => {
  //   if (current) {
  //     node.focus()
  //   }
  // }})

  /*::
  type Writer = (node:Element, present:AttributeValue, past:AttributeValue) => Element
  */
  class VirtualAttribute extends Hook {
    /*::
    write: Writer;
    */
    constructor(write/*:Writer*/) {
      super();
      this.write = write;
    }
    mounted(node/*Element*/, value/*AttributeValue*/) /*Element*/{
      return this.write(node, value, null);
    }
  };

  /*::
  type Reader = (node:Element) => Element
  type EventListener = (event:any) => void
  */
  class EventHook extends Hook {
    /*::
    type: string;
    capture: boolean;
    read: ?Reader;
    handler: ?EventListener;
    listenersByNode: WeakMap;
    listenedNodes: number;
    */
    constructor(type/*:string*/, capture/*:boolean*/, read=null) {
      super();
      this.capture = capture;
      this.type = type;
      this.read = read;
      this.listenersByNode = new WeakMap();
      this.listenedNodes = 0;
    }
    getTarget(node) {
      return this.read != null ? this.read(node) : node;
    }
    register(node/*:Element*/) /*:void*/ {
      ++this.listenedNodes;
      node.addEventListener(this.type, this, this.capture);
    }
    unregister(node/*:Element*/) /*:void*/ {
      --this.listenedNodes;
      if (this.listenedNodes === 0) {
        node.removeEventListener(this.type, this, this.capture);
      }
    }
    handleEvent(event) {
      const listeners = this.listenersByNode.get(event.currentTarget);
      if (listeners != null && listeners.length > 0) {
        this.dispatch(event, listeners, 0);
      }
    }
    dispatch(event, listeners, index) {
      // Note: In general listeners can be updated in response to invoking a
      // listener, but since with update DOM on animation frame we don't really
      // need to care about those mutions.
      try {
        while (index < listeners.length) {
          const listener = listeners[index];
          index = index + 1;
          listener(event);
        }
      } finally {
        if (index < listeners.length) {
          this.dispatch(event, listeners, index);
        }
      }
    }
    removeListener(node/*:Element*/, listener/*:EventListener*/) /*:void*/ {
      const listeners = this.listenersByNode.get(node);
      if (listeners != null) {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
          if (listeners.length === 0) {
            this.unregister(node);
          }
        }
      }
    }
    addListener(node/*:Element*/, listener/*:EventListener*/) {
      // Find the listeners array for the given node which will
      // exist if listener for this node was ever added.
      const listeners = this.listenersByNode.get(node);
      // If listeners array does not exist then create one
      // with a passed listener in it. Also register self as an
      // event listener on this node.
      if (listeners == null) {
        this.listenersByNode.set(node, [listener]);
        this.register(node);
      }
      // If listeners array exists then just add passed listener
      // to it. If added listener is an only item in the array
      // then listeners was empty, which means that `this` was
      // unregistered when last listener was removed, there for
      // register `this` as an event listener.
      else {
        if (listeners.indexOf(listener) < 0) {
          listeners.push(listener);
          if (listeners.length === 1) {
            this.register(node);
          }
        }
      }
    }
    mounted(node/*:Element*/, listener/*:?EventListener*/) {
      // If listener is present when node is mounted add a listener
      // the target.
      if (listener != null) {
        this.addListener(this.getTarget(node), listener);
      }
      return node;
    }
    unmount(node/*:Element*/, listener/*:?EventListener*/) {
      // When node is unmounted unregister `this` as an event listener from
      // the target and remove associated listeners.
      if (listener != null) {
        this.removeListener(this.getTarget(node), listener);
      }
      return node;
    }
    write(node/*:Element*/, current/*:?EventListener*/, past/*:?EventListener*/) /*:Element*/ {
      const isExisting = past != null;
      const isDelete = current == null;
      const isWrite = !isDelete;

      if (past !== current) {
        // If a different listener was set in the past
        if (past != null) {
          // and current listener is preset then add
          // current listener and remove the past listener.
          if (current != null) {
            this.addListener(this.getTarget(node), current);
          }
          // otherwise just remove past listener.
          this.removeListener(this.getTarget(node), past);
        }
        // If no listener was set in the past, and the current listener
        // is present then add add current listener.
        else {
          if (current != null) {
            this.addListener(this.getTarget(node), current);
          }
        }
      }

      return node;
    }
  }

  class BubbledEvent extends EventHook {
    constructor(type/*:string*/, read=null) {
      super(type, false, read);
    }
  }

  class CapturedEvent extends EventHook {
    constructor(type/*:string*/, read=null) {
      super(type, true, read);
    }
  }

  class ChromeEvent extends EventHook {
    static read(node/*:Element*/) {
      return node.ownerDocument.defaultView;
    }
    constructor(detailType/*:string*/) {
      super('mozChromeEvent', false, ChromeEvent.read);
      this.detailType = detailType;
    }
    handleEvent(event) {
      if (this.detailType === event.detail.type) {
        super.handleEvent(event);
      }
    }
  }


  /*::
  type EventSetup = (node: Element, dispatch: (event:any) => void) => Element
  */
  class VirtualEvent extends Hook {
    /*::
    setup: EventSetup;
    handler: ?EventListener;
    dispatch: (event: any) => void;
    */
    constructor(setup/*: EventSetup*/) {
      super();
      this.setup = setup;
      this.dispatch = this.handleEvent.bind(this);
      this.handler = null;
    }
    write(node/*:Element*/, present/*:?EventListener*/) {
      if (present != null) {
        if (this.handler == null) {
          this.handler = present;
          node = this.setup(node, this.dispatch);
        } else {
          this.handler = present;
        }
      } else {
        if (this.handler != null) {
          this.handler = null;
        }
      }
      return node;
    }
    mounted(node, handler) {
      return this.write(node, handler);
    }
    handleEvent(event) {
      if (this.handler != null) {
        this.handler(event);
      }
    }
  }

  const isMountHook = field => field && field.mount;
  const isMountedHook = field => field != null && field.mounted != null;
  const isWriteHook = field => field != null && field.write != null;
  const isUnmountHook = field => field != null && field.unmount != null;

  class ElementView extends React.Component {
    static create(type, fields={}) {
      // In react you can actually define custom HTML element it's
      // just set of attributes you'll be able to set will be limited
      // to React's white list. To workaround that we define React
      // custom HTML element factory & custom react component that
      // will render that HTML element via custom factory.

      const keys = Object.keys(fields);
      const mount = keys.filter(key => isMountHook(fields[key]));
      const mounted = keys.filter(key => isMountedHook(fields[key]));
      const unmount = keys.filter(key => isUnmountHook(fields[key]));
      const write = keys.filter(key => isWriteHook(fields[key]));

      return (model, children) =>
        React.createElement(this, {
          model, type,
          key: model.key || model.id,
          fields,
          mount, mounted, write, unmount
        }, children);
    }
    constructor(props, context) {
      super(props, context);
      this.displayName = `html:${props.type}`
    }
    step(from, to) {
      if (from !== to && from != null && from.parentNode != null) {
        from.parentNode.replaceChild(to, from);
      }
      return to;
    }
    getMount() {
      return React.findDOMNode(this);
    }
    componentDidMount() {
      const node = this.getMount(this);
      this.mounted(this.step(node, this.mount(node)));
    }
    mount(node) {
      const {model, mount, fields} = this.props;

      for (var key of mount) {
        const field = fields[key];
        const value = model[key];
        node = field.mount(node, value);
      }

      return node;
    }
    // Reflect attributes not recognized by react.
    mounted(node) {
      const {model, mounted, fields} = this.props;

      for (var key of mounted) {
        const field = fields[key];
        node = this.step(node, field.mounted(node, model[key]));
      }

      return node;
    }
    write(node, current, past) {
      const {fields, write} = this.props;

      for (var key of write) {
        const field = fields[key];
        node = this.step(node, field.write(node, current[key], past[key]));
      }

      return node;
    }
    // Reflect attribute changes not recognized by react.
    componentDidUpdate({model: past}) {
      const {model: present} = this.props;
      this.write(this.getMount(), present, past);
    }
    componentWillUnmount() {
      const {model, unmount, fields} = this.props;
      const node = this.getMount(this);

      for (var key of unmount) {
        const field = fields[key];
        field.unmount(node, model[key]);
      }
    }
    // Render renders wrapped HTML node.
    render() {
      const {type, model, children, parent} = this.props;
      return node(type, model, children);
    }
  }

  const Element = (type, fields={}) =>
    ElementView.create(type, fields);

  // Exports:

  exports.ElementView = ElementView;
  exports.isMountHook = isMountHook;
  exports.isMountedHook = isMountedHook;
  exports.isWriteHook = isWriteHook;
  exports.isUnmountHook = isUnmountHook;
  exports.Element = Element;
  exports.BeforeAppendAttribute = BeforeAppendAttribute;
  exports.Attribute = Attribute;
  exports.VirtualAttribute = VirtualAttribute;
  exports.BubbledEvent = BubbledEvent;
  exports.CapturedEvent = CapturedEvent;
  exports.VirtualEvent = VirtualEvent;
  exports.ChromeEvent = ChromeEvent;
