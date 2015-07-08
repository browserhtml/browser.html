/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

define((require, exports, module) => {

  'use strict';

  const React = require('react');
  const {node} = require('reflex');

  const isPreMountHook = field => field && field.mount;

  const isPostMountHook = field => field && field.mounted;

  const isUpdateHook = field => field && field.write;

  const isConstractorHook = field => field && field.construct;

  class ElementView extends React.Component {
    constructor() {
      React.Component.apply(this, arguments);

      const {type, fields, mount, mounted, write} = this.props;
      const hooks = Object.create(null);

      for (var key in fields) {
        if (fields.hasOwnProperty(key)) {
          const field = fields[key];
          const hook = field.construct ? field.construct() : field;
          hooks[key] = hook;
        }
      }

      this.displayName = `html:${type}`
      this.state = hooks;
    }
    // Reflect attributes not recognized by react.
    componentDidMount() {
      const node = React.findDOMNode(this);
      const {model, mount, mounted} = this.props;
      const hooks = this.state;

      if (mount.length > 0) {
        for (var key of mount) {
          const hook = hooks[key];
          const value = model[key];
          hook.mount(node, value);
        }

        // Pre mount fields need to be set before node
        // is in the document. Since react does not has
        // an appropriate hook we replace node with itself
        // to trigger desired behavior.
        node.parentNode.replaceChild(node, node);
      }

      for (var key of mounted) {
        const hook = hooks[key];
        hook.mounted(node, model[key]);
      }
    }
    // Reflect attribute changes not recognized by react.
    componentDidUpdate({model: past}) {
      const node = React.findDOMNode(this);
      const {model, write} = this.props;
      const hooks = this.state;

      for (var key of write) {
        const hook = hooks[key];
        hook.write(node, model[key], past[key]);
      }
    }
    // Render renders wrapped HTML node.
    render() {
      const {type, model, children, parent} = this.props;
      return node(type, model, children);
    }
  }

  const Element = (type, fields={}) => {
    // In react you can actually define custom HTML element it's
    // just set of attributes you'll be able to set will be limited
    // to React's white list. To workaround that we define React
    // custom HTML element factory & custom react component that
    // will render that HTML element via custom factory.

    const keys = Object.keys(fields);
    const mount = keys.filter(key => isPreMountHook(fields[key]));
    const mounted = keys.filter(key => isPostMountHook(fields[key]));
    const write = keys.filter(key => isUpdateHook(fields[key]));
    const construct = keys.filter(key => isConstractorHook(fields[key]));

    return (model, children) =>
      React.createElement(ElementView, {
        model, type,
        key: model.key || model.id,
        fields,
        mount, mounted, write
      }, children);
  };

  // BeforeAppendAttribute can be used to define attribute on the
  // element that is set once before element is inserted into a
  // document (mounted). Changes to this property are ignored &
  // in general use of `Attribute` is preferred, this should be
  // reserved only for attributes changes to which aren't picked up
  // after node is in the tree.
  // Example: Element('iframe', { browser: BeforeAppendAttribute('mozbrowser') })
  const BeforeAppendAttribute = function(name) {
    if (!(this instanceof BeforeAppendAttribute)) {
      return new BeforeAppendAttribute(name);
    }

    this.name = name;
  }
  BeforeAppendAttribute.prototype = {
    constructor: BeforeAppendAttribute,
    mount(node, value) {
      if (value != void(0)) {
        node.setAttribute(this.name, value);
      }
    },
    write(node, present, past) {
      Attribute.prototype.write.call(this, node, present, past)
      if (present !== past) {
        node.parentNode.replaceChild(node, node)
      }
    }
  };
  Element.BeforeAppendAttribute = BeforeAppendAttribute;

  // Attribute can be used to define field mapped to a
  // DOM attribute with a given `name`. If the field is
  // set to `undefined` or `null` attribute is removed
  // othrewise it's set to given value.
  // Example: Element('hbox', {flex: Attribute('flex')})
  const Attribute = function(name) {
    if (!(this instanceof Attribute)) {
      return new Attribute(name);
    }

    this.name = name;
  };
  Attribute.prototype = {
    constructor: Attribute,
    mounted(node, value) {
      if (value != void(0)) {
        node.setAttribute(this.name, value);
      }
    },
    write(node, present, past) {
      if (present != past) {
        if (present == void(0)) {
          node.removeAttribute(this.name);
        } else {
          node.setAttribute(this.name, present);
        }
      }
    }
  }
  Element.Attribute = Attribute;

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
  const VirtualAttribute = function(write) {
    if (!(this instanceof VirtualAttribute)) {
      return new VirtualAttribute(write);
    }
    this.write = write;
  };
  VirtualAttribute.prototype = {
    constructor: Attribute,
    mounted(node, value) {
      this.write(node, value, void(0));
    }
  };
  Element.VirtualAttribute = VirtualAttribute;

  // Event can be used to define event handler fields, for
  // the given event `type`. When event of that type occurs
  // event handler assigned to the associated field will be
  // invoked. Optionally `read` function can be passed as a
  // second argument, in which case event handler will be
  // invoked with `read(event)` instead of `event`.
  // Example:
  // Element('iframe', {onTitleChange: Event('mozbrowsertitlechange')})
  const Event = function(type, read, capture=false) {
    if (!(this instanceof Event)) {
      return new Event(type, read, capture);
    }
    this.type = type;
    this.read = read;
    this.capture = capture;
  };
  Event.prototype = {
    constructor: Event,
    construct() {
      return new this.constructor(this.type,
                                  this.read,
                                  this.capture);
    },
    capture: false,
    mounted(node, handler) {
      this.handler = handler;
      const target = this.read ? this.read(node) : node;
      target.addEventListener(this.type, this, this.capture);
    },
    write(node, present) {
      this.handler = present;
    },
    handleEvent(event) {
      if (this.handler) {
        this.handler(event);
      }
    }
  };
  Element.Event = Event;

  const ChromeEvent = function(type) {
    if (!(this instanceof ChromeEvent)) {
      return new ChromeEvent(type);
    }
    this.type = type;
  };
  ChromeEvent.prototype = {
    constructor: ChromeEvent,
    construct() {
      return new this.constructor(this.type);
    },
    mounted(node, handler) {
      this.handler = handler;
      window.addEventListener('mozChromeEvent', this);
    },
    write(node, present) {
      this.handler = present;
    },
    handleEvent(event) {
      if (this.handler && this.type == event.detail.type) {
        this.handler(event);
      }
    }
  };
  Element.ChromeEvent = ChromeEvent;

  // CapturedEvent can be used same as `Event` with a difference
  // that events listeners will be added with a capture `true`.
  const CapturedEvent = function(type, read) {
    if (!(this instanceof CapturedEvent)) {
      return new CapturedEvent(type, read);
    }

    this.type = type;
    this.read = read;
    this.capture = true;
  }
  CapturedEvent.prototype = Event.prototype;
  Element.CapturedEvent = CapturedEvent;

  const VirtualEvent = function(setup) {
    if (!(this instanceof VirtualEvent)) {
      return new VirtualEvent(setup);
    }

    this.setup = setup;
  }
  VirtualEvent.prototype = {
    constructor: VirtualEvent,
    construct() {
      return new this.constructor(this.setup);
    },
    mounted(node, handler) {
      this.write(node, handler);
      this.setup(node, this.handleEvent.bind(this));
    },
    write(node, present) {
      this.handler = present;
    },
    handleEvent(event) {
      if (this.handler) {
        this.handler(event);
      }
    }
  };
  Element.VirtualEvent = VirtualEvent;

  // Exports:

  exports.isPreMountHook = isPreMountHook;
  exports.isPostMountHook = isPostMountHook;
  exports.isUpdateHook = isUpdateHook;
  exports.isConstractorHook = isConstractorHook;
  exports.Element = Element;
  exports.BeforeAppendAttribute = BeforeAppendAttribute;
  exports.Attribute = Attribute;
  exports.VirtualAttribute = VirtualAttribute;
  exports.Event = Event;
  exports.CapturedEvent = CapturedEvent;
  exports.VirtualEvent = VirtualEvent;
  exports.ChromeEvent = ChromeEvent;
});
