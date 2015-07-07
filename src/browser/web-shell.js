/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const Focusable = require('common/focusable');
  const Loader = require('./web-loader');

  // Model

  const Model = Record({
    isFocused: false,
    isVisible: true,
    zoom: 1
  });
  exports.Model = Model;

  // Actions

  const ZoomIn = Record({id: '@selected'}, 'WebView.Shell.ZoomIn');
  const ZoomOut = Record({id: '@selected'}, 'WebView.Shell.ZoomOut');
  const ResetZoom = Record({id: '@selected'}, 'WebView.Shell.ResetZoom');
  const Focus = Record({id: '@selected'}, 'WebView.Shell.Focus');
  const Blur = Record({id: '@selected'}, 'WebView.Shell.Blur');
  const Focused = Record({id: '@selected'}, 'WebView.Shell.Focused');
  const Blured = Record({id: '@selected'}, 'WebView.Shell.Blured');


  const VisibilityChange = Record({
    id: String,
    value: Boolean
  }, 'WebView.Shell.VisibilityChange');


  const Action = Union({
    ZoomIn, ZoomOut, ResetZoom,
    Focus, Blur, Focused, Blured
  });

  exports.Action = Action;

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2;
  const ZOOM_STEP = 0.1;

  const zoomIn = value => Math.min(ZOOM_MAX, value + ZOOM_STEP);
  exports.zoomIn = zoomIn;

  const zoomOut = value => Math.max(ZOOM_MIN, value - ZOOM_STEP);
  exports.zoomOut = zoomOut;


  // Update

  const {Load} = Loader.Action;

  const update = (state, action) =>
    action instanceof ZoomIn ? state.update('zoom', zoomIn) :
    action instanceof ZoomOut ? state.update('zoom', zoomOut) :
    action instanceof ResetZoom ? state.remove('zoom') :
    action instanceof Focus ? Focusable.focus(state) :
    action instanceof Blur ? Focusable.blur(state) :
    action instanceof Focused ? Focusable.focus(state) :
    action instanceof Blured ? Focusable.blur(state) :
    action instanceof Load ? state.set('isFocused', true) :
    state;

  exports.update = update;

});
