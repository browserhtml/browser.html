
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, render} = require('reflex');
  const {StyleSheet, Style} = require('common/style');
  const {KeyBindings} = require('common/keyboard');
  const Editable = require('common/editable');
  const Focusable = require('common/focusable');
  const URI = require('common/url-helper');
  const Input = require('browser/web-input');
  const NavigationControls = require('./navigation-controls');
  const WebView = require('browser/web-view');
  const Suggestions = require('browser/suggestion-box');

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

  // Style

  const styleLocationBarContainer = StyleSheet.create({
    default: {
      display: 'flex',
      width: '50%',
      padding: '3px 0',
      margin: '8px 3px',
      borderRadius: '100px',
      flexBasis: '300px',
      MozWindowDragging: 'no-drag',
    }
  });

  const styleIdentityIconContainer = StyleSheet.create({
    default: {
      flexShrink: 0,
    } 
  });

  const styleIdentityIcon = StyleSheet.create({
    default: {
      width: 14,
      fontSize: '12px',
      lineHeight: '14px',
      fontFamily: 'FontIon',
      verticalAlign: 'middle',
      textAlign: 'center',
      margin: '0 3px',
    },
    lock: {
      // FIXME: font alignement issue
      fontSize: '10px',
      transform: 'translateY(-0.5px)',
    },
    displayed: {
    },
    collapsed: {
      display: 'none',
    },
  });

  const styleInput = StyleSheet.create({
    default: {
      fontSize: '12px',
      lineHeight: '14px',
      flexGrow: 1,
      fontWeight: 'lighter',
      margin: '0 3px',
    },
    displayed: {
    },
    collapsed: {
      display: 'none',
    }
  });

  const stylePrettyURL = StyleSheet.create({

    container: {
      fontSize: '12px',
      lineHeight: '14px',
      height: '14px',
      flexGrow: 1,
      fontWeight: 'lighter',
      overflow: 'hidden',
      cursor: 'text',
      margin: '0 3px',
    },
    displayed: {
    },
    collapsed: {
      display: 'none',
    },

    protocol: { opacity: 0.4 },
    username: { opacity: 0.4 },
    hostname: { opacity: 1.0 },
    pathname: { opacity: 0.4 },
    search:   { opacity: 0.4 },
    hash:     { opacity: 0.4 },

  });


  // view

  const Binding = KeyBindings({
    'up': _ => Suggestions.SelectPrevious(),
    'down': _ => Suggestions.SelectNext(),
    'enter': e => Input.Action({action: Input.Submit({value: e.target.value})}),
    'escape': e => Input.Action({action: Focusable.Blur()}),
  }, 'LocationBar.Keyboard.Action');

  const characters = {
    gear: '\uf412',
    lock: '\uf200'
  };

  const view = (loader, progress, security, navigation, page, input, suggestions, shell, theme, address) => {

    const isSecure = security && security.secure;
    const isPrivileged = loader && URI.isPrivileged(loader.uri);

    const icons = html.div({
      style: styleIdentityIconContainer.default,
    }, [
      html.div({
        key: 'gearicon',
        style: Style(styleIdentityIcon.default, isPrivileged ? styleIdentityIcon.displayed : styleIdentityIcon.collapsed),
      }, characters.gear),
      html.div({
        key: 'lockicon',
        style: Style(styleIdentityIcon.default, styleIdentityIcon.lock, isSecure ? styleIdentityIcon.displayed : styleIdentityIcon.collapsed),
      }, characters.lock),
    ]);

    const inputAddress = address.forward(action => Input.Action({action}));

    var showInput = input.isFocused;

    var prettyURLChildren = [];
    if (loader && loader.uri) {
      const url = new URL(loader.uri); // FIXME: do that directly in loader's code
      prettyURLChildren = [
        html.span({style: stylePrettyURL.protocol}, url.protocol + '//'),
        // html.span({style: stylePrettyURL.username}, url.username + '@'),
        html.span({style: stylePrettyURL.hostname}, url.hostname),
        html.span({style: stylePrettyURL.pathname}, url.pathname),
        html.span({style: stylePrettyURL.search},   url.search),
        html.span({style: stylePrettyURL.hash},     url.hash)
      ];
    } else {
      showInput = true;
    }

    const prettyURL = html.div({
      style: Style(stylePrettyURL.container, showInput ? stylePrettyURL.collapsed : stylePrettyURL.displayed),
      key: 'prettyURL',
      onMouseDown: inputAddress.pass(Focusable.Focus),
    }, prettyURLChildren);

    const editable = Editable.view({
      style: Style(
        styleInput.default,
        showInput ? styleInput.displayed : styleInput.collapsed,
        { color: theme.locationText }),
      key: 'input',
      placeholder: 'Search or enter address',
      type: 'text',
      value: suggestions.selected >= 0 ?
              suggestions.entries.get(suggestions.selected).uri :
              (input.value || ''),
      isFocused: input.isFocused,
      selection: input.selection,
      onChange: inputAddress.pass(Change),
      onFocus: inputAddress.pass(Focusable.Focused),
      onBlur: inputAddress.pass(Focusable.Blured),
      onKeyDown: address.pass(Binding)
    })

    const navButtons1 = render('NavigationControlsHistory', NavigationControls.viewHistoryButtons, shell, navigation, address);
    const navButtons2 = render('NavigationControlsLoad', NavigationControls.viewLoadButtons, shell, progress, address);

    return html.div({
      style: Style(styleLocationBarContainer.default, {
        backgroundColor: theme.locationBar,
        color: theme.locationText
      })
    }, [
        navButtons1, icons, editable, prettyURL, navButtons2
    ]);

  };

  exports.view = view;
});
