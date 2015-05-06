/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function(require, exports, module) {

  'use strict';

  const React = require('react');

  class Component extends React.Component {
    static fromRecord(Type) {
      class RecordComponent extends Component {
        constructor() {
          React.Component.apply(this, arguments);
        }
        render() {
          const {input, output} = this.props;

          if (Component.debugger) {
            Component.debugger(Type, input, output);
          }

          return Type.render(input, output)
        }
      }
      RecordComponent.prototype.displayName = Type.displayName;

      return RecordComponent;
    }
    static defaultDebugger(Type, input, output) {
      console.log("Render", Type.displayName, Type, input, output)
    }
    static debug(debug=Component.deafultDebugger) {
      this.debugger = debug;
    }

    constructor() {
      super.constructor(...arguments);
    }
    componentWillMount() {
      const {output} = this.props;
      const dispatchNames = Object.keys(output);
      const dispatchTable = {};
      const count = dispatchNames.length;

      let index = 0;
      while (index < count) {
        const name = dispatchNames[index];
        const handler = output[name];
        if (typeof(handler) === "function") {
          dispatchTable[name] = this.dispatch.bind(this, name);
          index = index + 1;
        } else {
          dispatchNames.splice(index, 1);
        }
      }

      this.setState({dispatchTable, dispatchNames});
    }
    componentWillReceiveProps(props) {
      const {output} = props;
      if (this.props.output !== output) {
        const {dispatchNames, dispatchTable} = this.state;
        const names = Object.keys(output);
        const count = names.length;

        let isTableChanged = false;
        let index = 0;
        while (index < count) {
          const name = names[index];
          const handler = output[name];

          if (typeof(handler) === "function") {
            if (!dispatchTable[name]) {
              isTableChanged = true;
              dispatchTable[name] = this.dispatch.bind(this, name);
            }
            index = index + 1;
          } else {
            names.splice(index, 1);
          }
        }

        if (isTableChanged || names.length !== dispatchNames.length) {
          this.setState({dispatchNames: names});
        }
      }
    }
    shouldComponentUpdate(props, state) {
      const result = !this.props.input.equals(props.input) ||
        this.state.dispatchNames !== state.dispatchNames;

      if (result && Component.debugger) {
        console.log("theme", this.props.input.theme === props.input.theme)
      }

      return result;
    }
    dispatch(name, ...params) {
      return this.props.handlers[name](...params);
    }
    render() {
      throw TypeError(`Subclass must implement a render method`);
    }
  }

  Component.defaultProps = {input: {}, output: {}};

  const render = (input, output) => {
    const {constructor} = input;
    const component = constructor.component ||
          (constructor.component = Component.fromRecord(constructor));
    return React.createElement(component, {key: input.key, input, output});
  }
  render.debug = (debug=Component.defaultDebugger) => Component.debug(debug);

  exports.render = render;
  exports.DOM = React.DOM;
});
