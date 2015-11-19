/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from '../../type/browser/perspective-ui' */

import {html, forward, thunk} from "reflex";

import {onWindow} from "driver";

import {asFor, merge, always} from "../common/prelude";
import {Style, StyleSheet} from '../common/style';
import * as Keyboard from '../common/keyboard';
import * as OS from '../common/os';
import * as Focusable from "../common/focusable";
import * as Shell from "./shell";
import * as Input from "./input";
import * as Assistant from "./assistant";
import * as WindowControls from "./window-controls";
import * as Sidebar from "./sidebar";

// import * as Updater from "./updater"
// import * as Devtools from "./devtools"
import * as WebViews from "./web-views"

// Modes
export const EditWebView/*:type.EditWebView*/ = {mode: 'edit-web-view'};
export const ShowWebView/*:type.ShowWebView*/ = {mode: 'show-web-view'};
export const CreateWebView/*:type.CreateWebView*/ = {mode: 'create-web-view'};
export const SelectWebView/*:type.SelectWebView*/ = {mode: 'select-web-view'};
export const ShowTabs/*:type.ShowTabs*/ = {mode: 'show-tabs'};
export const initial = CreateWebView;

const asForInput = asFor('input');

const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';

const FocusInput = asForInput(Focusable.Focus);

const keyDown = Keyboard.bindings({
  'accel l': always(asForInput(Focusable.Focus)),
  // 'accel t': _ => SynthesisUI.OpenNew(),
  // 'accel 0': _ => WebView.BySelected({action: Shell.ResetZoom()}),
  // 'accel -': _ => WebView.BySelected({action: Shell.ZoomOut()}),
  // 'accel =': _ => WebView.BySelected({action: Shell.ZoomIn()}),
  // 'accel shift =': _ => WebView.BySelected({action: Shell.ZoomIn()}),
  // 'accel w': _ => WebView.BySelected({action: WebView.Close()}),
  // 'accel shift ]': _ => WebView.Preview({action: Selector.Next()}),
  // 'accel shift [': _ => WebView.Preview({action: Selector.Previous()}),
  // 'control tab': _ => WebView.Preview({action: Selector.Next()}),
  // 'control shift tab': _ => WebView.Preview({action: Selector.Previous()}),
  // 'accel shift backspace': _ => Session.ResetSession(),
  // 'accel shift s': _ => Session.SaveSession(),
  // 'accel r': _ => WebView.BySelected({action: Navigation.Reload()}),
  // 'escape': _ => WebView.BySelected({action: Navigation.Stop()}),
  // [`${modifier} left`]: _ => WebView.BySelected({action: Navigation.GoBack()}),
  // [`${modifier} right`]: _ => WebView.BySelected({action: Navigation.GoForward()}),

  // TODO: `meta alt i` generates `accel alt i` on OSX we need to look
  // more closely into this but so declaring both shortcuts should do it.
  // 'accel alt i': _ => DevtoolsHUD.ToggleDevtoolsHUD(),
  // 'accel alt ˆ': _ => DevtoolsHUD.ToggleDevtoolsHUD(),
  // 'F12': _ => DevtoolsHUD.ToggleDevtoolsHUD()
});

const keyUp = Keyboard.bindings({
  // 'control': _ => SynthesisUI.ShowSelected(),
  // 'accel': _ => SynthesisUI.ShowSelected(),
});

const style = StyleSheet.create({
  root: {
    background: '#24303D',
    perspective: '1000px',
    // These styles prevent scrolling with the arrow keys in the root window
    // when elements move outside of viewport.
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'absolute'
  }
});

// Create a mode view, wrapping child elements in the root element.
const viewRoot = (children, address) =>
  html.div({
    className: 'root',
    style: style.root,
    tabIndex: 1,
    onKeyDown: onWindow(forward(address, asFor("Browser.KeyDown")), keyDown),
    onKeyUp: onWindow(forward(address, asFor("Browser.KeyUp")), keyUp),
    onBlur: onWindow(forward(address, asFor("shell")), Focusable.asBlur),
    onFocus: onWindow(forward(address, asFor("shell")), Focusable.asFocus),
    // onUnload: () => address(Session.SaveSession),
  }, children);

const viewAsEditWebView = (model, address) =>
  viewRoot([
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('sidebar',
          Sidebar.viewAsEditWebView,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('input',
          Input.viewAsEditWebView,
          model.input,
          forward(address, asFor("input"))),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address),
    thunk('controls',
      WindowControls.view,
      model.shell,
      forward(address, asFor("shell")))
  ], address);

const viewAsShowWebView = (model, address) =>
  viewRoot([
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('sidebar',
          Sidebar.viewAsShowWebView,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('input',
          Input.viewAsShowWebView,
          model.input,
          forward(address, asFor("input"))),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address),
    thunk('controls',
      WindowControls.view,
      model.shell,
      forward(address, asFor("shell")))
  ], address);

const viewAsCreateWebView = (model, address) =>
  viewRoot([
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('sidebar',
          Sidebar.viewAsCreateWebView,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('input',
          Input.viewAsCreateWebView,
          model.input,
          forward(address, asFor("input"))),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address),
    thunk('controls',
      WindowControls.view,
      model.shell,
      forward(address, asFor("shell")))
  ], address);

const viewAsSelectWebView = (model, address) =>
  viewRoot([
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('sidebar',
          Sidebar.viewAsSelectWebView,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('input',
          Input.viewAsSelectWebView,
          model.input,
          forward(address, asFor("input"))),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address),
    thunk('controls',
      WindowControls.view,
      model.shell,
      forward(address, asFor("shell")))
  ], address);

const viewAsShowTabs = (model, address) =>
  viewRoot([
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('sidebar',
          Sidebar.viewAsShowTabs,
          model.webViews,
          forward(address, asFor("webViews"))),
    thunk('input',
          Input.viewAsShowTabs,
          model.input,
          forward(address, asFor("input"))),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address),
    thunk('controls',
      WindowControls.view,
      model.shell,
      forward(address, asFor("shell")))
  ], address);

export const view/*:type.view*/ = (model, address) =>
  model.mode === EditWebView ?
    viewAsEditWebView(model, address) :
  model.mode === ShowWebView ?
    viewAsShowWebView(model, address) :
  model.mode === CreateWebView ?
    viewAsCreateWebView(model, address) :
  model.mode === SelectWebView ?
    viewAsSelectWebView(model, address) :
  // model.mode === ShowTabs ?
    viewAsShowTabs(model, address);