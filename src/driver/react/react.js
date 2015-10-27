/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */
'use strict';

import * as React from 'react';

export const Component = React.Component;
export const findDOMNode = element =>
  React.findDOMNode(element.props.reflex.proxy);
export const createElement = (type, props, children) => {
  props.reflex = {type};
  return React.createElement(Proxy, props, children);
}

if (React.Component.Proxy == null) {
  class Proxy extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.state = this.retarget(props);
    }
    retarget(props) {
      const {reflex} = props;
      reflex.proxy = this;
      return {target: new reflex.type(props, this.context)}
    }
    componentWillMount() {
      const {target} = this.state;
      if (target.componentWillMount != null) {
        return target.componentWillMount();
      }
    }
    componentDidMount() {
      const {target} = this.state;
      if (target.componentDidMount != null) {
        return target.componentDidMount();
      }
    }
    componentWillReceiveProps(nextProps) {
      const {reflex} = nextProps;
      if (this.props.reflex.type !== reflex.type) {
        this.componentWillUnmount();
        this.setState(this.retarget(nextProps));
      } else {
        const {target} = this.state;
        reflex.proxy = this;
        if (target.componentWillReceiveProps != null) {
          target.componentWillReceiveProps(nextProps);
        }
      }
    }
    shouldComponentUpdate(nextProps, nextState) {
      const {target} = nextState;
      if (this.state.target !== target) {
        return true;
      }

      if (target.shouldComponentUpdate != null) {
        return target.shouldComponentUpdate(nextProps, nextState);
      } else {
        return this.props !== nextProps || this.state !== nextState;
      }
    }
    componentWillUpdate(nextProps, nextState) {
      const {target} = this.state;
      if (target.componentWillUpdate != null) {
        return target.componentWillUpdate(nextProps, nextState);
      }
      target.props = nextProps;
      target.state = nextState;
    }
    componentDidUpdate(prevProps, prevState) {
      const {target} = this.state;
      if (target.componentDidUpdate != null) {
        return target.componentDidUpdate(prevProps, prevState);
      }
    }
    componentWillUnmount() {
      const {target} = this.state;
      if (target.componentWillUnmount != null) {
        target.componentWillUnmount();
      }
    }
    render() {
      return this.state.target.render();
    }
  }
  React.Component.Proxy = Proxy;
}

export const Proxy = React.Component.Proxy;
