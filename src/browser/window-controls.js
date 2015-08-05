/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {html} = require('reflex');
  const {Style, StyleSheet} = require('../common/style');
  const Runtime = require('../common/runtime');

  // style

  const styleButton = StyleSheet.create({
    button: {
      backgroundPosition: '0 0',
      backgroundRepeat: 'no-repeat',
      // Scale sprite by 1/2 for retina.
      backgroundSize: '12px auto',
      width: 12,
      height: 12,
      left: 0,
      position: 'absolute',
      top: 0
    },
    close: {
      left: 0
    },
    min: {
      backgroundPosition: '0 -50px',
      left: 20
    },
    max: {
      backgroundPosition: '0 -100px',
      left: 40
    },
    light: {
      backgroundImage: 'url(css/window-controls-light.sprite.png)',
    },
    dark: {
      backgroundImage: 'url(css/window-controls-dark.sprite.png)'
    }
  });

  const styleContainer = StyleSheet.create({
    container: {
      height: 12,
      position: 'absolute',
      width: 50,
      top: 8,
      left: 8,
      zIndex: 200
    },
    light: {
    },
    dark: {
    }
  });

  // Style


  const view = ({isFocused}, theme, address) => html.div({
    key: 'WindowControls',
    style: styleContainer.container,
  }, [
    html.button({
      key: 'WindowCloseButton',
      style: Style(styleButton.button,
                   styleButton.close,
                   theme.isDark ? styleButton.dark : styleButton.light),
      onClick: address.send(Runtime.Shutdown())
    }),
    html.button({
      key: 'WindowMinButton',
      style: Style(styleButton.button,
                   styleButton.min,
                   theme.isDark ? styleButton.dark : styleButton.light),
      onClick: address.send(Runtime.Minimize())
    }),
    html.button({
      key: 'WindowMaxButton',
      style: Style(styleButton.button,
                   styleButton.max,
                   theme.isDark ? styleButton.dark : styleButton.light),
      onClick: address.send(Runtime.Maximize())
    })
  ]);
  exports.view = view;
