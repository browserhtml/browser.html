/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Component = require('omniscient');
  const {isActive, isSelected} = require('./deck/actions');
  const {getHardcodedColors} = require('./theme');
  const {IFrame} = require('./iframe');
  const {DOM} = require('react');
  const ClassSet = require('./util/class-set');
  const url = require('./util/url');
  const makeTileURI = input =>
    `tiles/${url.getDomainName(input)}.png`;
  const {fromDOMRequest, fromEvent} = require('lang/promise');
  const {compose} = require('lang/functional');




  const WebViewer = Component('WebViewer', ({state}, {onOpen, onClose, edit}) => {

    // Do not render anything unless viewer has any `uri`
    if (!state.get('uri')) return null;

    return IFrame({
      className: ClassSet({
        'iframes-frame': true,
        webviewer: true,
        contentoverflows: state.get('contentOverflows'),
        // We need to style hidden iframes that don't have tiles differntly
        // to workaround #266 & be able to capture screenshots.
        rendered: state.get('thumbnail')
      }),
      isBrowser: true,
      isRemote: true,
      mozApp: url.isPrivileged(state.get('uri')) ? url.getManifestURL() : null,
      allowFullScreen: true,

      isVisible: isActive(state) ||
                 isSelected(state),

      hidden: !isActive(state),

      zoom: state.get('zoom'),
      isFocused: state.get('isFocused'),
      src: state.get('uri'),
      readyState: state.get('readyState'),

      onCanGoBackChange: WebViewer.onCanGoBackChange(edit),
      onCanGoForwardChange: WebViewer.onCanGoForwardChange(edit),
      onBlur: WebViewer.onBlur(edit),
      onFocus: WebViewer.onFocus(edit),
      // onAsyncScroll: WebViewer.onUnhandled,
      onClose: event => onClose(state.get('id')),
      onOpenWindow: event => onOpen(event.detail.url),
      onContextMenu: WebViewer.onUnhandled,
      onError: event => console.error(event),
      onLoadStart: WebViewer.onLoadStart(edit),
      onLoadEnd: WebViewer.onLoadEnd(edit),
      onMetaChange: WebViewer.onMetaChange(edit),
      onIconChange: WebViewer.onIconChange(edit),
      onLocationChange: WebViewer.onLocationChange(edit),
      onSecurityChange: WebViewer.onSecurityChange(edit),
      onTitleChange: WebViewer.onTitleChange(edit),
      onPrompt: WebViewer.onPrompt(edit),
      onAuthentificate: WebViewer.onAuthentificate(edit),
      onScrollAreaChange: WebViewer.onScrollAreaChange(edit),
      onLoadProgressChange: WebViewer.onLoadProgressChange(edit)
    });
  });


  const fetchScreenshot = iframe =>
    fromDOMRequest(iframe.getScreenshot(100 * devicePixelRatio,
                                        62.5 * devicePixelRatio,
                                        'image/png'));

  // This is temporary workraound once we've get a history database
  // we will be queyring it instead (see #153)
  const fetchThumbnail = uri => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', `tiles/${url.getDomainName(uri)}.png`);
    request.responseType = 'blob';
    request.send();
    request.onload = event => {
      if (request.status === 200) {
        resolve(request.response);
      } else {
        reject(request.statusText);
      }
    }
    request.onerror = event => reject();
  });

  const requestThumbnail = iframe => {
    // Create a promise that is rejected when iframe location is changes,
    // in order to abort task if this happens before we have a response.
    const abort = fromEvent(iframe, 'mozbrowserlocationchange').
      then(event => Promise.reject(event));

    // Create a promise that is resolved once iframe ends loading, it will
    // be used to defer a screenshot request.
    const loaded = fromEvent(iframe, 'mozbrowserloadend');

    // Request a thumbnail from DB.
    const thumbnail = fetchThumbnail(iframe.src).
    // If thumbnail isn't in database then we race `loaded` against `abort`
    // and if `loaded` wins we fetch a screenshot that will be our thumbnail.
    catch(_ => Promise.
          race([abort, loaded]).
          then(_ => fetchScreenshot(iframe)));

    // Finally we return promise that rejects if `abort` wins and resolves to a
    // `thumbnail` if we get it before `abort`.
    return Promise.race([abort, thumbnail]);
  }

  WebViewer.onUnhandled = event => console.log(event)
  WebViewer.onBlur = edit => event =>
    edit(state => state.set('isFocused', false));

  WebViewer.onFocus = edit => event =>
    edit(state => state.set('isFocused', true));

  WebViewer.onLoadStart = edit => event => edit(state => state.merge({
    readyState: 'loading',
    isLoading: true,
    isConnecting: true,
    startLoadingTime: performance.now(),
    icons: {},
    thumbnail: null,
    title: null,
    location: null,
    securityState: 'insecure',
    securityExtendedValidation: false,
    canGoBack: false,
    canGoForward: false
  }));

  WebViewer.onLoadEnd = edit => event => edit(state =>
    state.merge({
      // When the progressbar of a viewer is visible,
      // we want to animate the progress to 1 on load. This
      // is handled in the progressbar code. We only set
      // progress to 1 for non selected viewers.
      progress: isSelected(state) ? state.get('progress') : 1,
      isConnecting: false,
      endLoadingTime: performance.now(),
      readyState: 'loaded',
      isLoading: false
    }));

  WebViewer.onTitleChange = edit => event =>
    edit(state => state.set('title', event.detail));


  WebViewer.onLocationChange = edit => event => {
    edit(state => state.
                    merge({location: event.detail,
                           userInput: event.detail}).
                    merge(getHardcodedColors(event.detail)));

    requestThumbnail(event.target).
      then(WebViewer.onThumbnailChanged(edit));
  }

  WebViewer.onIconChange = edit => event =>
    edit(state => state.setIn(['icons', event.detail.href], event.detail));

  WebViewer.onMetaChange = edit => event =>
    edit(state => state.set('metadata', event.detail));

  WebViewer.onCanGoBackChange = edit => event =>
    edit(state => state.set('canGoBack', event.detail));

  WebViewer.onCanGoForwardChange = edit => event =>
    edit(state => state.set('canGoForward', event.detail));

  WebViewer.onPrompt = edit => event => console.log(event);

  WebViewer.onAuthentificate = edit => event => console.log(event);

  WebViewer.onScrollAreaChange = edit => ({target, detail}) =>
    edit(state => state.set('contentOverflows',
                            detail.height > target.parentNode.clientHeight));

  WebViewer.onSecurityChange = edit => event =>
    edit(state => state.merge({
      securityState: event.detail.state,
      securityExtendedValidation: event.detail.extendedValidation}));

  WebViewer.onLoadProgressChange = edit => event =>
    edit(state => !state.get('isConnecting') ? state :
                  state.merge({isConnecting: false,
                               connectedAt: performance.now()}));

  WebViewer.onThumbnailChanged = edit => blob =>
    edit(state => state.set('thumbnail', URL.createObjectURL(blob)));

  const id = item => item.get('id');
  // WebViewer deck will always inject frames by order of their id. That way
  // no iframes will need to be removed / injected when order of tabs change.
  WebViewer.Deck = Component('WebViewerDeck', (options, {onOpen, onClose, edit}) => {
    const {items, In} = options;
    return DOM.div(options, items.sortBy(id).map(item => WebViewer({
      key: item.get('id'),
      state: item,
    }, {onOpen, onClose, edit: compose(edit, In(items.indexOf(item)))})));
  });

  // Exports:

  exports.WebViewer = WebViewer;

});
