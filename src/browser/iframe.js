/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {isFocused} = require('./focusable');
  const {Element, BeforeAppendAttribute,
         VirtualAttribute, Event, VirtualEvent} = require('./element');

  const IFrame = Element('iframe', {
    isFocused: isFocused,
    isRemote: new BeforeAppendAttribute('remote'),
    isBrowser: new BeforeAppendAttribute('mozbrowser'),
    mozApp: new BeforeAppendAttribute('mozapp'),
    allowFullScreen: new BeforeAppendAttribute('mozallowfullscreen'),
    src: VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.setVisible) {
          node.src = current;
        } else {
          node.src = `data:text/html,${current}`
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
    onContextMenu: Event('mozbrowsercontextmenu'),
    onError: Event('mozbrowsererror'),
    onLoadStart: Event('mozbrowserloadstart'),
    onLoadEnd: Event('mozbrowserloadend'),
    onIconChange: Event('mozbrowsericonchange'),
    onUserActivityDone: Event('mozbrowseractivitydone'),
    onVisibilityChange: Event('mozbrowservisibilitychange'),
    onMetaChange: Event('mozbrowsermetachange'),
    onLocationChange: Event('mozbrowserlocationchange'),
    onSecurityChange: Event('mozbrowsersecuritychange'),
    onTitleChange: Event('mozbrowsertitlechange'),
    onPrompt: Event('mozbrowsershowmodalprompt'),
    onAuthentificate: Event('mozbrowserusernameandpasswordrequired'),
    onScrollAreaChange: Event('mozbrowserscrollareachanged'),
    onLoadProgressChange: Event('mozbrowserloadprogresschanged'),
    onCanGoBackChange: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target, detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoBack().onsuccess = onsuccess;
      });
    }),
    onCanGoForwardChange: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target, detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoForward().onsuccess = onsuccess;
      });
    })
  });

  // Exports:

  exports.IFrame = IFrame;

});
