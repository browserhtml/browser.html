/* @flow */

/*:: import * as type from "../../type/common/runtime" */
import {always} from "../common/prelude";
import {Task, Effects} from "reflex";

// Actions
export const RemoteDebugRequest/*:type.RemoteDebugRequest*/
  = {type: "Runtime.RemoteDebugRequest"};

export const UpdateAvailable/*:type.UpdateAvailable*/
  = {type: "Runtime.UpdateAvailable"};

export const UpdateDownloaded/*:type.UpdateDownloaded*/
  = {type: "Runtime.UpdateDownloaded"};

export const CheckUpdate/*:type.CheckUpdate*/
  = {type: "Runtime.CheckUpdate"};

export const Restart/*:type.Restart*/
  = {type: "Runtime.Restart"};

export const CleanRestart/*:type.CleanRestart*/
  = {type: "Runtime.CleanRestart"};

export const CleanReload/*:type.CleanReload*/
  = {type: "Runtime.CleanReload"};

export const Reload/*:type.Reload*/
  = {type: "Runtime.Reload"};

export const Closed/*:type.Closed*/
  = {type: "Runtime.Closed"};

export const Minimized/*:type.Minimized*/
  = {type: "Runtime.Minimized"};

export const FullScreenToggled/*:type.FullScreenToggled*/
  = {type: "Runtime.FullScreenToggled"};

export const LiveReload/*:type.LiveReload*/
  = {type: "Runtime.LiveReload"};


// Action annotations
export const asUnknown/*:type.asUnknown*/ = detail => ({
  type: "Runtime.Unknown",
  detail
});

export const asRemoteDebugResponse/*:type.asRemoteDebugResponse*/ = value => ({
  type: "Runtime.RemoteDebugResponse",
  value
});

export const asDownloadUpdate/*:type.asDownloadUpdate*/ = result => ({
  type: "Runtime.DownloadUpdate",
  result
});


const dispatchRequest = data =>
  dispatchEvent(new CustomEvent("mozContentEvent", {
    bubbles: false,
    cancelable: false,
    detail: data
  }));

export const shutdown/*:type.minimize*/ = () =>
  Effects.task(Task.io((deliver) => {
    dispatchRequest({type: "shutdown-application"});
    // We do not actually close a window but rather we shut down an app, there
    // will be nothing handling a response so we don"t even bother with it.
  }));


export const minimize/*:type.minimize*/ = () =>
  Effects.task(Task.future(() => {
    dispatchRequest({type: "minimize-native-window"});
    // We do not get event back when window is minimized so we just pretend
    // that we got it after a tick.
    return Promise.resolve(Minimized);
  }));

export const toggleFullScreen/*:type.toggleFullScreen*/ = () =>
  Effects.task(Task.future(() => {
    dispatchRequest({type: "toggle-fullscreen-native-window"});
    // We do not get event back when window is maximized so we just pretend
    // that we got it after a tick.
    return Promise.resolve(FullScreenToggled);
  }));

export const restart/*:type.restart*/ = () =>
  Effects.task(Task.io((deliver) => {
    console.warn(`Unsupported runtime task "restart" was triggered`);
    dispatchRequest({type: "restart"});
  }));

export const cleanRestart/*:type.cleanRestart*/ = () =>
  Effects.task(Task.io((deliver) => {
    dispatchRequest({type: "clear-cache-and-restart"});
  }));

export const cleanReload/*:type.cleanReload*/ = () =>
  Effects.task(Task.io((deliver) => {
    dispatchRequest({type: "clear-cache-and-reload"});
  }));

export const reload/*:type.reload*/ = () =>
  Effects.task(Task.io(deliver => {
    try {
      window.location.reload();
    } catch (error) {}
  }))
