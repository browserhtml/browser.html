/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html} = require('reflex');
  const {Style, StyleSheet} = require('common/style');
  const {GoBack, GoForward, Stop, Reload} = require('service/navigation');

  // style

  const characters = {
    back: '\uf3D2',
    fwd: '\uf3D3',
    reload: '\uf49a',
    stop: '\uf404'
  }

  const styleButton = StyleSheet.create({
    button: {
      width: 14,
      fontSize: '12px',
      lineHeight: '14px',
      fontFamily: 'FontIon',
      verticalAlign: 'middle',
      textAlign: 'center',
    },
    enabled: {
    },
    disabled: {
      opacity: 0.2,
      pointerEvents: 'none',
    },
    displayed: {
    },
    collapsed: {
      display: 'none'
    }
  });

  const styleContainer = StyleSheet.create({
    default: {
      display: 'flex',
      flexShrink: 0,
      margin: '0 3px'
    },
  });

  // Style

  exports.viewHistoryButtons = ({isFocused}, navigation, address) => {

    const canGoBack = navigation && navigation.canGoBack;
    const canGoForward = navigation && navigation.canGoForward;

    return html.div({
      key: 'NavigationControlsHistory',
      style: styleContainer.default
    }, [
      html.div({
        key: 'NavigationBack',
        style: Style(styleButton.button, canGoBack ? styleButton.enabled : styleButton.disabled),
        onClick: address.send(GoBack())
      }, characters.back),
      html.div({
        key: 'NavigationFwd',
        style: Style(styleButton.button, canGoForward ? styleButton.displayed : styleButton.collapsed),
        onClick: address.send(GoForward())
      }, characters.fwd),
    ]);
  }

  exports.viewLoadButtons = ({isFocused}, progress, address) => {

    const canStop = progress && progress.loading;
    const canReload = progress && !progress.loading;

    return html.div({
      key: 'NavigationControlsLoad',
      style: styleContainer.default
    }, [
      html.div({
        key: 'NavigationStop',
        style: Style(styleButton.button, canStop ? styleButton.displayed : styleButton.collapsed),
        onClick: address.send(Stop())
      }, characters.stop),
      html.div({
        key: 'NavigationReload',
        style: Style(styleButton.button, canReload ? styleButton.displayed : styleButton.collapsed),
        onClick: address.send(Reload())
      }, characters.reload),
    ]);
  }

});


