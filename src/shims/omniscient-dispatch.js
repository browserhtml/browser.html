/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  // This is a workaround for the issue described here:
  // https://github.com/omniscientjs/omniscient/issues/67

  const delegate = delegee => {
    const delegate = (...args) => delegate.delegee(...args);
    return delegate
  }

  const isEventHandler = (props, key) => typeof(props[key]) == 'function';

  exports.getInitialState = function() {
    return {handlers: {}}
  };

  exports.componentWillReceiveProps = function(props) {
    const {handlers} = this.state;
    for (let key of Object.keys(props)) {
      if (isEventHandler(props, key)) {
        if (!(key in handlers)) {
          handlers[key] = delegate();
        }
        handlers[key].delegee = props[key];
        props[key] = handlers[key];
      }
    }
    this.setState({handlers});
  }
});
