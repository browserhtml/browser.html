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

  const WindowControls = Component(({theme}) =>
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


  const NavigationControls = Component(({inputCursor, tabStripCursor,
                                         selectedWebViewerCursor, title, theme}) =>
    DOM.div({
      className: 'locationbar',
      onMouseEnter: event => tabStripCursor.set('isActive', true)
    }, [
      DOM.div({className: 'backbutton',
               style: theme.backButton,
               key: 'back',
               onClick: event => selectedWebViewerCursor.set('readyState', 'goBack')}),
      InputField({
        key: 'input',
        className: 'urlinput',
        style: theme.urlInput,
        placeholder: 'Search or enter address',
        value: inputCursor.get('value') || selectedWebViewerCursor.get('location'),
        type: 'text',
        submitKey: 'Enter',
        isFocused: inputCursor.get('isFocused'),
        selection: inputCursor.get('isFocused'),
        onFocus: _ => inputCursor.set('isFocused', true),
        onBlur: _ => inputCursor.set('isFocused', false),
        onChange: event => inputCursor.set('value', event.target.value),
        onSubmit: event => navigateTo({inputCursor, webViewerCursor: selectedWebViewerCursor}, event.target.value, true),
        onKeyUp: inputBindings(selectedWebViewerCursor),
      }),
      DOM.p({key: 'page-info',
             className: 'pagesummary',
             style: theme.pageInfoText,
             onClick: event => inputCursor.set('isFocused', true)}, [
        DOM.span({key: 'location',
                  style: theme.locationText,
                  className: 'pageurlsummary'},
                 selectedWebViewerCursor.get('location') ? url.getDomainName(selectedWebViewerCursor.get('location')) : ''),
        DOM.span({key: 'title',
                  className: 'pagetitle',
                  style: theme.titleText},
                 title ? title :
                 selectedWebViewerCursor.get('isLoading') ? 'Loading...' :
                 selectedWebViewerCursor.get('location') ? selectedWebViewerCursor.get('location') :
                 'New Tab')
      ]),
      DOM.div({key: 'reload-button',
               className: 'reloadbutton',
               style: theme.reloadButton,
               onClick: event => selectedWebViewerCursor.set('readyState', 'reload')}),
      DOM.div({key: 'stop-button',
               className: 'stopbutton',
               style: theme.stopButton,
               onClick: event => selectedWebViewerCursor.set('readyState', 'stop')}),
    ]));

  const NavigationPanel = Component(({key, inputCursor, tabStripCursor, selectedWebViewerCursor, title, theme}) => {
    return DOM.div({
      key,
      style: theme.navigationPanel,
      className: 'navbar' + (inputCursor.get('isFocused') ? ' urledit' : '') +
                            (selectedWebViewerCursor.get('canGoBack') ? ' cangoback' : '') +
                            (selectedWebViewerCursor.get('location') ? ' canreload' : '') +
                            (selectedWebViewerCursor.get('isLoading') ? ' loading' : '') +
                            (selectedWebViewerCursor.get('securityState') == 'secure' ? ' ssl' : '') +
                            (selectedWebViewerCursor.get('securityExtendedValidation') ? ' sslv' : '')
    }, [
      WindowControls({key: 'controls', theme}),
      NavigationControls({key: 'navigation', inputCursor, tabStripCursor,
                          selectedWebViewerCursor, title, theme}),
      DOM.div({key: 'spacer', className: 'freeendspacer'})
    ])
  });

  // Exports:

  exports.WindowControls = WindowControls;
  exports.NavigationControls = NavigationControls;
  exports.NavigationPanel = NavigationPanel;

});
