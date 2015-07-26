/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Focusable = require('common/focusable');
  const {Element, BeforeAppendAttribute, VirtualAttribute, Event, VirtualEvent} = require('common/element');

  const view = Element('iframe', {
    isFocused: Focusable.Field.isFocused,
    remote: new BeforeAppendAttribute('remote'),
    mozbrowser: new BeforeAppendAttribute('mozbrowser'),
    mozapp: new BeforeAppendAttribute('mozapp'),
    mozallowfullscreen: new BeforeAppendAttribute('mozallowfullscreen'),
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
    onAsyncScroll: Event('mozbrowserasyncscroll'),
    onClose: Event('mozbrowserclose'),
    onOpenWindow: Event('mozbrowseropenwindow'),
    onOpenTab: Event('mozbrowseropentab'),
    onMenu: Event('mozbrowsercontextmenu'),
    onError: Event('mozbrowsererror'),
    onLoadStarted: Event('mozbrowserloadstart'),
    onLoadEnded: Event('mozbrowserloadend'),
    onIconChanged: Event('mozbrowsericonchange'),
    onUserActivityDone: Event('mozbrowseractivitydone'),
    onVisibilityChanged: Event('mozbrowservisibilitychange'),
    onMetaChanged: Event('mozbrowsermetachange'),
    // Use `VirtualEvent` to proxy events in order to mutate `target.location`
    // so that user can check `target.location` before deciding if change to
    // `target.src` is required.
    onLocationChanged: VirtualEvent((target, dispatch) => {
      target.addEventListener('mozbrowserlocationchange', event => {
        target.location = event.detail;
        // Set an attribute as well so that in the inspector we can tell what
        // is the location of a page even if user navigated away.
        target.setAttribute('location', event.detail);
        dispatch(event);
      });
    }),
    onSecurityChanged: Event('mozbrowsersecuritychange'),
    onTitleChanged: Event('mozbrowsertitlechange'),
    onPrompt: Event('mozbrowsershowmodalprompt'),
    onAuthentificate: Event('mozbrowserusernameandpasswordrequired'),
    onScrollAreaChange: Event('mozbrowserscrollareachanged'),
    onLoadProgressChange: Event('mozbrowserloadprogresschanged'),

    // It is unfortunate that state of `canGoBack` and `canGoForward` is
    // not observadle, with virtual events we polifill more desired API
    // and pretend there are events dispatched when state changes.
    onCanGoBackChanged: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergobackchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoBack().onsuccess = onsuccess;
      });
    }),
    onCanGoForwardChanged: VirtualEvent((target, dispatch) => {
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
