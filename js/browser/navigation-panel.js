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

const WindowControls = Component(options =>
  DOM.div({className: 'windowctrls'}, [
    DOM.div({className: 'windowctrl win-close-button',
             title: 'close',
             key: 'close',
             onClick: event => window.close()}),
    DOM.div({className: 'windowctrl win-min-button',
             title: 'minimze',
             key: 'minimize',
             onClick: event => window.minimize()}),
    DOM.div({className: 'windowctrl win-max-button',
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
exports.WindowControls = WindowControls;

const inputBindings = KeyBindings({'escape': focus});


const NavigationControls = Component(({input, webViewer, title}) =>
  DOM.div({
    className: 'locationbar',
    onMouseEnter: event => showTabStrip(input),
  }, [
    DOM.div({className: 'backbutton',
             key: 'back',
             onClick: event => webViewer.set('readyState', 'goBack')}),
    InputField({
      key: 'input',
      className: 'urlinput',
      placeholder: 'Search or enter address',
      value: input.get('value') || webViewer.get('location'),
      type: 'text',
      submitKey: 'Enter',
      isFocused: input.get('isFocused'),
      selection: input.get('isFocused'),
      onFocus: _ => input.set('isFocused', true),
      onBlur: _ => input.set('isFocused', false),
      onChange: event => input.set('value', event.target.value),
      onSubmit: event => navigateTo({input, webViewer}, event.target.value, true),
      onKeyUp: inputBindings(webViewer),
    }),
    DOM.p({key: 'page-info',
           className: 'pagesummary',
           onClick: event => input.set('isFocused', true)}, [
      DOM.span({key: 'identity',
                className: 'identity'}, ''),
      DOM.span({key: 'location',
                className: 'pageurlsummary'},
               webViewer.get('location') ? url.getDomainName(webViewer.get('location')) : ''),
      DOM.span({key: 'title', className: 'pagetitle'},
               title ? title :
               webViewer.get('isLoading') ? 'Loading...' :
               webViewer.get('location') ? webViewer.get('location') :
               'New Tab')
    ]),
    DOM.div({key: 'reload-button',
             className: 'reloadbutton',
             onClick: event => webViewer.set('readyState', 'reload')}),
    DOM.div({key: 'stop-button',
             className: 'stopbutton',
             onClick: event => webViewer.set('readyState', 'stop')}),
  ]));
exports.NavigationControls = NavigationControls;

const NavigationPanel = Component(({key, input, webViewer, title}) => {
  return DOM.div({
    key,
    className: 'navbar' + (input.get('isFocused') ? ' urledit' : '')
                        + (webViewer.get('canGoBack') ? ' cangoback' : '')
                        + (webViewer.get('location') ? ' canreload' : '')
                        + (webViewer.get('isLoading') ? ' loading' : '')
                        + (webViewer.get('securityState') == 'secure' ? ' ssl' : '')
                        + (webViewer.get('securityExtendedValidation') ? ' sslv' : '')
  }, [
    WindowControls({key: 'controls'}),
    NavigationControls({key: 'navigation', input, webViewer, title}),
    DOM.div({key: 'spacer', className: 'freeendspacer'})
  ])
  });
exports.NavigationPanel = NavigationPanel;

});
