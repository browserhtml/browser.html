/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, render} = require('reflex')
  const {StyleSheet, Style} = require('common/style');
  const WindowControls = require('./window-controls');
  const LocationBar = require('browser2/location-bar');
  const TabButton = require('browser2/tab-button');

  // Style

  const style = StyleSheet.create({
    container: {
      MozWindowDragging: 'drag',
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'space-between',
      scrollSnapCoordinate: '0 0',
    }
  });

  // view

  const view = (
      tabMode,
      shell,
      loader,
      progress,
      navigation,
      security,
      page,
      input,
      suggestions,
      selected,
      tabCount,
      theme,
      address) => html.div({
    key: 'WindowBar',
    style: Style(style.container, {backgroundColor: theme.shell})
  },[
    render('WindowControls', WindowControls.view, shell, theme, address),
    render('LocationBar', LocationBar.view, loader, progress, security, navigation, page, input, suggestions, shell, theme, address),
    render('TabButton', TabButton.view, tabMode, selected, tabCount, theme, address),
  ]);
  exports.view = view;
});
