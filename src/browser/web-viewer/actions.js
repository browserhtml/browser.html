/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

'use strict';

const {fromJS} = require('immutable');
const uuid = require('uuid');

const initial = fromJS({
  zoom: 1,
  readyState: null,
  loading: false,
  isFocused: false,
  isSelected: false,
  input: null,
  uri: null,
  location: null,
  title: null,
  icons: {},
  meta: {},
  backgroundColor: null,
  foregroundColor: null,
  isDark: false,
  securityState: 'insecure',
  securityExtendedValidation: false,
  canGoBack: false,
  canGoForward: false
});

const open = (options={}) => initial.merge({id: uuid()})
                                    .merge(options);
const reload = viewer => viewer.set('readyState', 'reload');

const stop = viewer => viewer.set('readyState', 'stop');

const goBack = viewer => viewer.set('readyState', 'goBack');

const goForward = viewer => viewer.set('readyState', 'goForward');

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

const zoomIn = viewer =>
  viewer.update('zoom', zoom => Math.min(ZOOM_MAX, zoom + ZOOM_STEP));

const zoomOut = viewer =>
  viewer.update('zoom', zoom => Math.max(ZOOM_MIN, zoom - ZOOM_STEP));

const zoomReset = viewer =>
  viewer.set('zoom', 1);

// Exports:

exports.open = open;
exports.reload = reload;
exports.stop = stop;
exports.goBack = goBack;
exports.goForward = goForward;
exports.zoomIn = zoomIn;
exports.zoomOut = zoomOut;
exports.zoomReset = zoomReset;

});
