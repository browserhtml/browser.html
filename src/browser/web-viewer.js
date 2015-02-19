/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

'use strict';

const {DOM} = require('react');
const {Map} = require('immutable');
const {isFocused} = require('./focusable');
const {Element, Option, Field, Event} = require('./element');
const Component = require('omniscient');
const {Deck} = require('./deck');
const {open} = require('./web-viewer/actions');
const {remove, append} = require('./deck/actions');
const {getHardcodedColors} = require('./theme');

const IFrame = Element('iframe', {
  isFocused: isFocused,
  isRemote: new Option('remote'),
  isBrowser: new Option('mozbrowser'),
  allowFullScreen: new Option('mozallowfullscreen'),
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
  onScrollAreaChange: Event('mozbrowserscrollareachanged')
});

IFrame.onCanGoBackChange = node => request => {
  node.dispatchEvent(new CustomEvent('mozbrowsercangobackchange',{
    'detail': request.target.result
  }));
}

IFrame.onCanGoForwardChange = node => request => {
  node.dispatchEvent(new CustomEvent('mozbrowsercangoforwardchange',{
    'detail': request.target.result
  }));
}


const WebViewer = Component(({item, items}) => {
  // Do not render anything unless viewer has any `uri`
  if (!item.get('uri')) return null;
  return IFrame({
  className: 'frame flex-1 webviewer' +
              (item.get('contentOverflows') ? ' contentoverflows' : ''),
  key: `frame-${item.get('id')}`,
  isBrowser: true,
  isRemote: true,
  allowFullScreen: true,

  isVisible: item.get('isSelected'),
  hidden: !item.get('isSelected'),
  zoom: item.get('zoom'),
  isFocused: item.get('isFocused'),
  src: item.get('uri'),
  readyState: item.get('readyState'),

  onCanGoBackChange: WebViewer.onCanGoBackChange(item),
  onCanGoForwardChange: WebViewer.onCanGoForwardChange(item),
  onBlur: WebViewer.onBlur(item),
  onFocus: WebViewer.onFocus(item),
  // onAsyncScroll: WebViewer.onUnhandled,
  onClose: event => remove(items, x => x.equals(item)),
  onOpenWindow: event => {
    items.update(items => {
      const item = open({uri: event.detail.url});
      return append(items, item);
    });
  },
  onContextMenu: WebViewer.onUnhandled,
  onError: event => console.error(event),
  onLoadStart: WebViewer.onLoadStart(item),
  onLoadEnd: WebViewer.onLoadEnd(item),
  onMetaChange: WebViewer.onMetaChange(item),
  onIconChange: WebViewer.onIconChange(item),
  onLocationChange: WebViewer.onLocationChange(item),
  onSecurityChange: WebViewer.onSecurityChange(item),
  onTitleChange: WebViewer.onTitleChange(item),
  onPrompt: WebViewer.onPrompt(item),
  onAuthentificate: WebViewer.onAuthentificate(item),
  onScrollAreaChange: WebViewer.onScrollAreaChange(item)
  })});

WebViewer.onUnhandled = event => console.log(event)
WebViewer.onBlur = state => event => state.set('isFocused', false);

WebViewer.onFocus = state => event => state.set('isFocused', true);

WebViewer.onLoadStart = state => event => state.merge({
  readyState: 'loading',
  isLoading: true,
  icons: null,
  title: null,
  location: null,
  securityState: 'insecure',
  securityExtendedValidation: false,
  canGoBack: false,
  canGoForward: false
});

WebViewer.onLoadEnd = state => event => state.merge({
  readyState: 'loaded',
  isLoading: false
});

WebViewer.onTitleChange = state => event => state.set('title', event.detail);

WebViewer.onLocationChange = state => event => state.merge(
  Object.assign({location: event.detail}, getHardcodedColors(event.detail)));

WebViewer.onIconChange = state => event =>
  state.set(['icons', event.detail.href], event.detail);

WebViewer.onMetaChange = state => event =>
  state.set('metadata', event.detail);

WebViewer.onCanGoBackChange = state => event =>
  state.set('canGoBack', event.detail);

WebViewer.onCanGoForwardChange = state => event =>
  state.set('canGoForward', event.detail);

WebViewer.onPrompt = state => event => console.log(event);

WebViewer.onAuthentificate = state => event => console.log(event);
WebViewer.onScrollAreaChange = state => event =>
  state.set('contentOverflows',
            event.detail.height > event.target.parentNode.clientHeight);

WebViewer.onSecurityChange = state => event =>
  state.merge({securityState: event.detail.state,
               securityExtendedValidation: event.detail.extendedValidation});

WebViewer.Deck = Deck(WebViewer);

// Exports:

exports.WebViewer = WebViewer;

});
