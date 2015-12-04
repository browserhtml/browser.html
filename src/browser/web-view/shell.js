/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/web-view/shell" */

import {Effects, Task} from "reflex";
import {merge} from "../../common/prelude";
import * as Focusable from "../../common/focusable";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export const initial = ({
  isFocused: false,
  isVisible: false,
  zoom: 1
})

export const focus = Focusable.focus;
export const blur = Focusable.blur;
export const Focus = Focusable.Focus;
export const Blur = Focusable.Blur;

export const asRequestBy = (id, action) =>
  ({type: "WebView.Shell.RequestBy", id, action});

export const asRequest = action =>
  ({type: "WebView.Shell.Request", action})

export const ZoomIn
  = {type: "WebView.Shell.ZoomIn"};

export const ZoomOut
  = {type: "WebView.Shell.ZoomOut"};

export const ResetZoom
  = {type: "WebView.Shell.ZoomReset"};

export const asChangeVisibility = (isVisible) =>
  ({type: "WebView.Shell.ChangeVisibility", isVisible});

export const asZoomChanged = zoom =>
  ({type: "WebView.Shell.ZoomChanged", zoom});

export const requestZoomChange = (id, level) =>
  Effects.task(Task.io(deliver => {
    const target = document.getElementById(`web-view-${id}`);
    if (target && target.zoom) {
      target.zoom(level);
      deliver(Task.succeed(asZoomChanged(level)));
    }
  }));

export const requestVisibilityChange = (id, isVisible) =>
  Effects.task(Task.io(deliver => {
    const target = document.getElementById(`web-view-${id}`);
    if (target && target.setVisible) {
      target.setVisible(isVisible);
    }
  }));


export const request = (model, {id, action}) =>
  action.type === 'WebView.Shell.ZoomIn' ?
    requestZoomChange(id, Math.min(ZOOM_MAX, model.zoom + ZOOM_STEP)) :
  action.type === 'WebView.Shell.ZoomOut' ?
    requestZoomChange(id, Math.max(ZOOM_MIN, model.zoom - ZOOM_STEP)) :
  action.type === 'WebView.Shell.ZoomReset' ?
    requestZoomChange(id, 1) :
  action.type === 'WebView.Shell.ChangeVisibility' ?
    requestVisibilityChange(id, action.isVisible) :
    Effects.none;

export const step/*:type.step*/ = (model, action) =>
  action.type === 'WebView.Shell.VisibilityChanged' ?
    [merge(model, {isVisible: action.isVisible}), Effects.none] :
  action.type === 'WebView.Shell.ZoomChanged' ?
    [merge(model, {zoom: action.zoom}), Effects.none] :
  action.type === 'WebView.Shell.RequestBy' ?
    [model, request(model, action)] :
  action.type === 'Focusable.Focus' ?
    [Focusable.update(model, action), Effects.none] :
  action.type === 'Focusable.FocusRequest' ?
    [Focusable.update(model, action), Effects.none] :
  action.type === 'Focusable.Blur' ?
    [Focusable.update(model, action), Effects.none] :
    [model, Effects.none];
