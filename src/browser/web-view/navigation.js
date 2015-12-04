/* @flow */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {merge} from '../../common/prelude';
import {Effects, Task} from 'reflex';

/*:: import * as type from "../../type/browser/web-view/navigation" */



// User interaction interaction may also triggered following actions:
export const Stop/*:type.Stop*/ = {type: "WebView.Navigation.Stop"};
export const Reload/*:type.Reload*/ = {type: "WebView.Navigation.Reload"};
export const GoBack/*:type.GoBack*/ = {type: "WebView.Navigation.GoBack"};
export const GoForward/*:type.GoForward*/ = {type: "WebView.Navigation.GoForward"};

export const initiate/*:type.initiate*/ = (uri) => ({
  canGoBack: false,
  canGoForward: false,
  initiatedURI: uri,
  currentURI: uri
});

export const asRequest = action =>
  ({type: "WebView.Navigation.Request", action});

export const asRequestBy = (id, action) =>
  ({type: "WebView.Navigation.RequestBy", id, action});

export const asLoad/*:type.asLoad*/ = uri =>
  ({type: "WebView.Navigation.Load", uri});

export const asLocationChanged/*:type.asLocationChanged*/ = (id, uri, time) =>
  ({type: "WebView.Navigation.LocationChanged", id, uri, timeStamp: time});

export const load/*:type.load*/ = (model, uri) =>
  merge(model, {initiatedURI: uri, currentURI: uri});

export const changeLocation/*:type.changeLocation*/ = (model, uri) =>
  merge(model, {currentURI: uri});


export const fetchCanGoBack = id => Effects.task(Task.io(deliver => {
  const target = document.getElementById(`web-view-${id}`);
  if (target && target.getCanGoBack) {
    target.getCanGoBack().onsuccess = request => {
      deliver(Task.succeed({
        type: "WebView.Navigation.CanGoBackChanged",
        value: request.target.result
      }));
    }
  }
}));

export const fetchCanGoForward = id => Effects.task(Task.io(deliver => {
  const target = document.getElementById(`web-view-${id}`);
  if (target && target.getCanGoBack) {
    target.getCanGoBack().onsuccess = request => {
      deliver(Task.succeed({
        type: "WebView.Navigation.CanGoForwardChanged",
        value: request.target.result
      }));
    }
  }
}));

const invokefx = name => id => Effects.task(Task.io(deliver => {
  const target = document.getElementById(`web-view-${id}`);
  if (target && target[name]) {
    target[name]();
  }
}));

export const stop = invokefx('stop');
export const reload = invokefx('reload');
export const goBack = invokefx('goBack');
export const goForward = invokefx('goForward');

export const request = (model, {id, action}) =>
  action.type === "WebView.Navigation.Reload" ?
    [model, reload(id)] :
  action.type === "WebView.Navigation.Stop" ?
    [model, stop(id)] :
  action.type === "WebView.Navigation.GoBack" ?
    [model, goBack(id)] :
  action.type === "WebView.Navigation.GoForward" ?
    [model, goForward(id)] :
    [model, Effects.none];


export const step/*:type.step*/ = (model, action) =>
  action.type === "WebView.Navigation.CanGoForwardChanged" ?
    [merge(model, {canGoForward: action.value}), Effects.none] :
  action.type === "WebView.Navigation.CanGoBackChanged" ?
    [merge(model, {canGoBack: action.vaule}), Effects.none] :
  action.type === "WebView.Navigation.LocationChanged" ?
    [
      merge(model, {currentURI: action.uri}),
      Effects.batch([
        fetchCanGoBack(action.id),
        fetchCanGoForward(action.id)
      ])
    ] :
  action.type === "WebView.Navigation.Load" ?
    [
      merge(model, {
        initiatedURI: action.uri,
        currentURI: action.uri
      }),
      Effects.none
    ] :
  action.type === "WebView.Navigation.RequestBy" ?
    request(model, action) :
    [model, Effects.none];
