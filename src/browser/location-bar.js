/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, Maybe} = require('common/typed');
  const {html, render} = require('reflex');
  const URI = require('common/url-helper');
  const {mix} = require('common/style');

  const {KeyBindings} = require('common/keyboard');
  const Editable = require('common/editable');
  const WebView = require('./web-view');
  const Navigation = require('./web-navigation');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const Progress = require('./progress-bar');
  const Preview = require('./preview-box');
  const Suggestions = require('./suggestion-box');
  const ClassSet = require('common/class-set');

  const Theme = require('./theme');

  // Model

  const Color = String;
  const LocationBarStyle = Record({
    display: 'inline-block',
    MozWindowDragging: 'no-drag',
    borderRadius: 5,
    lineHeight: '22px',
    width: 250, // FIXME :Doesn't shrink when window is narrow
    height: 22,
    padding: '0 3px',
    margin: '0',
    overflow: 'hidden',
    pointerEvents: 'all'
  }, 'LocationBarStyle');

  const inactiveLocationBar = LocationBarStyle();
  const activeLocationBar = LocationBarStyle({
    width: 400
  });


  const ButtonStyle = Record({
    color: 'inherit',
    opacity: Maybe(Number),
    pointerEvents: Maybe(String),
    display: Maybe(String),
    left: Maybe(Number),
    right: Maybe(Number),

    position: 'absolute',
    top: 0,
    width: 30,
    height: 30,
    fontFamily: 'FontAwesome',
    textAlign: 'center',
    fontSize: '17px',
    verticalAlign: 'middle',
    cursor: 'default'
  }, 'NavigationButtonStyle');

  const URLInputStyle = Record({
    padding: Maybe(Number),
    maxWidth: Maybe(Number),
    color: '#333',
    width: '100%',
    lineHeight: '22px',
    overflow: 'hidden',
    borderRadius: 0
  }, 'URLInputStyle');

  const PageSummaryStyle = Record({
    maxWidth: Maybe(Number),
    padding: Maybe(Number),
    color: Maybe(Color),
    backgroundColor: Maybe(Color),

    lineHeight: '22px',
    overflow: 'hidden',
    width: '100%',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    textAlign: 'center'
  }, 'PageSummaryStyle');

  const LocationTextStyle = Record({
    color: 'inherit',
    backgroundColor: Maybe(Color),
    fontWeight: 'bold'
  }, 'LocationTextStyle');

  const TitleTextStyle = Record({
    color: 'interit',
    backgroundColor: Maybe(Color),
    padding: 5
  }, 'TitleTextStyle');


  const backButton = ButtonStyle({left: 0});
  const reloadButton = ButtonStyle({right: 0});
  const stopButton = ButtonStyle({right: 0});
  const dashboardButton = ButtonStyle({right: 0});


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

  const collapse = {maxWidth: 0, padding: 0};
  const disable = {opacity: 0.2, pointerEvents: 'none'};
  const hide = {display: 'none'};

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

  const isLoading = Progress.isLoading;

  const Select = ({id}, {target}) =>
    Input.Action.Edit({
      id,
      action: Editable.Action.Select({
        range: {
          start: target.selectionStart,
          end: target.selectionEnd,
          direction: target.selectionDirection
        }
      })
    });

  const Change = ({id}, {target: {value}}) =>
    Input.Action.Change({id, value});

  const view = (webView, input, suggestions, theme, address) => {
    const context = webView || {id: '@selected'};
    const value = (webView && input.value === null) ? (webView.uri || '') :
                  (input.value || '');

    return html.div({
      style: {
        position: 'absolute',
        zIndex: 101,
        top: 0,
        padding: '3px',
        width: '100vw',
        textAlign: 'center',
        pointerEvents: 'none'
      }
    }, [
      html.div({
        key: 'LocationBar',
        className: ClassSet({
          'location-bar': true,
          active: input.isFocused
        }),
        style: input.isFocused ? activeLocationBar :
               inactiveLocationBar,
        onClick: address.pass(Input.Action.Enter, context)
      }, [
        Editable.view({
          key: 'input',
          className: 'location-bar-input',
          placeholder: 'Search or enter address',
          type: 'text',
          value: suggestions.selected < 0 ? value :
                 suggestions.entries.get(suggestions.selected).uri,
          style: input.isFocused ? URLInputStyle() :
                 URLInputStyle().merge(collapse),
          isFocused: input.isFocused || !webView,
          selection: input.selection,

          onSelect: address.pass(Select, context),
          onChange: address.pass(Change, context),

          onFocus: address.pass(Input.Action.Focus, context),
          onBlur: address.pass(Input.Action.Blur, context),
          onKeyDown: address.pass(Binding, context)
        }),
        html.p({
          key: 'page-info',
          style: !input.isFocused ? PageSummaryStyle({color: theme.locationText}) :
                 PageSummaryStyle({color: theme.locationText}).merge(collapse),
        }, [
          html.span({
            key: 'securityicon',
            style: {
              fontFamily: 'FontAwesome',
              fontWeight: 'normal',
              marginRight: 6,
              verticalAlign: 'middle'
            }
          },
             !webView ? '' :
             URI.isPrivileged(webView.uri) ? GearIcon :
             webView.security.secure ? LockIcon :
             ''),
          html.span({
            key: 'title',
            style: TitleTextStyle({color: theme.titleText}),
          }, !webView ? '' :
             webView.page.title ? webView.page.title :
             webView.uri ? URI.getDomainName(webView.uri) :
             webView.progress && isLoading(webView.progress) ? 'Loading...' :
             'New Tab'),
        ])
      ])
    ]);
  };

  exports.view = view;
});
