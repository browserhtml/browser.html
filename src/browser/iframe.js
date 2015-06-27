/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Focusable = require('common/focusable');
  const {Element, BeforeAppendAttribute, VirtualAttribute, Event, VirtualEvent} = require('common/element');

  const view = Element('iframe', {
    isFocused: Focusable.Field.isFocused,
    isRemote: new BeforeAppendAttribute('remote'),
    isBrowser: new BeforeAppendAttribute('mozbrowser'),
    mozApp: new BeforeAppendAttribute('mozapp'),
    allowFullScreen: new BeforeAppendAttribute('mozallowfullscreen'),
    uri: VirtualAttribute((node, current, past) => {
      if (current != past) {
        const uri = node.setVisible ? current : `data:text/html,${current}`
        if (node.location !== uri) {
          node.location = uri;
          node.src = uri;
        }
      }
    }),
    isVisible: VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.setVisible) {
          node.setVisible(current);
        }
      }
    }),
    zoom: VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.zoom) {
          node.zoom(current);
        }
      }
    }),
    readyState: VirtualAttribute((node, current, past) => {
      if (current == 'reload') {
        if (node.reload) {
          node.reload();
        }
      }

      if (current == 'stop') {
        if (node.stop) {
          node.stop();
        }
      }

      if (current == 'goBack') {
        if (node.goBack) {
          node.goBack();
        }
      }

      if (current == 'goForward') {
        if (node.goForward) {
          node.goForward();
        }
      }
    }),
    onAsyncScroll: Event('mozbrowserasyncscroll'),
    onClose: Event('mozbrowserclose'),
    onOpenWindow: Event('mozbrowseropenwindow'),
    onOpenTab: Event('mozbrowseropentab'),
    onContextMenu: Event('mozbrowsercontextmenu'),
    onError: Event('mozbrowsererror'),
    onLoadStart: Event('mozbrowserloadstart'),
    onLoadEnd: Event('mozbrowserloadend'),
    onIconChange: Event('mozbrowsericonchange'),
    onUserActivityDone: Event('mozbrowseractivitydone'),
    onVisibilityChange: Event('mozbrowservisibilitychange'),
    onMetaChange: Event('mozbrowsermetachange'),
    // Use `VirtualEvent` to proxy events in order to mutate `target.location`
    // so that user can check `target.location` before deciding if change to
    // `target.src` is required.
    onLocationChange: VirtualEvent((target, dispatch) => {
      target.addEventListener('mozbrowserlocationchange', event => {
        target.location = event.detail;
        // Set an attribute as well so that in the inspector we can tell what
        // is the location of a page even if user navigated away.
        target.setAttribute('location', event.detail);
        dispatch(event);
      });
    }),
    onSecurityChange: Event('mozbrowsersecuritychange'),
    onTitleChange: Event('mozbrowsertitlechange'),
    onPrompt: Event('mozbrowsershowmodalprompt'),
    onAuthentificate: Event('mozbrowserusernameandpasswordrequired'),
    onScrollAreaChange: Event('mozbrowserscrollareachanged'),
    onLoadProgressChange: Event('mozbrowserloadprogresschanged'),

    // It is unfortunate that state of `canGoBack` and `canGoForward` is
    // not observadle, with virtual events we polifill more desired API
    // and pretend there are events dispatched when state changes.
    onCanGoBackChange: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergobackchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoBack().onsuccess = onsuccess;
      });
    }),
    onCanGoForwardChange: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergoforwardchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoForward().onsuccess = onsuccess;
      });
    })
  });

  // Exports:

  exports.view = view;
});
