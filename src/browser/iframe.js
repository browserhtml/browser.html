/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {isFocused} = require('./focusable');
  const {Element, BeforeAppendAttribute, Field, Event} = require('./element');

  const IFrame = Element('iframe', {
    isFocused: isFocused,
    isRemote: new BeforeAppendAttribute('remote'),
    isBrowser: new BeforeAppendAttribute('mozbrowser'),
    allowFullScreen: new BeforeAppendAttribute('mozallowfullscreen'),
    src: Field((node, current, past) => {
      if (current != past) {
        if (node.setVisible) {
          node.src = current;
        } else {
          node.src = `data:text/html,${current}`
        }
      }
    }),
    isVisible: Field((node, current, past) => {
      if (current != past) {
        if (node.setVisible) {
          node.setVisible(current);
        }
      }
    }),
    zoom: Field((node, current, past) => {
      if (current != past) {
        if (node.zoom) {
          node.zoom(current);
        }
      }
    }),
    readyState: Field((node, current, past) => {
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

      // Note that goBack / goForward won't trigger load events so we need
      // to re request canGoBack / canGoForward over on each state change.
      if (node.getCanGoBack) {
        node.getCanGoBack().onsuccess = IFrame.onCanGoBackChange(node)
      }
      if (node.getCanGoForward) {
        node.getCanGoForward().onsuccess = IFrame.onCanGoForwardChange(node)
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
    onCanGoBackChange: Event('mozbrowsercangobackchange'),
    onCanGoForwardChange: Event('mozbrowsercangoforwardchange'),
    onScrollAreaChange: Event('mozbrowserscrollareachanged'),
    onLoadProgressChange: Event('mozbrowserloadprogresschanged')
  });

  IFrame.onCanGoBackChange = node => request => {
    node.dispatchEvent(new CustomEvent('mozbrowsercangobackchange', {
      detail: request.target.result
    }));
  }

  IFrame.onCanGoForwardChange = node => request => {
    node.dispatchEvent(new CustomEvent('mozbrowsercangoforwardchange', {
      detail: request.target.result
    }));
  }

  // Exports:

  exports.IFrame = IFrame;

});
