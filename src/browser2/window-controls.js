/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html} = require('reflex');
  const {Style, StyleSheet} = require('common/style');
  const Runtime = require('common/runtime');
  const OS = require('common/os');

  // style

  const style = StyleSheet.create({
    placeholder: {
      width: 60,
      height: 12,
      padding: 4,
    },
    button: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      margin: '0 4px',
      backgroundColor: 'hsl(0, 0%, 86%)', // blur
    },
    container: {
      padding: '4px',
      display: 'flex',
      flexShrink: 0,
      MozWindowDragging: 'no-drag'
    }
  });

  // Style

  const viewDarwin = ({isFocused}, theme, address) => {
    return html.div({
      key: 'WindowControls',
      style: style.container,
    }, [
      html.button({
        key: 'WindowCloseButton',
        style: Style(style.button, isFocused && {backgroundColor: theme.shellText}),
        onClick: address.send(Runtime.Shutdown())
      }),
      html.button({
        key: 'WindowMinButton',
        style: Style(style.button, isFocused && {backgroundColor: theme.shellText}),
        onClick: address.send(Runtime.Minimize())
      }),
      html.button({
        key: 'WindowMaxButton',
        style: Style(style.button, isFocused && {backgroundColor: theme.shellText}),
        onClick: address.send(Runtime.Maximize())
      })
    ]);
  }

  const viewOther = () => html.div({style: style.placeholder});

  exports.view = OS.platform() == 'darwin' ? viewDarwin : viewOther;
});

