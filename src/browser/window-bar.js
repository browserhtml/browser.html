/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  'use strict';

  const {html, thunk:render} = require('reflex')
  const {StyleSheet, Style} = require('../common/style');
  const Preview = require('./web-preview');

  // Style

  const style = StyleSheet.create({
    panel: {
      backgroundColor: 'inherit',
      color: 'inherit',
      MozWindowDragging: 'drag',
      transition: 'background-color 300ms ease, color 300ms ease',
      textAlign: 'center',
      position: 'relative',
      zIndex: 2,
      visibility: null
    },
    visible: {visibility: 'visible'},
    invisible: {visibility: 'hidden'},
    header: {
      boxShadow: null,
      padding: '3px 0',
      height: '28px',
      zIndex: 100,
      position: 'relative'
    },
    dark: {
      boxShadow: '0 1px 0 rgba(255, 255, 255, 0.15)'
    },
    light: {
      boxShadow: '0 1px 0 rgba(0, 0, 0, 0.08)'
    }
  });


  // view

  const view = (mode, id, shell, theme, address) => html.div({
    key: 'WindowBar',
    className: 'window-bar-panel',
    style: Style(style.panel,
                 (id && mode === 'show-web-view') ? style.visible :
                 style.invisible,
                 {backgroundColor: theme.shell, color: theme.shellText}),
  }, [
    html.div({
      key: 'header',
      className: 'window-bar-header',
      style: Style(style.header,
                   theme.isDark ? style.dark : style.light)
    }, [
      render('PreviewControls', Preview.viewControls, theme, address),
    ])
  ]);
  exports.view = view;
