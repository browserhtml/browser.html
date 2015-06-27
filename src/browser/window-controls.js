/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Maybe, Union} = require('common/typed');
  const {html} = require('reflex');
  const Runtime = require('common/runtime');

  // View

  const ButtonStyle = Record({
    backgroundColor: '',
    color: '',
    display: 'inline-block',
    width: 12,
    height: 12,
    marginRight: 8,
    borderRadius: '50%',
  }, 'ControlButtonStyle');
  ButtonStyle.min = ButtonStyle({
    backgroundColor: '#FDBC40'
  });
  ButtonStyle.max = ButtonStyle({
    backgroundColor: '#33C748'
  });
  ButtonStyle.close = ButtonStyle({
    backgroundColor: '#FC5753'
  });
  ButtonStyle.unfocused = ButtonStyle({
    backgroundColor: 'hsl(0, 0%, 86%)'
  });

  const containerStyle = {
    position: 'absolute',
    top: 8,
    left: 8,
    verticalAlign: 'center',
    zIndex: 200
  };


  // Actions that will are send by window controls.
  const {Shutdown, Minimize, Maximize} = Runtime.Action;

  const view = ({isFocused}, theme, address) => html.div({
    key: 'WindowControls',
    style: containerStyle
  }, [
    html.button({
      key: 'WindowCloseButton',
      style: isFocused ? ButtonStyle.close.merge({
        backgroundColor: theme.closeButton
      }) : ButtonStyle.unfocused,
      onClick: address.pass(Shutdown, void(0))
    }),
    html.button({
      key: 'WindowMinButton',
      style: isFocused ? ButtonStyle.min.merge({
        backgroundColor: theme.minButton
      }) : ButtonStyle.unfocused,
      onClick: address.pass(Minimize, void(0))
    }),
    html.button({
      key: 'WindowMaxButton',
      style: isFocused ? ButtonStyle.max.merge({
        backgroundColor: theme.maxButton
      }) : ButtonStyle.unfocused,
      onClick: address.pass(Maximize, void(0))
    })
  ]);
  exports.view = view;
});
