/* @flow */

import {forward, html, thunk, Effects} from 'reflex';
import * as Input from './input';
import * as Assistant from './assistant';
import * as Sidebar from './sidebar';
import * as Browser from './browser';
import * as WebViews from './web-views';
import * as Overlay from './overlay';
import {asFor, merge, cursor} from '../common/prelude';
import * as URI from '../common/url-helper';
import {Style, StyleSheet} from '../common/style';
import * as Animation from '../common/animation';
import {ease, easeOutCubic, float} from 'eased';


export const OverlayClicked = {type: "OverlayClicked"};
export const CreateWebView = {type: "CreateWebView"};

export const initialize/*:type.initialize*/ = () => {
  const [browser, browserFx] = Browser.initialize();
  const [sidebar, sidebarFx] = Sidebar.init();
  const [overlay, overlayFx] = Overlay.init(false, false);
  const model = {
    mode: 'create-web-view',
    browser,
    sidebar,
    overlay,
    animation: null,
  };

  return [
    model,
    Effects.batch([
      browserFx,
      overlayFx.map(OverlayAction),
      sidebarFx.map(SidebarAction)
    ])
  ];
};

const SidebarAction = action =>
    action.type === "Tab"
  ? asByWebViews(action.action)
  : action.type === 'CreateWebView'
  ? CreateWebView
  : ({type: "Sidebar", action});


const OverlayAction = action =>
    action.type === "Click"
  ? OverlayClicked
  : ({type: "Overlay", action});

const sidebar = cursor({
  get: model => model.sidebar,
  set: (model, sidebar) => merge(model, {sidebar}),
  tag: SidebarAction,
  update: Sidebar.step
});

const overlay = cursor({
  get: model => model.overlay,
  set: (model, overlay) => merge(model, {overlay}),
  tag: OverlayAction,
  update: Overlay.step
});

export const isOverlayClick = action =>
  action === OverlayClicked;

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
  (action === CreateWebView) ||
  (isWebViewAction(action) &&
   action.action.action.type === 'WebView.Create') ||
  (action.type === 'Browser.CreateWebView' ||
   (isKeyDown(action) && action.action.type === 'Browser.CreateWebView'));

export const isShowTabs = action =>
  action.type === 'Browser.ShowTabs' ||
  (isWebViewAction(action) && action.action.action.type === 'WebView.RequestShowTabs');

export const isEscape = action =>
  isKeyDown(action) &&
  action.action.type === 'Browser.Escape';

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


export const asByAnimation = asFor('animation');
export const asByWebViews = asFor('webViews');

export const showTabsTransitionDuration = 500;
export const hideTabsTransitionDuration = 200;


export const step = (model, action) => {
  if (action.type === "Sidebar") {
    return sidebar(model, action.action);
  }
  else if (action.type === "Overlay") {
    return overlay(model, action.action);
  }
  else if (action.type === 'For' && action.target === 'animation') {
    // @TODO Right now we set animation to null whet it is not running but
    // that makes delegation to Animation.step little tricky since animation
    // can be null. Furthermore `Animation.step` itself does not handle
    // `Animation.End` action so we need to check incoming actions before
    // delegation. We should out better API for `Animation` module or stop
    // settings `animation` to `null`.
    if (action.action.type === 'Animation.Tick') {
      const [animation, fx] = Animation.step(model.animation, action.action);
      return [
        merge(model, {
          animation: animation.now <= animation.end ?
                      animation :
                      null
        }),
        fx.map(asByAnimation)
      ];
    }
    else {
      return [model, Effects.none];
    }
  }
  else if (model.mode === 'create-web-view') {
    if (isAbort(action) || isEscape(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      // Only switch to show-web-view mode if there is a web view
      // to show. Otherwise remain in 'create-web-view' just let the
      // escape key clear the input or whatever it is that it is supposed
      // to do.
      if (model.browser.webViews.entries.length > 0) {
        return [
          merge(model, {browser, overlay, mode: 'show-web-view'}),
          Effects.batch([
            fx,
            overlayFx.map(OverlayAction)
          ])
        ];
      }
    }
    else if (isSubmit(action)) {
      // @TODO we also normalize in Browser for editing location. In future
      // we should create a single entry point for the URL.
      const open = Browser.asOpenWebView(URI.read(model.browser.input.value));
      const [browser, fx] = Browser.step(model.browser, open);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      return [
        merge(model, {browser, overlay, mode: 'show-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction)
        ])
      ];
    }
    // @TODO: Probably we should prevent input field from loosing a focus
    // by sendig in FocusRequest on Blur. Also we may want to ignore tab
    // switching events in this mode or respond by switching to
    // `select-web-view`.
  }
  else if (model.mode === 'edit-web-view') {
    if (isAbort(action) || isSubmit(action) || isEscape(action) || isOverlayClick(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      return [
        merge(model, {browser, overlay, mode: 'show-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction)
        ])
      ];
    }
    else if (isCreateTab(action)) {
      const [browser, fx] = Browser.step(model.browser, Browser.CreateWebView);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      return [
        merge(model, {browser, overlay, mode: 'create-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction)
        ])
      ];
    }
  }
  else if (model.mode === 'show-web-view') {
    if (isFocusInput(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Show);

      return [
        merge(model, {browser, overlay, mode: 'edit-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction)
        ])
      ]
    }
    else if (isCreateTab(action)) {
      const [browser, fx] = Browser.step(model.browser, Browser.CreateWebView);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      return [
        merge(model, {browser, mode: 'create-web-view'}),
        fx
      ];
    }
    // @TODO we should also wire up esc to cancel current webview loading if
    // 1) webview is loading 2) current mode is show webview.
    // When current webview is loading, esc should cancel load. Hitting esc
    // again should transition to show-tabs view.
    // When current webview is not loading, esc should go direct to
    // show-tabs view.
    else if (isShowTabs(action) || isEscape(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Show);
      const [sidebar, sidebarFx] = Sidebar.step(model.sidebar, Sidebar.Open);
      const [animation, animationFx]
        = Animation.initialize(performance.now(), showTabsTransitionDuration);

      return [
        merge(model, {browser, overlay, sidebar, animation, mode: 'show-tabs'}),
        Effects.batch([
          fx,
          sidebarFx.map(SidebarAction),
          animationFx.map(asByAnimation),
          overlayFx.map(OverlayAction)
        ])
      ];
    }
    else if (isSwitchSelectedWebView(action)) {
      const time = performance.now();
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Show);
      const [sidebar, sidebarFx] = Sidebar.step(model.sidebar, Sidebar.Open);
      const [animation, animationFx]
        = Animation.initialize(time, showTabsTransitionDuration);

      return [
        merge(model, {browser, sidebar, overlay, animation, mode: 'select-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction),
          sidebarFx.map(SidebarAction),
          // If animation was running no need for another tick.
          model.animation ? Effects.none : animationFx.map(asByAnimation)
        ])
      ];
    }
    else if (isEditWebview(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Show);

      return [
        merge(model, {browser, overlay, mode: 'edit-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction)
        ])
      ];
    }
  }
  else if (model.mode === 'show-tabs') {
    if (isEscape(action) ||
        isFocusWebView(action) ||
        isActivateWebView(action) ||
        isOverlayClick(action))
    {
      const time = performance.now();
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      const [sidebar, sidebarFx] = Sidebar.step(model.sidebar, Sidebar.Close);
      // TODO: Handle already running animation case (see #747).
      const [animation, animationFx]
        = Animation.initialize(time, hideTabsTransitionDuration);

      return [
        merge(model, {browser, sidebar, overlay, animation, mode: 'show-web-view'}),
        Effects.batch([
          fx,
          sidebarFx.map(SidebarAction),
          overlayFx.map(OverlayAction),
          // If animation was running no need for another tick.
          model.animation ? Effects.none : animationFx.map(asByAnimation)
        ])
      ];
    }
    else if (isCreateTab(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      const [sidebar, sidebarFx] = Sidebar.step(model.sidebar, Sidebar.Close);
      return [
        merge(model, {browser, sidebar, overlay, mode: 'create-web-view'}),
        Effects.batch([
          fx,
          sidebarFx.map(SidebarAction),
          overlayFx.map(OverlayAction)
        ])
      ];
    }
    // @TODO: Find out if we should handle this as it's not in the control
    // flow diagram, but presumably `meta l` should still trigger this.
    else if (isFocusInput(action)) {
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Show);
      const [sidebar, sidebarFx] = Sidebar.step(model.sidebar, Sidebar.Close);
      return [
        merge(model, {browser, overlay, mode: 'edit-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction),
          sidebarFx.map(SidebarAction),
          // If animation was running no need for another tick.
          model.animation ? Effects.none : animationFx.map(asByAnimation)
        ])
      ];
    }
  }
  else if (model.mode === 'select-web-view') {
    if (isActivateSelectedWebView(action)) {
      const time = performance.now();
      const [browser, fx] = Browser.step(model.browser, action);
      const [overlay, overlayFx] = Overlay.step(model.overlay, Overlay.Hide);
      const [sidebar, sidebarFx] = Sidebar.step(model.sidebar, Sidebar.Close);
      const [animation, animationFx]
        = Animation.initialize(time, hideTabsTransitionDuration);

      return [
        merge(model, {browser, sidebar, overlay, animation, mode: 'show-web-view'}),
        Effects.batch([
          fx,
          overlayFx.map(OverlayAction),
          sidebarFx.map(SidebarAction),
          // If animation was running no need for another tick.
          model.animation ? Effects.none : animationFx.map(asByAnimation)
        ])
      ];
    }
  }

  // If we reached this then action
  const [browser, fx] = Browser.step(model.browser, action);
  return [merge(model, {browser}), fx];
}

const transition = {
  webViewZoomOut(model) {
    const depth
      = model == null ?
          -200 :
          ease(easeOutCubic,
                float,
                0,
                -200,
                Animation.duration(model),
                Animation.progress(model));
    return {
      transform: `translate3d(0, 0, ${depth}px)`
    }
  },
  webViewZoomIn(model) {
    const depth
      = model == null ?
          0 :
          ease(easeOutCubic,
                float,
                -200,
                0,
                Animation.duration(model),
                Animation.progress(model));
    return {
      transform: `translate3d(0, 0, ${depth}px)`
    }
  }
}

const style = StyleSheet.create({
  inputVisible: {},
  inputHidden: {
    opacity: 0,
    pointerEvents: 'none'
  },

  webViewZoomedIn: {},
  webViewZoomedOut: {
    pointerEvents: 'none'
  },

  webViewShrink: {
    width: 'calc(100% - 50px)'
  },

  webViewExpand: {

  },

  content: {
    position: 'absolute',
    perspective: '1000px',
    height: '100%',
    width: '100%',
  },

  contentShrink: {
    width: 'calc(100% - 50px)'
  },

  contentExpand: {
    width: '100%'
  },

  assistantHidden: {
    display: 'none'
  },

  assistantFull: {
    // @WORKAROUND use percent instead of vw/vh to work around
    // https://github.com/servo/servo/issues/8754
    height: '100%'
  }
});

export const view = (model, address) =>
  model.mode === 'edit-web-view' ?
    viewAsEditWebView(model, address) :
  model.mode === 'show-web-view' ?
    viewAsShowWebView(model, address) :
  model.mode === 'create-web-view' ?
    viewAsCreateWebView(model, address) :
  model.mode === 'select-web-view' ?
    viewAsSelectWebView(model, address) :
  // mode === 'show-tabs' ?
    viewAsShowTabs(model, address);

const viewAsEditWebView = (model, address) =>
  Browser.view(model.browser, address, [
    html.div({
      className: 'content',
      style: Style(
        style.content,
        model.sidebar.isAttached ?
          style.contentShrink : style.contentExpand
      )
    }, [
      thunk('web-views',
            WebViews.view,
            model.browser.webViews,
            forward(address, asFor('webViews')),
            style.webViewZoomedIn),
      thunk('overlay',
          Overlay.view,
          model.overlay,
          forward(address, OverlayAction)),
      thunk('suggestions',
            Assistant.view,
            model.browser.suggestions,
            address),
      thunk('input',
            Input.view,
            model.browser.input,
            forward(address, asFor('input')),
            style.inputVisible)
    ]),
    thunk('sidebar',
          Sidebar.view,
          model.sidebar,
          model.browser.webViews,
          forward(address, SidebarAction))
  ]);

const viewAsShowWebView = (model, address) =>
  Browser.view(model.browser, address, [
    html.div({
      className: 'content',
      style: Style(
        style.content,
        model.sidebar.isAttached ?
          style.contentShrink : style.contentExpand
      )
    }, [
      thunk('web-views',
            WebViews.view,
            model.browser.webViews,
            forward(address, asFor('webViews')),
            transition.webViewZoomIn(model.animation)),
      thunk('overlay',
            Overlay.view,
            model.overlay,
            forward(address, OverlayAction)),
      thunk('suggestions',
            Assistant.view,
            model.browser.suggestions,
            address,
            style.assistantHidden),
      thunk('input',
            Input.view,
            model.browser.input,
            forward(address, asFor('input')),
            style.inputHidden)
    ]),
    thunk('sidebar',
          Sidebar.view,
          model.sidebar,
          model.browser.webViews,
          forward(address, SidebarAction))
  ]);

const viewAsCreateWebView = (model, address) =>
  Browser.view(model.browser, address, [
    html.div({
      className: 'content',
      style: Style(
        style.content,
        model.sidebar.isAttached ?
          style.contentShrink : style.contentExpand
      )
    }, [
      thunk('web-views',
            WebViews.view,
            model.browser.webViews,
            forward(address, asFor('webViews')),
            Style(style.webViewZoomedOut,
                  transition.webViewZoomIn(model.animation))),
      thunk('overlay',
            Overlay.view,
            model.overlay,
            forward(address, OverlayAction)),
      thunk('suggestions',
            Assistant.view,
            model.browser.suggestions,
            address,
            style.assistantFull),
      thunk('input',
            Input.view,
            model.browser.input,
            forward(address, asFor('input')),
            style.inputVisible)
    ]),
    thunk('sidebar',
          Sidebar.view,
          model.sidebar,
          model.browser.webViews,
          forward(address, SidebarAction))
  ]);

const viewAsSelectWebView = (model, address) =>
  Browser.view(model.browser, address, [
    html.div({
      className: 'content',
      style: Style(
        style.content,
        model.sidebar.isAttached ?
          style.contentShrink : style.contentExpand
      )
    }, [
      thunk('web-views',
            WebViews.view,
            model.browser.webViews,
            forward(address, asFor('webViews')),
            Style(style.webViewZoomedOut,
                  transition.webViewZoomOut(model.animation))),
      thunk('overlay',
            Overlay.view,
            model.overlay,
            forward(address, OverlayAction)),
      thunk('suggestions',
            Assistant.view,
            model.browser.suggestions,
            address,
            style.assistantHidden),
      thunk('input',
            Input.view,
            model.browser.input,
            forward(address, asFor('input')),
            style.inputHidden)
    ]),
    thunk('sidebar',
          Sidebar.view,
          model.sidebar,
          model.browser.webViews,
          forward(address, SidebarAction))
  ]);

const viewAsShowTabs = (model, address) =>
  Browser.view(model.browser, address, [
    html.div({
      className: 'content',
      style: Style(
        style.content,
        model.sidebar.isAttached ?
          style.contentShrink : style.contentExpand
      )
    }, [
      thunk('web-views',
            WebViews.view,
            model.browser.webViews,
            forward(address, asFor('webViews')),
            Style(style.webViewZoomedOut,
                  transition.webViewZoomOut(model.animation))),
      thunk('overlay',
            Overlay.view,
            model.overlay,
            forward(address, OverlayAction)),
      thunk('suggestions',
            Assistant.view,
            model.browser.suggestions,
            address,
            style.assistantHidden),
      thunk('input',
            Input.view,
            model.browser.input,
            forward(address, asFor('input')),
            style.inputHidden)
    ]),
    thunk('sidebar',
          Sidebar.view,
          model.sidebar,
          model.browser.webViews,
          forward(address, SidebarAction))
  ]);
