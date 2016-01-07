/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/web-view" */

import {Effects, html} from 'reflex';
import {merge, always, asFor} from '../common/prelude';
import {on} from 'driver';
import * as Shell from './web-view/shell';
import * as Progress from './web-view/progress';
import * as Navigation from './web-view/navigation';
import * as Security from './web-view/security';
import * as Page from './web-view/page';
import * as Tab from "./sidebar/tab";
import {Style, StyleSheet} from '../common/style';
import * as Driver from 'driver';
import * as URI from '../common/url-helper';
import * as Animation from '../common/animation';
import {ease, easeOutCubic, float} from 'eased';

export const RequestZoomIn = Shell.asRequest(Shell.ZoomIn);
export const RequestZoomOut = Shell.asRequest(Shell.ZoomOut);
export const RequestZoomReset = Shell.asRequest(Shell.ResetZoom);
export const RequestMakeVisibile = Shell.asRequest(Shell.asChangeVisibility(true));
export const RequestMakeNotVisibile = Shell.asRequest(Shell.asChangeVisibility(false));
export const RequestStop = Navigation.asRequest(Navigation.Stop);
export const RequestReload = Navigation.asRequest(Navigation.Reload);
export const RequestGoBack = Navigation.asRequest(Navigation.GoBack);
export const RequestGoForward = Navigation.asRequest(Navigation.GoForward);

export const Select/*:type.Select*/
  = {type: "WebView.Select"};

export const Activate/*:type.Activate*/
  = {type: "WebView.Activate"};

export const Close/*:type.Close*/
  = {type: "WebView.Close"};

export const Edit/*:type.Edit*/
  = {type: 'WebView.Edit'};

export const RequestShowTabs/*:type.RequestShowTabs*/
 = {type: 'WebView.RequestShowTabs'};

export const Create = ({type: 'WebView.Create'});

export const open/*:type.open*/ = (id, options) => ({
  id: id,
  name: options.name,
  features: options.name,
  isSelected: !options.inBackground,
  isActive: !options.inBackground,
  shell: Shell.initial,
  security: Security.initial,
  navigation: Navigation.initiate(options.uri),
  page: Page.initiate(options.uri),
  tab: Tab.initial,
  progress: null,
  animation: null
})

const unselectTransitionDuration = 300;
const selectTransitionDuration = 400;

export const select/*:type.select*/ = model => {
  if (model.isSelected) {
    return [model, Effects.none];
  }
  else {
    const [animation, fx]
      = Animation.initialize(performance.now(), selectTransitionDuration);

    return [
      merge(model, {isSelected: true, animation}),
      fx
    ]
  }
}

export const unselect/*:type.unselect*/ = model => {
  if (model.isSelected) {
    const [animation, fx]
      = Animation.initialize(performance.now(), unselectTransitionDuration);

    return [
      merge(model, {isSelected: false, animation}),
      fx
    ]
  } else {
    return [model, Effects.none];
  }
}

export const activate/*:type.activate*/ = model =>
  (model.isActive && model.isFocused) ?
    model :
    merge(model, {
      isActive: true,
      shell: Shell.focus(model.shell)
    });

export const deactivate/*:type.deactivate*/ = model =>
  model.isActive ?
    merge(model, {
      isActive: false,
      shell: Shell.blur(model.shell)
    }) :
    model;

export const asLoad = Navigation.asLoad;

export const readTitle/*:type.readTitle*/ = (model, fallback) =>
  (model.page && model.page.title && model.page.title !== '') ?
    model.page.title :
  model.navigation.currentURI.search(/^\s*$/) ?
    URI.prettify(model.navigation.currentURI) :
  fallback;

export const readFaviconURI/*:type.readFaviconURI*/ = (model) =>
  model.page && model.page.faviconURI ?
    model.page.faviconURI :
  // @TODO use a proper URL.join function. Need to add this to url-helper lib.
  `${model.navigation.currentURI}/favicon.ico`;

export const isDark/*:type.isDark*/ = (model) =>
  model.page ? model.page.pallet.isDark : false;

export const step/*:type.step*/ = (model, action) => {
  if (action.type === "Point") {
    return Tab.update(model, action);
  }
  // Shell actions
  if (action.type === "WebView.Select") {
    return select(model);
  }
  else if (action.type === "WebView.Activate") {
    return [activate(model), Effects.none];
  }
  else if (action.type === "Focusable.FocusRequest") {
    return [activate(model), Effects.none];
  }
  else if (action.type === "Focusable.Focus") {
    return [activate(model), Effects.none];
  }
  else if (action.type === "Focusable.Blur") {
    const [shell, fx] = Shell.step(model.shell, action);
    return [merge(model, {shell}), fx];
  }
  // Progress actions
  else if (action.type === 'WebView.Progress.Tick')
  {
    const [progress, fx] = Progress.step(model.progress, action);
    return [merge(model, {progress}), fx];
  }
  else if (action.type === 'WebView.Progress.Start') {
    const [progress, progressFx] = Progress.start(action.timeStamp);
    const [page, pageFx] = Page.step(model.page, action);
    const security = Security.initial;

    return [
      merge(model, {progress, page, security}),
      Effects.batch([
        progressFx,
        pageFx
      ])
    ];

  }
  else if (action.type === 'WebView.Progress.End') {
    const [progress, progressFx] = Progress.step(model.progress, action);
    const [page, pageFx] = Page.step(model.page, action);

    return [
      merge(model, {progress, page}),
      Effects.batch([
        progressFx,
        pageFx
      ])
    ];
  }
  // Note: WebView dispatches `WebView.LocationChanged` action but `Navigation`
  // needs to know the id of the web-view to schedule effects. There for
  // in here we create `WebView.Navigation.LocationChanged` action (name diff is
  // subtle & would be nice to improve) that also contains id of the web-view.
  else if (action.type === 'WebView.LocationChanged') {
    const request = Navigation.asLocationChanged(model.id,
                                                  action.uri,
                                                  action.timeStamp);
    const [navigation, navigationFx] = Navigation.step(model.navigation,
                                                        request);
    const [page, pageFx] = Page.step(model.page, action);
    return [
      merge(model, {navigation, page}),
      Effects.batch([navigationFx, pageFx])
    ];
  }
  else if (action.type === 'WebView.Navigation.Request') {
    const request = Navigation.asRequestBy(model.id, action.action);
    const [navigation, fx] = Navigation.step(model.navigation, request);
    return [merge(model, {navigation}), fx];
  }
  else if (action.type === 'WebView.Navigation.Load' ||
           action.type === 'WebView.Navigation.CanGoBackChanged' ||
           action.type === 'WebView.Navigation.CanGoForwardChanged')
  {
    const [navigation, fx] = Navigation.step(model.navigation, action);
    return [merge(model, {navigation}), fx];
  }
  else if (action.type === 'WebView.Security.Changed') {
    const [security, fx] = Security.step(model.security, action);
    return [merge(model, {security}), fx];
  }
  // Page actions
 else if (action.type === 'WebView.Page.ScreenshotUpdate'
        || action.type === 'WebView.Page.CuratedColorUpdate'
        || action.type === 'WebView.Page.ColorScraped'
        || action.type === 'WebView.Page.DocumentFirstPaint'
        || action.type === 'WebView.Page.FirstPaint'
        || action.type === 'WebView.Page.DocumentFakePaint'
        || action.type === 'WebView.Page.MetaChanged'
        || action.type === 'WebView.Page.TitleChanged'
        || action.type === 'WebView.Page.IconChanged'
        || action.type === 'WebView.Page.OverflowChanged'
        || action.type === 'WebView.Page.Scrolled')
  {
    const [page, fx] = Page.step(model.page, action);
    return [merge(model, {page}), fx];
  }
  else if (action.type === "WebView.Shell.Request") {
    const request = Shell.asRequestBy(model.id, action.action);
    const [shell, fx] = Shell.step(model.shell, request);
    return [merge(model, {shell}), fx];
  }
  else if (action.type === "WebView.Shell.ZoomChanged" ||
           action.type === "WebView.Shell.VisibilityChanged") {
    const [shell, fx] = Shell.step(model.shell, action);
    return [merge(model, {shell}), fx];
  }
  else if (action.type === "Animation.Tick") {
    // @TODO: Find out how do we end up in case where we have removed
    // unimation but still get a tick.
    if (model.animation) {
      const [animation, fx] = Animation.step(model.animation, action);
      return [merge(model, {animation}), fx];
    } {
      return [model, Effects.none];
    }
  }
  else if (action.type === "Animation.End") {
    return [merge(model, {animation: null}), Effects.none]
  }
  else {
    return [model, Effects.none];
  }
}

const topBarHeight = '27px';
const comboboxHeight = '21px';
const comboboxWidth = '250px';

const transition = {
  select(animation) {
    return animation == null
      ? null
      : {opacity: ease(easeOutCubic,
                        float,
                        0,
                        1,
                        Animation.duration(animation),
                        Animation.progress(animation))};
  },
  unselect(animation) {
    return animation == null
      ? style.webViewInactive
      : {opacity: ease(easeOutCubic,
                        float,
                        1,
                        0,
                        Animation.duration(animation),
                        Animation.progress(animation))};
  }
}

const style = StyleSheet.create({
  webview: {
    position: 'absolute', // to stack webview on top of each other
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    mozUserSelect: 'none',
    cursor: 'default',
    opacity: 1,
    zIndex: 2
  },

  webViewInactive: {
    pointerEvents: 'none',
    visibility: 'hidden',
    opacity: 0,
    zIndex: 1
  },

  iframe: {
    display: 'block', // iframe are inline by default
    position: 'absolute',
    top: topBarHeight,
    left: 0,
    width: '100%',
    height: `calc(100% - ${topBarHeight})`,
    mozUserSelect: 'none', // necessary to pass text drag to iframe's content
    borderWidth: 0,
    backgroundColor: 'white',
    MozWindowDragging: 'no-drag'
  },

  topbar: {
    backgroundColor: 'white', // dynamic
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: topBarHeight,
  },

  combobox: {
    MozWindowDragging: 'no-drag',
    position: 'absolute',
    left: '50%',
    top: 0,
    height: comboboxHeight,
    lineHeight: comboboxHeight,
    width: comboboxWidth,
    marginTop: `calc(${topBarHeight} / 2 - ${comboboxHeight} / 2)`,
    marginLeft: `calc(${comboboxWidth} / -2)`,
    borderRadius: '5px',
    cursor: 'text',
  },

  lightText: {
    color: 'rgba(0, 0, 0, 0.8)',
  },

  darkText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingLeft: '30px',
    paddingRight: '30px',
    width: 'calc(100% - 60px)',
    textAlign: 'center',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  // Also has some hover styles defined in theme.css
  iconSearch: {
    fontFamily: 'FontAwesome',
    fontSize: '14px',
    left: '5px',
    position: 'absolute',
  },

  iconSecure: {
    fontFamily: 'FontAwesome',
    marginRight: '6px'
  },

  iconInsecure: {
    display: 'none'
  },

  iconShowTabs: {
    MozWindowDragging: 'no-drag',
    backgroundImage: 'url(css/hamburger.sprite.png)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 0',
    backgroundSize: '50px auto',
    position: 'absolute',
    height: '13px',
    right: '8px',
    top: '7px',
    width: '14px'
  },

  iconShowTabsDark: {
    backgroundPosition: '0 -50px'
  },

  iconCreateTab: {
    MozWindowDragging: 'no-drag',
    color: 'rgba(0,0,0,0.8)',
    fontFamily: 'FontAwesome',
    fontSize: '18px',
    lineHeight: '32px',
    position: 'absolute',
    textAlign: 'center',
    bottom: 0,
    right: 0,
    width: '30px',
    height: '32px',
  },

  iconCreateTabDark: {
    color: 'rgba(255,255,255,0.8)',
  }
});

const viewFrame = (model, address) =>
  html.iframe({
    id: `web-view-${model.id}`,
    src: model.navigation.initiatedURI,
    'data-current-uri': model.navigation.currentURI,
    'data-name': model.name,
    'data-features': model.features,
    element: Driver.element,
    style: Style(style.iframe),
    attributes: {
      mozbrowser: true,
      remote: true,
      mozapp: URI.isPrivileged(model.navigation.currentURI) ?
                URI.getManifestURL().href :
                void(0),
      mozallowfullscreen: true
    },
    // isVisible: visiblity(model.isActive),
    // zoom: zoom(model.shell.zoom),

    isFocused: Driver.focus(model.shell.isFocused),

    // Events

    onBlur: on(address, decodeBlur),
    onFocus: on(address, decodeFocus),
    // onMozbrowserAsyncScroll: on(address, decodeAsyncScroll),
    onMozBrowserClose: on(address, decodeClose),
    onMozBrowserOpenWindow: on(address, decodeOpenWindow),
    onMozBrowserOpenTab: on(address, decodeOpenTab),
    onMozBrowserContextMenu: on(address, decodeContexMenu),
    onMozBrowserError: on(address, decodeError),
    onMozBrowserLoadStart: on(address, decodeLoadStart),
    onMozBrowserLoadEnd: on(address, decodeLoadEnd),
    onMozBrowserFirstPaint: on(address, decodeFirstPaint),
    onMozBrowserDocumentFirstPaint: on(address, decodeDocumentFirstPaint),
    onMozBrowserLoadProgressChange: on(address, decodeProgressChange),
    onMozBrowserLocationChange: on(address, decodeLocationChange),
    onMozBrowserMetaChange: on(address, decodeMetaChange),
    onMozBrowserIconChange: on(address, decodeIconChange),
    onMozBrowserLocationChange: on(address, decodeLocationChange),
    onMozBrowserSecurityChange: on(address, decodeSecurityChange),
    onMozBrowserTitleChange: on(address, decodeTitleChange),
    onMozBrowserShowModalPrompt: on(address, decodeShowModalPrompt),
    onMozBrowserUserNameAndPasswordRequired: on(address, decodeAuthenticate),
    onMozBrowserScrollAreaChanged: on(address, decodeScrollAreaChange),
  });

export const view/*:type.view*/ = (model, address) => {
  const isModelDark = isDark(model);
  return html.div({
    className: isModelDark ? 'webview webview-is-dark' : 'webview',
    style: Style(
      style.webview,
      model.isSelected
        ? transition.select(model.animation)
        : transition.unselect(model.animation)
    )
  }, [
    viewFrame(model, address),
    html.div({
      className: 'webview-topbar',
      style: Style(
        style.topbar,
        model.page.pallet.background && {backgroundColor: model.page.pallet.background}
      )
    }, [
      html.div({
        className: 'webview-combobox',
        style: Style(
          style.combobox,
          isModelDark ? style.darkText : style.lightText
        ),
        onClick: on(address, always(Edit))
      }, [
        html.span({
          className: 'webview-search-icon',
          style: style.iconSearch
        }, ['']),
        html.div({
          className: 'webview-title-container',
          style: style.titleContainer
        }, [
          html.span({
            className: 'webview-security-icon',
            style: model.security.secure ?
              style.iconSecure : style.iconInsecure
          }, ['']),
          html.span({
            className: 'webview-title'
          }, [
            // @TODO localize this string
            readTitle(model, 'Untitled')
          ])
        ])
      ]),
      html.div({
        className: 'webview-show-tabs-icon',
        style: Style(
          style.iconShowTabs,
          isModelDark && style.iconShowTabsDark
        ),
        onClick: on(address, always(RequestShowTabs))
      })
    ]),
    Progress.view(model.progress, address),
    html.div({
      className: 'global-create-tab-icon',
      style: Style(
        style.iconCreateTab,
        isModelDark && style.iconCreateTabDark
      ),
      onClick: () => address(Create)
    }, [''])
  ]);
};


const decodeClose = always(Close);


const decodeOpenWindow = ({detail}) => {
  Driver.element.use(detail.frameElement);
  return {
    type: "WebViews.Open!WithMyIFrameAndInTheCurrentTick",
    inBackground: false,
    uri: detail.uri,
    name: detail.name,
    features: detail.features
  };
};

const decodeOpenTab = ({detail}) => {
  Driver.element.use(detail.frameElement);
  return {
    type: "WebViews.Open!WithMyIFrameAndInTheCurrentTick",
    inBackground: true,
    uri: detail.uri,
    name: detail.name,
    features: detail.features
  };
};

// TODO: Figure out what's in detail
const decodeContexMenu = ({detail}) =>
  ({type: "WebView.ContextMenu", detail});

// TODO: Figure out what's in detail
const decodeShowModalPrompt = ({detail}) =>
  ({type: "WebView.ModalPrompt", detail});

// TODO: Figure out what's in detail
const decodeAuthenticate = ({detail}) =>
  ({type: "WebView.Authentificate", detail});

// TODO: Figure out what's in detail
const decodeError = ({detail}) =>
  ({type: "WebView.Failure", detail});

// Shell

const decodeFocus = always(Shell.Focus);
const decodeBlur = always(Shell.Blur);

// Navigation

const decodeLocationChange = ({detail: uri, timeStamp}) =>
  ({type: "WebView.LocationChanged", uri, timeStamp: performance.now()});

// Progress

// @TODO This is not ideal & we should probably convert passed `timeStamp` to
// the same format as `performance.now()` so that time passed through animation
// frames is in the same format, but for now we just call `performance.now()`.

const decodeLoadStart = ({timeStamp}) =>
  Progress.asStart(performance.now());

const decodeProgressChange = ({timeStamp}) =>
  Progress.asChange(performance.now());

const decodeLoadEnd = ({timeStamp}) =>
  Progress.asEnd(performance.now());

// Page

const decodeFirstPaint = always(Page.FirstPaint);
const decodeDocumentFirstPaint = always(Page.DocumentFirstPaint);

const decodeTitleChange = ({detail: title}) =>
  Page.asTitleChanged(title);

const decodeIconChange = ({target, detail: icon}) =>
  Page.asIconChanged(icon);

const decodeMetaChange = ({detail: {content, name}}) =>
  Page.asMetaChanged(name, content);

// TODO: Figure out what's in detail
const decodeAsyncScroll = ({detail}) =>
  Page.asScrolled(detail);

const decodeScrollAreaChange = ({detail, target}) =>
  Page.asOverflowChanged(detail.height > target.parentNode.clientHeight);

const decodeSecurityChange = ({detail}) =>
  Security.asChanged(detail.state, detail.extendedValidation);
