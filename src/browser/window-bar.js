/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, Maybe} = require('common/typed');
  const {html, render} = require('reflex')
  const ClassSet = require('common/class-set');
  const {mix} = require('common/style');

  const Progress = require('./progress-bar');
  const WindowControls = require('./window-controls');
  const LocationBar = require('./location-bar');
  const Preview = require('./web-preview');

  const Theme = require('./theme');
  const WebView = require('./web-view');

  // Model

  const NavigationPanelStyle = Record({
    backgroundColor: 'inherit',
    color: 'inherit',
    MozWindowDragging: 'drag',
    transition: 'background-color 300ms ease, color 300ms ease',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
    visibility: Maybe(String)
  });


  // view

  const view = (isActive, shell, webView, theme, address) => html.div({
    key: 'WindowBar',
    style: NavigationPanelStyle({
      backgroundColor: theme.shell,
      color: theme.shellText,
      visibility: (webView && isActive) ? 'visible' : 'hidden'
    }),
    className: ClassSet({
      navbar: true,
    })
  }, [
    html.div({
      key: 'header',
      style: {
        boxShadow: shell.isFocused && '0 1px 0 rgba(0, 0, 0, 0.08)',
        padding: '3px 0',
        height: '28px',
        zIndex: 100,
        position: 'relative'
      }
    }, [
      render('PreviewControls', Preview.viewControls, theme, address),
    ]),
    webView && render('ProgressBar', Progress.view,
                      webView.progress, webView.id, theme, address)
  ]);
  exports.view = view;
});
