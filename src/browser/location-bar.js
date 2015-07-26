/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, Maybe} = require('common/typed');
  const {html, render} = require('reflex');
  const URI = require('common/url-helper');
  const {StyleSheet, Style} = require('common/style');

  const {KeyBindings} = require('common/keyboard');
  const Editable = require('common/editable');
  const Focusable = require('common/focusable');
  const WebView = require('./web-view');
  const Navigation = require('./web-navigation');

  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const Suggestions = require('./suggestion-box');
  const ClassSet = require('common/class-set');

  const Theme = require('./theme');

  // Model

  // Style

  const style = StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 101,
      top: 0,
      width: '100vw',
      textAlign: 'center',
      pointerEvents: 'none'
    },
    bar: {
      display: 'inline-block',
      MozWindowDragging: 'no-drag',
      borderRadius: 5,
      overflow: 'hidden',
      // Contains absolute elements
      position: 'relative',
      pointerEvents: 'all',
      width: null
    },
    inactive: {
      height: 22,
      lineHeight: '22px',
      padding: '0 22px',
      top: 3,
      width: 250,
    },
    active: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 1)',
      height: 30,
      lineHeight: '30px',
      padding: '0 30px',
      width: 400,
      top: 40,
    },
    button: {
      opacity: null,
      pointerEvents: null,
      display: null,
      left: null,
      right: null,

      color: 'inherit',
      position: 'absolute',
      top: 0,
      width: 30,
      height: 30,
      fontFamily: 'FontAwesome',
      textAlign: 'center',
      fontSize: '17px',
      verticalAlign: 'middle',
      cursor: 'default'
    },

    back: {left: 0},
    reload: {right: 0},
    stop: {right: 0},
    dashboard: {right: 0},

    input: {
      color: '#333',
      width: '100%',
      lineHeight: '22px',
      overflow: 'hidden',
      borderRadius: 0
    },

    summary: {
      color: null,
      backgroundColor: null,

      overflow: 'hidden',
      // This allows us to stay centered when text is short, but expand into the
      // empty space to the right when text overflows, but not so far that we
      // cut off the elipsis.
      maxWidth: 'calc(100% + 20px)',
      display: 'inline-block',
      textOverflow: 'ellipsis',
      textAlign: 'center'
    },

    visible: {
      visibility: 'visible'
    },
    invisible: {
      visibility: 'hidden'
    },

    // The icon we show in the collapsed location box
    searchIconSmall: {
      fontSize: '13px',
      fontFamily: 'FontAwesome',
      left: '5px',
      position: 'absolute'
    },

    // The icon we show in the collapsed location box
    searchIconLarge: {
      fontSize: '16px',
      fontFamily: 'FontAwesome',
      left: '9px',
      position: 'absolute'
    },

    disabled: {opacity: 0.2, pointerEvents: 'none'},
    hidden: {display: 'none'},

    security: {
      fontFamily: 'FontAwesome',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  });



  // view

  const Binding = KeyBindings({
    'up': _ => Suggestions.SelectPrevious(),
    'control p': _ => Suggestions.SelectPrevious(),
    'down': _ => Suggestions.SelectNext(),
    'control n': _ => Suggestions.SelectNext(),
    'enter': event => Input.Action({
      action: Input.Submit({value: event.target.value})
    }),
    'escape': _ => Input.Action({action: Focusable.Blur()}),
  }, 'LocationBar.Keyboard.Action');


  const BackIcon = '\uf053';
  const GearIcon = '\uf013';
  const LockIcon = '\uf023';
  const ReloadIcon = '\uf01e';
  const StopIcon = '\uf00d';
  const SEARCH_ICON = '\uf002';

  const Change = ({target}) =>
    Editable.Change({
      id: '@selected',
      value: target.value,
      selection: Editable.Selection({
        start: target.selectionStart,
        end: target.selectionEnd,
        direction: target.selectionDirection
      })
    });

  const viewBar = isActive => (address, children) => html.div({
    style: style.container,
  }, [
    html.div({
      key: 'LocationBar',
      className: ClassSet({
        'location-bar': true
      }),
      style: Style(style.bar,
                   isActive ? style.active : style.inactive),
      onClick: address.pass(Focusable.Focus)
    }, children)
  ]);

  const viewActiveBar = viewBar(true);
  const viewInactiveBar = viewBar(false);

  const InputAction = action => Input.Action({action});

  const viewInDashboard = (loader, security, page, input, suggestions, theme, address) => {
    // Make forwarding addres that wraps actions into `Input.Action`.
    const inputAddress = address.forward(InputAction);
    return viewActiveBar(inputAddress, [
      html.span({
        key: 'icon',
        style: Style(style.searchIconLarge, style.visible)
      }, SEARCH_ICON),
      Editable.view({
        key: 'input',
        className: 'location-bar-input',
        placeholder: 'Search or enter address',
        type: 'text',
        value:
          suggestions.selected >= 0 ?
            suggestions.entries.get(suggestions.selected).uri :
            (input.value || ''),
        style: style.input,
        isFocused: input.isFocused,
        selection: input.selection,
        onChange: inputAddress.pass(Change),
        onFocus: inputAddress.pass(Focusable.Focused),
        onBlur: inputAddress.pass(Focusable.Blured),
        onKeyDown: address.pass(Binding)
      })
    ]);
  }

  const viewInWebView = (loader, security, page, input, suggestions, theme, address) => {
    const isSecure = security && security.secure;
    const isPrivileged = loader && URI.isPrivileged(loader.uri);
    const title =
      !loader ? '' :
      page.title ? page.title :
      loader.uri ? URI.getDomainName(loader.uri) :
      'New Tab';

    const children = [];

    // Append security icon if needed
    if (isPrivileged) {
      children.push(html.span({
        key: 'securityicon',
        style: style.security
      }, GearIcon));
    } else if (isSecure) {
      children.push(html.span({
        key: 'securityicon',
        style: style.security
      }, LockIcon));
    }

    children.push(title);

    return viewInactiveBar(address.forward(InputAction), [
      html.span({
        key: 'icon',
        className: 'location-search-icon',
        style: style.searchIconSmall
      }, SEARCH_ICON),
      html.div({
        key: 'page-summary',
        style: style.summary
      }, children)
    ]);
  };

  const view = (mode, ...rest) =>
    mode === 'show-web-view' ? viewInWebView(...rest) :
    viewInDashboard(...rest);

  // TODO: Consider seperating location input field from the location bar.

  exports.view = view;
});
