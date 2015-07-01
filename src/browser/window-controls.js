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
    backgroundImage: 'url(css/window-controls-light.sprite.png)',
    backgroundPosition: '0 0',
    backgroundRepeat: 'no-repeat',
    // Scale sprite by 1/2 for retina.
    backgroundSize: '12px auto',
    width: 12,
    height: 12,
    left: 0,
    position: 'absolute',
    top: 0,
  });
  ButtonStyle.close = ButtonStyle({
    left: 0,
  });
  ButtonStyle.min = ButtonStyle({
    backgroundPosition: '0 -50px',
    left: 20,
  });
  ButtonStyle.max = ButtonStyle({
    backgroundPosition: '0 -100px',
    left: 40,
  });

  const buttonThemeDark = {
    backgroundImage: 'url(css/window-controls-dark.sprite.png)'
  };

  const ContainerStyle = Record({
    height: 12,
    position: 'absolute',
    width: 50,
    top: 8,
    left: 8,
    verticalAlign: 'center',
    zIndex: 200
  });
  ContainerStyle.light = ContainerStyle();
  ContainerStyle.dark = ContainerStyle({
    backgroundImage: 'url(css/stoplights-dark-theme.png)',
  });


  // Actions that will are send by window controls.
  const {Shutdown, Minimize, Maximize} = Runtime.Action;

  const view = ({isFocused}, theme, address) => html.div({
    key: 'WindowControls',
    style: theme.isDark ? ContainerStyle.dark : ContainerStyle.light,
  }, [
    html.button({
      key: 'WindowCloseButton',
      style: theme.isDark ?
        ButtonStyle.close.merge(buttonThemeDark) : ButtonStyle.close,
      onClick: address.pass(Shutdown, void(0))
    }),
    html.button({
      key: 'WindowMinButton',
      style: theme.isDark ?
        ButtonStyle.min.merge(buttonThemeDark) : ButtonStyle.min,
      onClick: address.pass(Minimize, void(0))
    }),
    html.button({
      key: 'WindowMaxButton',
      style: theme.isDark ?
        ButtonStyle.max.merge(buttonThemeDark) : ButtonStyle.max,
      onClick: address.pass(Maximize, void(0))
    })
  ]);
  exports.view = view;
});
