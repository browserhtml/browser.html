/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('../common/typed');
  const Focusable = require('../common/focusable');
  const Loader = require('./web-loader');

  // Model

  const Model = Record({
    isFocused: false,
    isVisible: true,
    zoom: 1
  });
  exports.Model = Model;

  // Actions

  const ZoomIn = Record({
    description: 'Request ZoomIn for web-view content'
  }, 'WebView.Shell.ZoomIn');
  exports.ZoomIn = ZoomIn;

  const ZoomOut = Record({
    description: 'Request ZoomOut for web-view content'
  }, 'WebView.Shell.ZoomOut');
  exports.ZoomOut = ZoomOut;

  const ResetZoom = Record({
    description: 'Request zoom of web-view content to be reset'
  }, 'WebView.Shell.ResetZoom');
  exports.ResetZoom = ResetZoom;


  const VisibilityChanged = Record({
    description: 'Visibility of the web-view content has changed',
    value: Boolean
  }, 'WebView.Shell.VisibilityChanged');
  exports.VisibilityChanged = VisibilityChanged;


  // Update

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2;
  const ZOOM_STEP = 0.1;

  const resetZoom = state =>
    state.remove('zoom');
  exports.resetZoom = resetZoom;

  const zoomIn = state =>
    state.set('zoom', Math.min(ZOOM_MAX, state.zoom + ZOOM_STEP));
  exports.zoomIn = zoomIn;

  const zoomOut = state =>
    state.set('zoom', Math.max(ZOOM_MIN, state.zoom - ZOOM_STEP));
  exports.zoomOut = zoomOut;

  // Update

  const update = (state, action) =>
    action instanceof VisibilityChanged ? state.set('isVisible', state.value) :
    action instanceof ZoomIn ? zoomIn(state) :
    action instanceof ZoomOut ? zoomOut(state) :
    action instanceof ResetZoom ? resetZoom(state) :
    action instanceof Focusable.Focus ? Focusable.focus(state) :
    action instanceof Focusable.Blur ? Focusable.blur(state) :
    action instanceof Focusable.Focused ? Focusable.focus(state) :
    action instanceof Focusable.Blured ? Focusable.blur(state) :
    action instanceof Loader.Load ? Focusable.focus(state) :
    state;
  exports.update = update;
