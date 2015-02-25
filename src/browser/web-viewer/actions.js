/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {fromJS} = require('immutable');
  const uuid = require('uuid');

  const initial = fromJS({
    // Zoom level of the web content.
    zoom: 1,
    // State of the web content:
    // 'loading'|'loaded'|'stop'|'reload'|'goBack'|'goForward'
    readyState: null,
    // `true` if web content is currently loading.
    loading: false,
    // `true` if web content has a focus.
    isFocused: false,
    // `true` if this is currently active web viewer, in other words
    // if this is a web viewer currently displayed.
    isActive: false,
    // `true` if this is currently selected web viewer. In most times
    // is in sync with `isActive` although it does gets out of sync
    // during tab switching when user is seleceting tab to switch to.
    isSelected: false,
    // Text typed into the address bar.
    input: null,
    // URI that web viewer was navigated to. Note that this does not
    // represent uri that is currently loaded.
    uri: null,
    // Currently loaded `URI` in a web viewer.
    location: null,
    // Currently loaded content's title.
    title: null,
    // Icons from the loaded web content.
    icons: {},
    // Metadata of the loaded web content.
    meta: {},
    // Web content color info, should probably be moved elsewhere.
    backgroundColor: null,
    foregroundColor: null,
    isDark: false,
    // Web content network security info.
    securityState: 'insecure',
    securityExtendedValidation: false,
    // Flags indicating if web viewer can navigate back / forward.
    canGoBack: false,
    canGoForward: false
  });

  // Creates a fresh web viewer structure with unique id.
  const open = (options={}) => initial.merge({id: uuid()})
                                      .merge(options);

  // Creates a web viewer state that will trigger a content reload.
  const reload = viewer => viewer.set('readyState', 'reload');

  // Creates a web viewer state that will stop a content load.
  const stop = viewer => viewer.set('readyState', 'stop');

  // Creates a web viewer state that will trigger a navigation back.
  const goBack = viewer => viewer.set('readyState', 'goBack');

  // Creates a web viewer state that will trigger a navigation forward.
  const goForward = viewer => viewer.set('readyState', 'goForward');

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2;
  const ZOOM_STEP = 0.1;

  // Creates a web viewer state that will zoom in content step further.
  const zoomIn = viewer =>
    viewer.update('zoom', zoom => Math.min(ZOOM_MAX, zoom + ZOOM_STEP));

  // Creates a web viewer state that will zoom out content step further.
  const zoomOut = viewer =>
    viewer.update('zoom', zoom => Math.max(ZOOM_MIN, zoom - ZOOM_STEP));

  // Creates a web viewer state that will reset content zoom level.
  const zoomReset = viewer =>
    viewer.set('zoom', initial.get('zoom'));

  const title = viewer =>
    viewer.get('title') || viewer.get('location') || viewer.get('uri');

  // Exports:

  exports.open = open;
  exports.reload = reload;
  exports.stop = stop;
  exports.goBack = goBack;
  exports.goForward = goForward;
  exports.zoomIn = zoomIn;
  exports.zoomOut = zoomOut;
  exports.zoomReset = zoomReset;
  exports.title = title;

});
