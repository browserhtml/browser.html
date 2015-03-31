/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const platform = require('os').platform();
  const {DOM} = require('react')
  const Component = require('omniscient');
  const {InputField, select} = require('./editable');
  const {Element} = require('./element');
  const {activate, blur, focus, sendEventToChrome} = require('./actions');
  const {goBack, reload, stop} = require('./web-viewer/actions');
  const {KeyBindings} = require('./keyboard');
  const url = require('./util/url');
  const {ProgressBar} = require('./progressbar');
  const ClassSet = require('./util/class-set');
  const {throttle, compose, arity, curry} = require('lang/functional');
  let {computeSuggestions, resetSuggestions} = require('./awesomebar');

  computeSuggestions = throttle(computeSuggestions, 200);

  const WindowControls = Component('WindowControls', ({theme}) =>
    DOM.div({className: 'windowctrls'}, [
      DOM.div({className: 'windowctrl win-close-button',
               style: theme.windowCloseButton,
               title: 'close',
               key: 'close',
               onClick: event => sendEventToChrome('shutdown-application')
      }),
      DOM.div({className: 'windowctrl win-min-button',
               style: theme.windowMinButton,
               title: 'minimize',
               key: 'minimize',
               onClick: event => sendEventToChrome('minimize-native-window')
      }),
      DOM.div({className: 'windowctrl win-max-button',
               style: theme.windowMaxButton,
               title: 'maximize',
               key: 'maximize',
               onClick: event => sendEventToChrome('toggle-fullscreen-native-window')
      })
    ]));

  // Clears selection in the suggestions
  const unselect = suggestions =>
    suggestions.set('selectedIndex', -1);

  // Selects suggestion `n` items away relative to currently seleceted suggestion.
  // Selection over suggestion entries is moved in a loop although there is extra
  // "no selection" entry between last and first suggestions. Given `n` can be negative
  // or positive in order to select suggestion before or after the current one.
  const selectRelative = curry((n, suggestions) =>
    suggestions.update('selectedIndex', from => {
      const first = 0;
      const last = suggestions.get('list').count() - 1;
      const to = from + n;

      return to > last ? -1 :
             to < first ? -1 :
             to;
    }));

  // Selects next / previous suggestion.
  const selectPrevious = selectRelative(-1);
  const selectNext = selectRelative(1);

  // Returns currently selected suggestion or void if there's none.
  const selected = suggestions => {
    const index = suggestions.get('selectedIndex');
    return index >= 0 ? suggestions.getIn(['list', index, 'text']) : void(0);
  }

  // Bindings for navigation suggestions.
  const onSuggetionNavigation = KeyBindings({
    'up': edit => edit(selectPrevious),
    'control p': edit => edit(selectPrevious),
    'down': edit => edit(selectNext),
    'control n': edit => edit(selectNext),
    'enter': edit => edit(unselect)
  });

  // General input keybindings.
  const onInputNavigation = KeyBindings({
    'escape': (editInput, editSelectedViewer) => {
      editSelectedViewer(focus);
      // TODO: This should not be necessary but since in case of dashboard focus
      // is passed to a hidden iframe DOM ignores that and we end up with focus
      // still in an `input`. As a workaround for now we manually `blur` input.
      editInput(blur);
    },
    'accel l': (editInput, _) => editInput(select())
  });

  const NavigationControls = Component('NavigationControls', ({input, tabStrip,
                                         webViewer, suggestions, theme},
                                       {onNavigate, editTabStrip, onGoBack,
                                        editSelectedViewer, editInput, editSuggestions}) => {
    return DOM.div({
      className: 'locationbar',
      style: theme.locationBar,
      onMouseEnter: event => editTabStrip(activate)
    }, [
      DOM.div({className: 'backbutton',
               style: theme.backButton,
               key: 'back',
               onClick: event => editSelectedViewer(goBack)}),
      InputField({
        key: 'input',
        className: 'urlinput',
        style: theme.urlInput,
        placeholder: 'Search or enter address',
        value: selected(suggestions) ||
               webViewer.get('userInput'),
        type: 'text',
        submitKey: 'Enter',
        isFocused: input.get('isFocused'),
        selection: input.get('selection'),
        onFocus: event => {
          computeSuggestions(event.target.value, editSuggestions);
          editInput(focus);
        },
        onBlur: event => {
          editSuggestions(resetSuggestions);
          editInput(blur);
        },
        onSelect: event => editInput(select(event.target.selectionStart,
                                            event.target.selectionEnd,
                                            event.target.selectionDirection)),
        onChange: event => {
          // Reset suggestions & compute new ones from the changed input value.
          editSuggestions(unselect);
          computeSuggestions(event.target.value, editSuggestions);
          // Also reflect changed value onto webViewers useInput.
          editSelectedViewer(viewer => viewer.set('userInput', event.target.value));
        },
        onSubmit: event => {
          editSuggestions(resetSuggestions);
          onNavigate(event.target.value);
        },
        onKeyDown: compose(onInputNavigation(editInput, editSelectedViewer),
                           onSuggetionNavigation(editSuggestions))
      }),
      DOM.p({key: 'page-info',
             className: 'pagesummary',
             style: theme.pageInfoText,
             onClick: event => editInput(compose(select(), focus))}, [
        DOM.span({key: 'location',
                  style: theme.locationText,
                  className: 'pageurlsummary'},
                 webViewer.get('location') ? url.getDomainName(webViewer.get('location')) : ''),
        DOM.span({key: 'title',
                  className: 'pagetitle',
                  style: theme.titleText},
                 webViewer.get('title') ? webViewer.get('title') :
                 webViewer.get('isLoading') ? 'Loading...' :
                 webViewer.get('location') ? webViewer.get('location') :
                 'New Tab')
      ]),
      DOM.div({key: 'reload-button',
               className: 'reloadbutton',
               style: theme.reloadButton,
               onClick: event => editSelectedViewer(reload)}),
      DOM.div({key: 'stop-button',
               className: 'stopbutton',
               style: theme.stopButton,
               onClick: event => editSelectedViewer(stop)}),
    ])});

  const NavigationPanel = Component('NavigationPanel', ({key, input, tabStrip,
                                     webViewer, suggestions, title, rfa, theme},
                                     handlers) => {
    return DOM.div({
      key,
      style: theme.navigationPanel,
      className: ClassSet({
        navbar: true,
        urledit: input.get('isFocused'),
        cangoback: webViewer.get('canGoBack'),
        canreload: webViewer.get('location'),
        loading: webViewer.get('isLoading'),
        ssl: webViewer.get('securityState') == 'secure',
        sslv: webViewer.get('securityExtendedValidation'),
        privileged: url.isPrivileged(webViewer.get('location'))
      })
    }, [
      WindowControls({key: 'controls', theme}),
      NavigationControls({key: 'navigation', input, tabStrip,
                          webViewer, suggestions, title, theme},
                          handlers),
      ProgressBar({key: 'progressbar', rfa, webViewer, theme},
                  {editRfa: handlers.editRfa}),
      DOM.div({key: 'spacer', className: 'freeendspacer'})
    ])
  });

  // Exports:

  exports.WindowControls = WindowControls;
  exports.NavigationControls = NavigationControls;
  exports.NavigationPanel = NavigationPanel;

});
