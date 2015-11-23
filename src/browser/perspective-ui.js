/* @flow */

import {forward, thunk} from 'reflex';
import * as Input from './input';
import * as Assistant from './assistant';
import * as Sidebar from './sidebar';
import * as Browser from './browser';
import * as WebViews from './web-views';
import {asFor, merge} from '../common/prelude';
import {Style, StyleSheet} from '../common/style';

export const initialize/*:type.initialize*/ = () => {
  const [browser, fx] = Browser.initialize();
  return [asCreateWebView(browser), fx];
};

export const isInputAction = action =>
  action.type === 'For' &&
  action.target === 'input';

export const isWebViewAction = action =>
  action.type === 'For' &&
  action.target === 'webViews' &&
  (
    action.action.type === 'WebViews.ByActive' ||
    action.action.type === 'WebViews.ByID'
  );

export const isFocusAction = action =>
  action.type === 'Focusable.Focus' ||
  action.type === 'Focusable.RequestFocus';

export const isAbort = action =>
  isInputAction(action) &&
  action.action.type === 'Input.Abort';

export const isSubmit = action =>
  isInputAction(action) &&
  action.action.type === 'Input.Submit';

export const isFocusInput = action =>
  isInputAction(action) &&
  isFocusAction(action.action);

export const isKeyDown = action =>
  action.type === 'For' &&
  action.target === 'Browser.KeyDown';

export const isKeyUp = action =>
  action.type === 'For' &&
  action.target === 'Browser.KeyUp';

export const isCreateTab = action =>
  action.type === 'Browser.CreateWebView' ||
  (isKeyDown(action) && action.action.type === 'Browser.CreateWebView');

export const isShowTabs = action =>
  action.type === 'Browser.ShowTabs';

export const isEscape = action =>
  action.type === 'Browser.Escape';

export const isActivateSelected = action =>
  action.type === 'For' &&
  action.target === 'webViews' &&
  action.action.type === 'WebViews.ActivateSelected';

export const isActivateSelectedWebView = action =>
  isActivateSelected(action) ||
  (isKeyUp(action) && isActivateSelected(action.action));


export const isFocusWebView = action =>
  isWebViewAction(action) &&
  isFocusAction(action.action.action);

export const isActivateWebView = action =>
  isWebViewAction(action) &&
  action.action.action.type === 'WebView.Activate';

export const isEditWebview = action =>
  isWebViewAction(action) &&
  action.action.action.type === 'WebView.Edit';

export const isSelectRelativeWebView = action =>
  action.type === 'For' &&
  action.target === 'webViews' &&
  action.action.type === 'WebViews.SelectRelative';

export const isSwitchSelectedWebView = action =>
  isSelectRelativeWebView(action) ||
  (isKeyDown(action) && isSelectRelativeWebView(action.action));


export const asCreateWebView = browser =>
  ({mode: 'create-web-view', browser});

export const asShowWebView = browser =>
  ({mode: 'show-web-view', browser});

export const asEditWebView = browser =>
  ({mode: 'edit-web-view', browser});

export const asShowTabs = browser =>
  ({mode: 'show-tabs', browser});

export const asSelectWebView = browser =>
  ({mode: 'select-web-view', browser});

export const step = (model, action) => {
  if (model.mode === 'create-web-view') {
    if (isAbort(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      // Only switch to show-web-view mode if there is a web view
      // to show. Otherwise remain in 'create-web-view' just let the
      // escape key clear the input or whatever it is that it is supposed
      // to do.
      if (model.browser.webViews.entries.length > 0) {
        return [asShowWebView(browser), fx];
      }
    }
    else if (isSubmit(action)) {
      const open = Browser.asOpenWebView(model.browser.input.value);
      const [browser, fx] = Browser.step(model.browser, open);
      return [asShowWebView(browser), fx];
    }
    // @TODO: Probably we should prevent input field from loosing a focus
    // by sendig in FocusRequest on Blur. Also we may want to ignore tab
    // switching events in this mode or respond by switching to
    // `select-web-view`.
  }
  else if (model.mode === 'edit-web-view') {
    if (isAbort(action) || isSubmit(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asShowWebView(browser), fx];
    }
    else if (action.target === 'Browser.KeyUp' && action.action.key === 'Escape') {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asShowWebView(browser), fx];
    }
  }
  else if (model.mode === 'show-web-view') {
    if (isFocusInput(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asEditWebView(browser), fx];
    }
    else if (isCreateTab(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asCreateWebView(browser), fx];
    }
    else if (isShowTabs(action) || isEscape(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asShowTabs(browser), fx];
    }
    else if (isSwitchSelectedWebView(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asSelectWebView(browser), fx];
    }
    else if (isEditWebview(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asEditWebView(browser), fx];
    }
  }
  else if (model.mode === 'show-tabs') {
    if (isEscape(action) ||
        isFocusWebView(action) ||
        isActivateWebView(action))
    {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asShowWebView(browser), fx];
    }
    else if (isCreateTab(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asCreateWebView(browser), fx];
    }
    // @TODO: Find out if we should handle this as it's not in the control
    // flow diagram, but presumably `meta l` should still trigger this.
    else if (isFocusInput(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asEditWebView(browser), fx];
    }
  }
  else if (model.mode === 'select-web-view') {
    if (isActivateSelectedWebView(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      return [asShowWebView(browser), fx];
    }
  }

  // If we reached this then action
  const [browser, fx] = Browser.step(model.browser, action);
  return [merge(model, {browser}), fx];
}

const style = StyleSheet.create({
  sidebarVisible: {},
  sidebarHidden: {
    transform: 'translateX(380px)'
  },

  inputVisible: {},
  inputHidden: {
    opacity: 0,
    pointerEvents: 'none'
  },

  webViewZoomedIn: {},
  webViewZoomedOut: {
    transform: 'translate3d(0, 0, -600px) rotateY(10deg)',
    transformOrigin: 'left center',
    pointerEvents: 'none'
  }
});

export const view = ({mode, browser}, address) =>
  mode === 'edit-web-view' ?
    viewAsEditWebView(browser, address) :
  mode === 'show-web-view' ?
    viewAsShowWebView(browser, address) :
  mode === 'create-web-view' ?
    viewAsCreateWebView(browser, address) :
  mode === 'select-web-view' ?
    viewAsSelectWebView(browser, address) :
  // mode === 'show-tabs' ?
    viewAsShowTabs(browser, address);

const viewAsEditWebView = (model, address) =>
  Browser.view(model, address, [
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.webViewZoomedIn),
    thunk('sidebar',
          Sidebar.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.sidebarHidden),
    thunk('input',
          Input.view,
          model.input,
          forward(address, asFor('input')),
          style.inputVisible),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address)
  ]);

const viewAsShowWebView = (model, address) =>
  Browser.view(model, address, [
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.webViewZoomedIn),
    thunk('sidebar',
          Sidebar.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.sidebarHidden),
    thunk('input',
          Input.view,
          model.input,
          forward(address, asFor('input')),
          style.inputHidden),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address)
  ]);

const viewAsCreateWebView = (model, address) =>
  Browser.view(model, address, [
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.webViewZoomedIn),
    thunk('sidebar',
          Sidebar.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.sidebarHidden),
    thunk('input',
          Input.view,
          model.input,
          forward(address, asFor('input')),
          style.inputVisible),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address)
  ]);

const viewAsSelectWebView = (model, address) =>
  Browser.view(model, address, [
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.webViewZoomedOut),
    thunk('sidebar',
          Sidebar.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.sidebarVisible),
    thunk('input',
          Input.view,
          model.input,
          forward(address, asFor('input')),
          style.inputHidden),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address)
  ]);

const viewAsShowTabs = (model, address) =>
  Browser.view(model, address, [
    thunk('web-views',
          WebViews.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.webViewZoomedOut),
    thunk('sidebar',
          Sidebar.view,
          model.webViews,
          forward(address, asFor('webViews')),
          style.sidebarVisible),
    thunk('input',
          Input.view,
          model.input,
          forward(address, asFor('input')),
          style.inputHidden),
    thunk('suggestions',
          Assistant.view,
          model.suggestions,
          address)
  ]);
