/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward} from 'reflex';
import {merge, always, batch} from '../common/prelude';
import {cursor} from '../common/cursor';
import {compose} from '../lang/functional';
import {on} from '@driver';
import {isElectron} from "../common/runtime";
import * as Shell from './web-view/shell';
import * as Progress from './web-view/progress';
import * as Navigation from './web-view/navigation';
import * as Security from './web-view/security';
import * as Page from './web-view/page';
import * as Tab from './sidebar/tab';
import * as Unknown from '../common/unknown';
import * as Stopwatch from '../common/stopwatch';
import {Style, StyleSheet} from '../common/style';
import {readTitle, isDark, canGoBack} from './web-view/util';
import * as Driver from '@driver';
import * as URL from '../common/url-helper';
import * as Focusable from '../common/focusable';
import * as Easing from 'eased';
import * as MozBrowserFrame from './web-view/moz-browser-frame';
import * as ElectronFrame from './web-view/electron-frame';


/*::
import type {Address, DOM} from "reflex"
import type {ID, URI, Time, Display, Options, Model, Action} from "./web-view"
import {performance} from "../common/performance"
*/

const NoOp = always({ type: "NoOp" });
export const Select/*:Action*/ =
  { type: "Select"
  };

export const Unselect/*:Action*/ =
  { type: "Unselect"
  };

export const Selected/*:Action*/ =
  { type: "Selected"
  };

export const Unselected/*:Action*/ =
  { type: "Unselected"
  };

export const Activate/*:Action*/ =
  { type: "Activate"
  };

export const Activated/*:Action*/ =
  { type: "Activated"
  };

export const Deactivate/*:Action*/ =
  { type: "Deactivate"
  };

export const Deactivated/*:Action*/ =
  { type: "Deactivated"
  };

export const Close/*:Action*/ =
  { type: "Close"
  };

export const Closed/*:Action*/ =
  { type: "Closed"
  };

export const Edit/*:Action*/ =
  { type: "Edit"
  };

export const ShowTabs/*:Action*/ =
  { type: 'ShowTabs'
  };

export const Create/*:Action*/ =
  { type: 'Create'
  };

export const Focus/*:Action*/ =
  { type: 'Focus'
  };

export const PushDown/*:Action*/ =
  { type: 'PushDown'
  };

export const PushedDown/*:Action*/ =
  { type: 'PushedDown'
  };

export const Load =
  (uri/*:URI*/)/*:Action*/ =>
  ( { type: 'Load'
    , uri
    }
  );


const ShellAction = action =>
  ( { type: 'Shell'
    , shell: action
    }
  );

export const ZoomIn/*:Action*/ = ShellAction(Shell.ZoomIn);
export const ZoomOut/*:Action*/ = ShellAction(Shell.ZoomOut);
export const ResetZoom/*:Action*/ = ShellAction(Shell.ResetZoom);
export const MakeVisible/*:Action*/ =
  ShellAction(Shell.MakeVisible);
export const MakeNotVisible/*:Action*/ =
  ShellAction(Shell.MakeNotVisible);

const NavigationAction = action =>
  ( { type: 'Navigation'
    , navigation: action
  });

export const Stop/*:Action*/ =
  NavigationAction(Navigation.Stop);
export const Reload/*:Action*/ =
  NavigationAction(Navigation.Reload);
export const GoBack/*:Action*/ =
  NavigationAction(Navigation.GoBack);
export const GoForward/*:Action*/ =
  NavigationAction(Navigation.GoForward);

const SecurityAction = action =>
  ( { type: 'Security'
    , security: action
    }
  );

const SecurityChanged =
  compose
  ( SecurityAction
  , Security.Changed
  );


const PageAction = action =>
  ({type: "Page", page: action});

const FirstPaint = PageAction(Page.FirstPaint);
const DocumentFirstPaint = PageAction(Page.DocumentFirstPaint);
const TitleChanged =
  compose
  ( PageAction
  , Page.TitleChanged
  );
const IconChanged =
  compose
  ( PageAction
  , Page.IconChanged
  );
const MetaChanged =
  compose
  ( PageAction
  , Page.MetaChanged
  );
const Scrolled =
  compose
  ( PageAction
  , Page.Scrolled
  );
const OverflowChanged =
  compose
  ( PageAction
  , Page.OverflowChanged
  );

const TabAction = action => {
    switch (action.type) {
      case "Close":
        return Close;
      case "Select":
        return Select;
      case "Activate":
        return Activate;
      default:
        return {
          type: "Tab"
          , source: action
        };
    }
  };

const ProgressAction =
  action =>
  ( { type: "Progress"
    , progress: action
    }
  );

const SelectAnimationAction = action =>
  ( action.type === "End"
  ? Selected
  : { type: "SelectAnimation"
    , action
    }
  );

const updateProgress = cursor
  ( { get: model => model.progress
    , set: (model, progress) => merge(model, {progress})
    , tag: ProgressAction
    , update: Progress.update
    }
  );


const updatePage = cursor
  ( { get: model => model.page
    , set: (model, page) => merge(model, {page})
    , tag: PageAction
    , update: Page.update
    }
  );

const updateTab = cursor
  ( { get: model => model.tab
    , set: (model, tab) => merge(model, {tab})
    , tag: TabAction
    , update: Tab.update
    }
  );

const updateShell = cursor
  ( { get: model => model.shell
    , set: (model, shell) => merge(model, {shell})
    , tag: ShellAction
    , update: Shell.update
    }
  );

const updateSecurity = cursor
  ( { get: model => model.security
    , set: (model, security) => merge(model, {security})
    , tag: SecurityAction
    , update: Security.update
    })

const updateNavigation = cursor
  ( { get: model => model.navigation
    , set: (model, navigation) => merge(model, {navigation})
    , tag: NavigationAction
    , update: Navigation.update
    }
  );

const updateSelectAnimation = (model, action) => {
  const [animation, fx] = Stopwatch.update(model.animation, action);
  const [begin, end, duration] = [0, 1, 200];

  const output =
    ( (animation != null && duration > animation.elapsed)
    ? [ merge
        ( model
        , { animation
          , display:
            { opacity:
              Easing.ease
              ( Easing.easeOutCubic
              , Easing.float
              , begin
              , end
              , duration
              , animation.elapsed
              )
            }
          }
        )
      , fx.map(SelectAnimationAction)
      ]
    : [ merge(model, {animation: null, display: {opacity: end} })
      , Effects
        .receive(Stopwatch.End)
        .map(SelectAnimationAction)
      ]
    )

  return output
};

export const init =
  (id/*:ID*/, options/*:Options*/)/*:[Model, Effects<Action>]*/ => {
  const [shell, shellFx] = Shell.init(id, options.disposition !== 'background-tab');
  const [navigation, navigationFx] = Navigation.init(id, options.uri);
  const [page, pageFx] = Page.init(options.uri);
  const [security, securityFx] = Security.init();
  const [progress, progressFx] = Progress.init();
  const [animation, animationFx] = Stopwatch.init();
  const [tab, tabFx] = Tab.init();

  return [
    { id
    , guestInstanceId: options.guestInstanceId
    , name: options.name
    , features: options.name
    , isSelected: false
    , isActive: false
    , display:
      { opacity:
          ( options.disposition === "background-tab"
          ? 0
          : 1
          )
      }
    , shell
    , security
    , navigation
    , page
    , tab
    , progress
    , animation
    }
  , Effects.batch
    ( [ shellFx.map(ShellAction)
      , pageFx.map(PageAction)
      , tabFx.map(TabAction)
      , securityFx.map(SecurityAction)
      , navigationFx.map(NavigationAction)
      , progressFx.map(ProgressAction)
      , animationFx.map(SelectAnimationAction)
      , ( options.disposition === "background-tab"
        ? Effects.none
        : Effects.receive(Activate)
        )
      , ( options.ref != null
        ? Effects.task
          ( Driver.forceReplace
            ( `#web-view-${id}`
            , options.ref
            )
          )
          .map(NoOp)
        : Effects.none
        )
      ]
    )
  ]
};

const startSelectAnimation = model => {
  const [animation, fx] = Stopwatch.update(model.animation, Stopwatch.Start);
  return (
    [ merge(model, {animation})
    , fx.map(SelectAnimationAction)
    ]
  );
}

const select = model =>
  ( model.isSelected
  ? [ model, Effects.none ]
  : startSelectAnimation(merge(model, {isSelected: true}))
  );

const selected = model =>
  [ model
  , Effects.receive(Selected)
  ];

const unselect = model =>
  ( model.isSelected
  ? [ merge
      ( model
      , { isSelected: false
        , display: {opacity: 1}
        }
      )
    , Effects.none
    ]
  : [ model, Effects.none ]
  );

const unselected = model =>
  [ model
  , Effects.receive(Unselected)
  ];

const activate = model =>
  ( model.isActive
  ? [ model, Effects.none ]
  : [ merge(model, {isActive: true, isSelected: true})
    , Effects.receive(Activated)
    ]
  );

const activated = model =>
  updateShell(model, Shell.Focus);

const deactivate = model =>
  ( model.isActive
  ? [ merge(model, {isActive: false})
    , Effects.receive(Deactivated)
    ]
  : [ model, Effects.none ]
  );

const deactivated = model =>
  [ model, Effects.none ];

const focus = model =>
  ( model.isActive
  ? updateShell(model, Shell.Focus)
  : activate(model)
  );

const load = (model, uri) =>
  updateNavigation(model, Navigation.Load(uri));


const startLoad = (model, time) =>
  batch
  ( update
  , model
  , [ ProgressAction(Progress.Start(time))
    , PageAction(Page.LoadStart)
    , SecurityAction(Security.LoadStart)
    ]
  );

const endLoad = (model, time) =>
  batch
  ( update
  , model
  , [ ProgressAction(Progress.LoadEnd(time))
    , PageAction(Page.LoadEnd)
    ]
  );

const connect = (model, time) =>
  batch
  ( update
  , model
  , [ ProgressAction(Progress.Connect(time))
    ]
  );

const changeLocation = (model, uri, canGoBack, canGoForward) =>
  batch
  ( update
  , model
  , [ NavigationAction(Navigation.LocationChanged(uri, canGoBack, canGoForward))
    , PageAction(Page.LocationChanged(uri))
    ]
  );

const close = model =>
  [ model, Effects.receive(Closed) ];

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "NoOp":
        return [ model, Effects.none ];
      case "Select":
        return select(model);
      case "Selected":
        return [ model, Effects.none ];
      case "Unselect":
        return unselect(model);
      case "Unselected":
        return [ model, Effects.none ];
      case "Activate":
        return activate(model);
      case "Activated":
        return activated(model);
      case "Deactivate":
        return deactivate(model);
      case "Deactivated":
        return deactivated(model);
      case "Focus":
        return focus(model);
      case "Blur":
        return updateShell(model, action);
      case "Load":
        return load(model, action.uri);

  // Dispatch
      case "LoadStart":
        return startLoad(model, action.time);
      case "LoadEnd":
        return endLoad(model, action.time);
      case "Connect":
        return connect(model, action.time);
      case "LocationChanged":
        return changeLocation(model, action.uri, action.canGoBack, action.canGoForward);
      case "SecurityChanged":
        return updateSecurity(model, action);
      case "TitleChanged":
        return updatePage(model, action);
      case "IconChanged":
        return updatePage(model, action);
      case "MetaChanged":
        return updatePage(model, action);
      case "FirstPaint":
        return updatePage(model, action);
      case "DocumentFirstPaint":
        return updatePage(model, action);
      case "LoadFail":
        return [ model
          , Effects.task(Unknown.warn(action))
            .map(NoOp)
          ];
      case "Close":
        return close(model);

  // Force push actions.
  // We forward these up to WebViews.
      case "PushDown":
        return [ model, Effects.receive(PushedDown) ];

  // Animation
      case "SelectAnimation":
        return updateSelectAnimation(model, action.action);

  // Delegate
      case "Progress":
        return updateProgress(model, action.progress);
      case "Shell":
        return updateShell(model, action.shell);
      case "Page":
        return updatePage(model, action.page);
      case "Tab":
        return updateTab(model, action.source);
      case "Security":
        return updateSecurity(model, action.security);
      case "Navigation":
        return updateNavigation(model, action.navigation);
      default:
        return Unknown.update(model, action);
    }
  };

const topBarHeight = '27px';
const comboboxHeight = '21px';
const comboboxWidth = '250px';

const styleSheet = StyleSheet.create({
  webview: {
    position: 'absolute', // to stack webview on top of each other
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    mozUserSelect: 'none',
    cursor: 'default',
    zIndex: 2
  },

  webviewActive: {

  },

  webviewSelected: {
    zIndex: 3
  },

  webviewInactive: {
    pointerEvents: 'none',
    zIndex: 1
  },

  base: {
    position: 'absolute',
    top: topBarHeight,
    left: 0,
    width: '100%',
    height: `calc(100% - ${topBarHeight})`,
    mozUserSelect: 'none', // necessary to pass text drag to iframe's content
    borderWidth: 0,
    backgroundColor: 'white',
    MozWindowDragging: 'no-drag',
    WebkitAppRegion: 'no-drag',
    display: 'block',
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
    WebkitAppRegion: 'no-drag',
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
    fontSize: '13px',
    position: 'absolute',
    top: 0,
    left: 0,
    paddingLeft: '30px',
    paddingRight: '30px',
    width: 'calc(100% - 60px)',
    textAlign: 'center',
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
    WebkitAppRegion: 'no-drag',
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

  iconShowTabsBright: null,

  iconCreateTab: {
    MozWindowDragging: 'no-drag',
    WebkitAppRegion: 'no-drag',
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
  },

  iconCreateTabBright: null,

  iconBack: {
    MozWindowDragging: 'no-drag',
    color: 'rgba(0,0,0,0.8)',
    fontFamily: 'FontAwesome',
    fontSize: '18px',
    lineHeight: '32px',
    position: 'absolute',
    textAlign: 'center',
    bottom: 0,
    left: 0,
    width: '30px',
    height: '32px',
  },

  iconBackDark: {
    color: 'rgba(255,255,255,0.8)',
  },

  iconBackBright: null,

  iconBackShow: null,

  iconBackHide: {
    display: 'none'
  }
});

const Frame =
  ( isElectron
  ? ElectronFrame
  : MozBrowserFrame
  );

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ => {
  const isModelDark = isDark(model);
  return html.div
  ( { className:
      ( isModelDark
      ? `webview webview-is-dark web-view-${model.id}`
      : `webview web-view-${model.id}`
      )
    , style: Style
      ( styleSheet.webview
      , ( model.isActive
        ? styleSheet.webviewActive
        : model.isSelected
        ? styleSheet.webviewSelected
        : styleSheet.webviewInactive
        )
      , model.display
      )
    , onServoMouseForceDown: on(address, always(PushDown))
    }
  , [ Frame.view(styleSheet, model, address)
    , html.div
      ( { className: 'webview-topbar'
        , style: Style
          ( styleSheet.topbar
          , ( model.page.pallet.background != null
            ? { backgroundColor: model.page.pallet.background }
            : null
            )
          )
        }
      , [ html.div
          ( { className: 'webview-combobox'
            , style: Style
              ( styleSheet.combobox
              , ( isModelDark
                ? styleSheet.darkText
                : styleSheet.lightText
                )
              )
            , onClick: forward(address, always(Edit))
            }
          , [ html.span
              ( { className: 'webview-search-icon'
                , style: styleSheet.iconSearch
                }
              , ['']
              )
            , html.div
              ( { className: 'webview-title-container'
                , style: styleSheet.titleContainer
                }
              , [ html.span
                  ( { className: 'webview-security-icon'
                    , style:
                      ( model.security.secure
                      ? styleSheet.iconSecure
                      : styleSheet.iconInsecure
                      )
                    }
                  , ['']
                  )
                , html.span
                  ( { className: 'webview-title' }
                  // @TODO localize this string
                  , [ readTitle(model, 'Untitled') ]
                  )
                ]
              )
            ]
          )
        , html.div
          ( { className: 'webview-show-tabs-icon'
            , style:
                Style
                ( styleSheet.iconShowTabs
                , ( isModelDark
                  ? styleSheet.iconShowTabsDark
                  : styleSheet.iconShowTabsBright
                  )
                )
            , onClick: forward(address, always(ShowTabs))
            }
          )
        ]
      )
    , Progress.view(model.progress, address)
    , html.div
      ( { className: 'webview-tab-icon'
        , style:
            Style
            ( styleSheet.iconCreateTab
            , ( isModelDark
              ? styleSheet.iconCreateTabDark
              : styleSheet.iconCreateTabBright
              )
            )
        , onClick: forward(address, always(Create))
        }
      , ['']
      )
    , html.div
      ( { className: 'webview-back-icon'
        , style:
            Style
            ( styleSheet.iconBack
            , ( isModelDark
              ? styleSheet.iconBackDark
              : styleSheet.iconBackBright
              )
            , ( canGoBack(model)
              ? styleSheet.iconBackShow
              : styleSheet.iconBackHide
              )
            )
        , onClick: forward(address, always(GoBack))
        }
      , ['']
      )
    ]
  );
};
