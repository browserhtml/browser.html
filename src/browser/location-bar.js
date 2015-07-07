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
  const WebView = require('./web-view');
  const Navigation = require('./web-navigation');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const Progress = require('./progress-bar');
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
      padding: '3px',
      width: '100vw',
      textAlign: 'center',
      pointerEvents: 'none'
    },
    bar: {
      display: 'inline-block',
      MozWindowDragging: 'no-drag',
      borderRadius: 5,
      lineHeight: '22px',
      height: 22,
      padding: '0 3px',
      margin: '0',
      overflow: 'hidden',
      pointerEvents: 'all',
      width: null
    },
    inactive: {
      width: 250, // FIXME :Doesn't shrink when window is narrow
    },
    active: {
      width: 400
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
      padding: null,
      maxWidth: null,

      color: '#333',
      width: '100%',
      lineHeight: '22px',
      overflow: 'hidden',
      borderRadius: 0
    },

    summary: {
      maxWidth: null,
      padding: null,
      color: null,
      backgroundColor: null,

      lineHeight: '22px',
      overflow: 'hidden',
      width: '100%',
      display: 'inline-block',
      textOverflow: 'ellipsis',
      textAlign: 'center'
    },

    locationText: {
      backgroundColor: null,
      color: 'inherit',
      fontWeight: 'bold'
    },

    titleText: {
      color: 'interit',
      backgroundColor: null,
      padding: 5
    },

    visible: {
      visibility: 'visible'
    },
    invisible: {
      visibility: 'hidden'
    },
    icon: {
      fontSize: '16px',
      fontFamily: 'FontAwesome'
    },

    collapsed: {maxWidth: 0, padding: 0},
    disabled: {opacity: 0.2, pointerEvents: 'none'},
    hidden: {display: 'none'},

    security: {
      fontFamily: 'FontAwesome',
      fontWeight: 'normal',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  });


  // Events

  const {Focus, Blur, Submit} = Input.Action;
  const {Load} = WebView.Action;
  const {Enter} = Input.Action;
  const {GoBack, GoForward, Stop, Reload} = Navigation.Action;

  // Action

  const Edit = Record({
    id: '@selected'
  }, 'LocationBar.Action.Edit');

  const Action = Union({Edit});

  exports.Action = Action;


  // view


  const {SelectNext, SelectPrevious} = Suggestions.Action;

  const Binding = KeyBindings({
    'up': ({id}) => SelectPrevious({id}),
    'control p': ({id}) => SelectPrevious({id}),
    'down': ({id}) => SelectNext({id}),
    'control n': ({id}) => SelectNext({id}),
    'enter': ({id}) => Submit({id}),
    'escape': ({id}) => Shell.Action.Focus({id}),
  }, 'LocationBar.Keyboard.Action');


  const BackIcon = '\uf053';
  const GearIcon = '\uf013';
  const LockIcon = '\uf023';
  const ReloadIcon = '\uf01e';
  const StopIcon = '\uf00d';
  const SEARCH_ICON = '\uf002';

  const isLoading = Progress.isLoading;

  const Change = ({id}, {target}) =>
    Input.Action.Change({
      id,
      value: target.value,
      selection: Editable.Selection({
        start: target.selectionStart,
        end: target.selectionEnd,
        direction: target.selectionDirection
      })
    });

  const view = (loader, security, page, input, suggestions, theme, address) => {

    const context = loader ? loader : {id: '@selected'};
    const value = (loader && input.value === null) ? (loader.uri || '') :
                  (input.value || '');

    return html.div({
      style: style.container,
    }, [
      html.div({
        key: 'LocationBar',
        className: ClassSet({
          'location-bar': true,
          active: input.isFocused
        }),
        style: Style(style.bar,
                     input.isFocused ? style.active : style.inactive),
        onClick: address.pass(Input.Action.Enter, context)
      }, [
        html.span({
          key: 'icon',
          style: Style(style.icon,
                       input.isFocused ? style.visible : style.invisible)
        }, SEARCH_ICON),
        Editable.view({
          key: 'input',
          className: 'location-bar-input',
          placeholder: 'Search or enter address',
          type: 'text',
          value: suggestions.selected < 0 ? value :
                 suggestions.entries.get(suggestions.selected).uri,
          style: Style(style.input,
                       !input.isFocused && style.collapsed),
          isFocused: input.isFocused || !loader,
          selection: input.selection,
          onChange: address.pass(Change, context),

          onFocus: address.pass(Input.Action.Focused, context),
          onBlur: address.pass(Input.Action.Blured, context),
          onKeyDown: address.pass(Binding, context)
        }),
        html.p({
          key: 'page-info',
          style: Style(style.summary,
                       input.isFocused ? style.collapsed :
                       {color: theme.locationText})
        }, [
          html.span({
            key: 'securityicon',
            style: style.security
          },
             !loader ? '' :
             URI.isPrivileged(loader.uri) ? GearIcon :
             security.secure ? LockIcon :
             ''),
          html.span({
            key: 'title',
            style: Style(style.titleText, {
              color: theme.titleText
            })
          }, !loader ? '' :
             page.title ? page.title :
             loader.uri ? URI.getDomainName(loader.uri) :
             'New Tab'),
        ])
      ])
    ]);
  };

  exports.view = view;
});
