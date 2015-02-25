/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {DOM} = require('react')
  const Component = require('omniscient');
  const {InputField} = require('./editable');
  const {Element} = require('./element');
  const {navigateTo, showTabStrip, focus} = require('./actions');
  const {KeyBindings} = require('./keyboard');
  const url = require('./util/url');
  const {ProgressBar} = require('./progressbar');

  const WindowControls = Component('WindowControls', ({theme}) =>
    DOM.div({className: 'windowctrls'}, [
      DOM.div({className: 'windowctrl win-close-button',
               style: theme.windowCloseButton,
               title: 'close',
               key: 'close',
               onClick: event => window.close()}),
      DOM.div({className: 'windowctrl win-min-button',
               style: theme.windowMinButton,
               title: 'minimize',
               key: 'minimize',
               onClick: event => window.minimize()}),
      DOM.div({className: 'windowctrl win-max-button',
               style: theme.windowMaxButton,
               title: 'maximize',
               key: 'maximize',
               onClick: event => {
                 if (document.mozFullScreenElement) {
                   document.mozCancelFullScreen();
                 } else {
                   document.body.mozRequestFullScreen();
                 }
               }})
    ]));

  const inputBindings = KeyBindings({'escape': focus});


  const NavigationControls = Component('NavigationControls', ({inputCursor, tabStripCursor,
                                         webViewerCursor, theme}) =>
    DOM.div({
      className: 'locationbar',
      onMouseEnter: event => showTabStrip(tabStripCursor)
    }, [
      ProgressBar({key: 'progressbar', webViewerCursor, theme}),
      DOM.div({className: 'backbutton',
               style: theme.backButton,
               key: 'back',
               onClick: event => webViewerCursor.set('readyState', 'goBack')}),
      InputField({
        key: 'input',
        className: 'urlinput',
        style: theme.urlInput,
        placeholder: 'Search or enter address',
        value: inputCursor.get('value') || webViewerCursor.get('location'),
        type: 'text',
        submitKey: 'Enter',
        isFocused: inputCursor.get('isFocused'),
        selection: inputCursor.get('isFocused'),
        onFocus: _ => inputCursor.set('isFocused', true),
        onBlur: _ => inputCursor.set('isFocused', false),
        onChange: event => inputCursor.set('value', event.target.value),
        onSubmit: event => navigateTo({inputCursor, webViewerCursor: webViewerCursor}, event.target.value, true),
        onKeyUp: inputBindings(webViewerCursor),
      }),
      DOM.p({key: 'page-info',
             className: 'pagesummary',
             style: theme.pageInfoText,
             onClick: event => inputCursor.set('isFocused', true)}, [
        DOM.span({key: 'location',
                  style: theme.locationText,
                  className: 'pageurlsummary'},
                 webViewerCursor.get('location') ? url.getDomainName(webViewerCursor.get('location')) : ''),
        DOM.span({key: 'title',
                  className: 'pagetitle',
                  style: theme.titleText},
                 webViewerCursor.get('title') ? webViewerCursor.get('title') :
                 webViewerCursor.get('isLoading') ? 'Loading...' :
                 webViewerCursor.get('location') ? webViewerCursor.get('location') :
                 'New Tab')
      ]),
      DOM.div({key: 'reload-button',
               className: 'reloadbutton',
               style: theme.reloadButton,
               onClick: event => webViewerCursor.set('readyState', 'reload')}),
      DOM.div({key: 'stop-button',
               className: 'stopbutton',
               style: theme.stopButton,
               onClick: event => webViewerCursor.set('readyState', 'stop')}),
    ]));

  const NavigationPanel = Component('NavigationPanel', ({key, inputCursor, tabStripCursor, webViewerCursor, title, theme}) => {
    return DOM.div({
      key,
      style: theme.navigationPanel,
      className: 'navbar' + (inputCursor.get('isFocused') ? ' urledit' : '') +
                            (webViewerCursor.get('canGoBack') ? ' cangoback' : '') +
                            (webViewerCursor.get('location') ? ' canreload' : '') +
                            (webViewerCursor.get('isLoading') ? ' loading' : '') +
                            (webViewerCursor.get('securityState') == 'secure' ? ' ssl' : '') +
                            (webViewerCursor.get('securityExtendedValidation') ? ' sslv' : '')
    }, [
      WindowControls({key: 'controls', theme}),
      NavigationControls({key: 'navigation', inputCursor, tabStripCursor,
                          webViewerCursor, title, theme}),
      DOM.div({key: 'spacer', className: 'freeendspacer'})
    ])
  });

  // Exports:

  exports.WindowControls = WindowControls;
  exports.NavigationControls = NavigationControls;
  exports.NavigationPanel = NavigationPanel;

});
