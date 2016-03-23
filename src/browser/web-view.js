/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/web-view" */

import {Effects, html, forward} from 'reflex';
import {merge, always, batch, tag, tagged} from '../common/prelude';
import {cursor} from '../common/cursor';
import {compose} from '../lang/functional';
import {on} from 'driver';
import * as Shell from './web-view/shell';
import * as Progress from './web-view/progress';
import * as Navigation from './web-view/navigation';
import * as Security from './web-view/security';
import * as Page from './web-view/page';
import * as Tab from './sidebar/tab';
import * as Input from "./input";
import * as Overlay from './overlay';
import * as Assistant from "./assistant";
import * as Unknown from '../common/unknown';
import * as Stopwatch from '../common/stopwatch';
import {Style, StyleSheet} from '../common/style';
import {readTitle, isDark} from './web-view/util';
import * as Driver from 'driver';
import * as URI from '../common/url-helper';
import * as Focusable from '../common/focusable';
import * as Easing from 'eased';

/* import * as type from "../../type/browser/web-view" */

export const Select/*:type.Select*/ =
  { type: "Select"
  };

export const Unselect/*:type.Unselect*/ =
  { type: "Unselect"
  };

export const Selected/*:type.Selected*/ =
  { type: "Selected"
  };

export const Unselected/*:type.Unselected*/ =
  { type: "Unselected"
  };

export const Activate/*:type.Activate*/ =
  { type: "Activate"
  };

export const Activated/*:type.Activated*/ =
  { type: "Activated"
  };

export const Deactivate/*:type.Deactivate*/ =
  { type: "Deactivate"
  };

export const Deactivated/*:type.Deactivated*/ =
  { type: "Deactivated"
  };

export const Close/*:type.Close*/ =
  { type: "Close"
  };

export const Closed/*:type.Closed*/ =
  { type: "Closed"
  };

export const Edit/*:type.Edit*/ =
  { type: "Edit"
  };

export const ShowTabs/*:type.ShowTabs*/ =
  { type: 'ShowTabs'
  };

export const Create/*:type.Create*/ =
  { type: 'Create'
  };

export const Focus/*:type.Focus*/ =
  { type: 'Focus'
  };

export const Load/*:type.Load*/ = uri =>
  ( { type: 'Load'
    , uri
    }
  );

export const OpenSyncWithMyIFrame/*:type.OpenSyncWithMyIFrame*/ =
  ({frameElement, uri, name, features}) => {
    Driver.element.use(frameElement);
    return {
      type: "Open!WithMyIFrameAndInTheCurrentTick"
    , isForced: true
    , options: {uri, name, features, inBackground: false}
    };
  };

export const ModalPrompt/*:type.ModalPrompt*/ = detail =>
  ({type: "ModalPrompt", detail});

export const Authentificate/*:type.Authentificate*/ = detail =>
  ({type: "Authentificate", detail});

export const ReportError/*:type.ReportError*/ = detail =>
  ({type: "Error", detail});

export const LoadStart/*:type.LoadStart*/ = time =>
  ({type: 'LoadStart', time});

export const LoadEnd/*:type.LoadEnd*/ = time =>
  ({type: 'LoadEnd', time});

export const LocationChanged/*:type.LocationChanged*/ = (uri, time) =>
  ({type: 'LocationChanged', uri, time});

export const ContextMenu/*:type.ContextMenu*/ = detail =>
  ({type: "ContextMenu", detail});

export const OverlayClicked/*:type.OverlayClicked*/ =
  { type: "OverlayClicked"
  };

export const SubmitInput/*:type.SubmitInput*/ =
  { type: 'SubmitInput'
  };

export const ExitInput/*:type.ExitInput*/ =
  { type: 'ExitInput'
  , source: Input.Abort
  };

const Query = tag('Query');

export const InputAction = action =>
  ( action.type === 'Submit'
  ? SubmitInput
  : action.type === 'Abort'
  ? ExitInput
  : action.type === 'Query'
  ? Query(action.source)
  : action.type === 'SuggestNext'
  ? SuggestNext
  : action.type === 'SuggestPrevious'
  ? SuggestPrevious
  : tagged('Input', action)
  );

const ShowInput = InputAction(Input.Show);
const HideInput = InputAction(Input.Hide);
const EnterInput = InputAction(Input.Enter);
const EnterInputSelection = compose(InputAction, Input.EnterSelection);
export const FocusInput = InputAction(Input.Focus);

export const AssistantAction =
  action =>
  ( action.type === 'Suggest'
  ? Suggest(action.source)
  : tagged('Assistant', action)
  );

const OpenAssistant = AssistantAction(Assistant.Open);
const CloseAssistant = AssistantAction(Assistant.Close);
const QueryAssistant = compose(AssistantAction, Assistant.Query);

export const OverlayAction = action =>
  ( action.type === "Click"
  ? OverlayClicked
  : { type: "Overlay"
    , action
    }
  );

const HideOverlay = OverlayAction(Overlay.Hide);
const ShowOverlay = OverlayAction(Overlay.Show);

const ShellAction = action =>
  ({type: 'Shell', action});

const FocusShell = ShellAction(Shell.Focus);
const BlurShell = ShellAction(Shell.Blur);

export const ZoomIn/*:type.ZoomIn*/ = ShellAction(Shell.ZoomIn);
export const ZoomOut/*:type.ZoomOut*/ = ShellAction(Shell.ZoomOut);
export const ResetZoom/*:type.ResetZoom*/ = ShellAction(Shell.ResetZoom);
export const MakeVisibile/*:type.MakeVisibile*/ =
  ShellAction(Shell.MakeVisibile);
export const MakeNotVisible/*:type.MakeNotVisible*/ =
  ShellAction(Shell.MakeNotVisible);

const NavigationAction = action =>
  ( {type: 'Navigation'
    , action
  });

export const Stop/*:type.Stop*/ =
  NavigationAction(Navigation.Stop);
export const Reload/*:type.Reload*/ =
  NavigationAction(Navigation.Reload);
export const GoBack/*:type.GoBack*/ =
  NavigationAction(Navigation.GoBack);
export const GoForward/*:type.GoForward*/ =
  NavigationAction(Navigation.GoForward);

const SecurityAction = action =>
  ({type: 'Security', action});

const SecurityChanged =
  compose
  ( SecurityAction
  , Security.Changed
  );


const PageAction = action =>
  ({type: "Page", action});

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

const TabAction = action =>
  ( action.type === "Close"
  ? Close
  : action.type === "Select"
  ? Select
  : action.type === "Activate"
  ? Activate
  : { type: "Tab"
    , source: action
    }
  );

export const SuggestNext = tagged('SuggestNext');
export const SuggestPrevious = tagged('SuggestPrevious');
export const Suggest = tag('Suggest');

const updateAssistant = cursor({
  get: model => model.assistant,
  set: (model, assistant) => merge(model, {assistant}),
  update: Assistant.update,
  tag: AssistantAction
});

const updateOverlay = cursor({
  get: model => model.overlay,
  set: (model, overlay) => merge(model, {overlay}),
  tag: OverlayAction,
  update: Overlay.update
});

const updateInput = cursor({
  get: model => model.input,
  set: (model, input) => merge(model, {input}),
  update: Input.update,
  tag: InputAction
});

const ProgressAction/*type.ProgressAction*/ = action =>
  ({type: "Progress", action});

const AnimationAction =
  End =>
  action =>
  ( action.type === "End"
  ? End
  : { type: "Animation", action }
  );

const SelectAnimationAction = action =>
  ( action.type === "End"
  ? Selected
  : { type: "SelectAnimation"
    , action
    }
  );

const submitInput = model =>
  batch
  ( update
  , model
  , [ NavigateTo(URI.read(model.input.value))
    , ShowWebView
    ]
  );

const exitInput = model =>
  batch
  ( update
  , model
  , [ CloseAssistant
    , Focus
    ]
  );

const updateProgress = cursor
  ( { get: model => model.progress
    , set: (model, progress) => merge(model, {progress})
    , tag: ProgressAction
    , update: (model, action) =>
        Progress.update
        ( model
        , ( action.type === "LoadStart"
          ? Progress.Start(action.time)
          : action.type === "LoadEnd"
          ? Progress.LoadEnd(action.time)
          : action
          )
        )
    }
  );


const updatePage = cursor
  ( { get: model => model.page
    , set: (model, page) => merge(model, {page})
    , tag: PageAction
    , update: (model, action) =>
        Page.update
        ( model
        , ( action.type === "LoadStart"
          ? Page.LoadStart
          : action.type === "LoadEnd"
          ? Page.LoadEnd
          : action
          )
        )
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

const updateQuery =
  (model, action) =>
  updateAssistant
  ( model
  , Assistant.Query(model.input.value)
  );

const updateStopwatch = cursor
  ( { get: model => model.animation
    , set: (model, animation) => merge(model, {animation})
    , tag: AnimationAction
    , update: Stopwatch.update
    }
  );

const updateSelectAnimation = (model, action) => {
  const [animation, fx] = Stopwatch.update(model.animation, action);
  const [begin, end, duration] = [0, 1, 200];

  return (duration > animation.elapsed
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
};

export const init/*:type.init*/ = (id, options) => {
  const [shell, shellFx] = Shell.init(id, !options.inBackground);
  const [navigation, navigationFx] = Navigation.init(id, options.uri);
  const [page, pageFx] = Page.init(options.uri);
  const [security, securityFx] = Security.init();
  const [progress, progressFx] = Progress.init();
  const [animation, animationFx] = Stopwatch.init();
  const [tab, tabFx] = Tab.init();
  const [input, inputFx] = Input.init(false, false, "");
  const [assistant, assistantFx] = Assistant.init();
  const [overlay, overlayFx] = Overlay.init(true, true);

  return [
    { id
    , name: options.name
    , features: options.name
    , isSelected: false
    , isActive: false
    , isEditing: true
    , display:
      { opacity:
          ( options.inBackground
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
    , input
    , assistant
    , overlay
    , animation
    }
  , Effects.batch
    ( [ shellFx.map(ShellAction)
      , pageFx.map(PageAction)
      , tabFx.map(TabAction)
      , securityFx.map(SecurityAction)
      , navigationFx.map(NavigationAction)
      , progressFx.map(ProgressAction)
      , inputFx.map(InputAction)
      , assistantFx.map(AssistantAction)
      , overlayFx.map(OverlayAction)
      , animationFx.map(AnimationAction)
      , ( options.inBackground
        ? Effects.none
        : Effects.receive(Activate)
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

const changeLocation = (model, uri) =>
  batch
  ( update
  , model
  , [ NavigationAction(Navigation.LocationChanged(uri))
    , PageAction(Page.LocationChanged(uri))
    ]
  );

const close = model =>
  [ model, Effects.receive(Closed) ];

const showWebView = model =>
  batch
  ( update
  , merge(model, {isEditing: false})
  , [ HideInput
    , CloseAssistant
    , HideOverlay
    , Focus
    ]
  );

const editWebView = model =>
  batch
  ( update
  , merge(model, {isEditing: true})
  , [ ShowInput
    , OpenAssistant
    , ShowOverlay
    , EnterInputSelection(model.navigation.currentURI)
    ]
  );

export const update/*:type.update*/ = (model, action) =>
  ( action.type === "Select"
  ? select(model)
  : action.type === "Selected"
  ? [ model, Effects.none ]

  : action.type === 'EditWebView'
  ? editWebView(model)
  : action.type === 'ShowWebView'
  ? showWebView(model)

  : action.type === "Unselect"
  ? unselect(model)
  : action.type === "Unselected"
  ? [ model, Effects.none ]

  : action.type === "Activate"
  ? activate(model)
  : action.type === "Activated"
  ? activated(model)
  : action.type === "Deactivate"
  ? deactivate(model)
  : action.type === "Deactivated"
  ? deactivated(model)
  : action.type === "Focus"
  ? focus(model)

  : action.type === 'Load'
  ? load(model, action.uri)

  : action.type === 'OverlayClicked'
  ? showWebView(model)

  // If uri is submitted in create-web-view mode then
  // opne new web-view.
  : action.type === 'SubmitInput'
  ? submitInput(model)

  // Dispatch

  : action.type === "LoadStart"
  ? startLoad(model, action.time)

  : action.type === "LoadEnd"
  ? endLoad(model, action.time)

  : action.type === "Connect"
  ? connect(model, action.time)

  : action.type === "LocationChanged"
  ? changeLocation(model, action.uri)

  : action.type === "Close"
  ? close(model)

  : action.type === 'ExitInput'
  ? exitInput(model)

  : action.type === 'Suggest'
  ? updateInput
    ( model
    , Input.Suggest
      ( { query: model.assistant.query
        , match: action.source.match
        , hint: action.source.hint
        }
      )
    )

  // Shell Requests
  : action.type === "ZoomIn"
  ? updateShell(model, Shell.ZoomIn(model.id))
  : action.type === "ZoomOut"
  ? updateShell(model, Shell.ZoomOut(model.id))
  : action.type === "ResetZoom"
  ? updateShell(model, Shell.ResetZoom(model.id))

  // Animation
  : action.type === "SelectAnimation"
  ? updateSelectAnimation(model, action.action)

  // Delegate

  : action.type === 'Input'
  ? updateInput(model, action.source)

  : action.type === 'Overlay'
  ? updateOverlay(model, action.action)

  // Assistant
  : action.type === "Assistant"
  ? updateAssistant(model, action.source)
  : action.type === 'Query'
  ? updateQuery(model)
  : action.type === 'SuggestNext'
  ? updateAssistant(model, Assistant.SuggestNext)
  : action.type === 'SuggestPrevious'
  ? updateAssistant(model, Assistant.SuggestPrevious)

  : action.type === "Progress"
  ? updateProgress(model, action.action)
  : action.type === "Shell"
  ? updateShell(model, action.action)
  : action.type === "Page"
  ? updatePage(model, action.action)
  : action.type === "Tab"
  ? updateTab(model, action.source)
  : action.type === "Security"
  ? updateSecurity(model, action.action)
  : action.type === "Navigation"
  ? updateNavigation(model, action.action)

  : Unknown.update(model, action)
  );

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

  iconBackBright: null
});

const viewFrame = (model, address) =>
  html.iframe({
    id: `web-view-${model.id}`,
    src: model.navigation.initiatedURI,
    'data-current-uri': model.navigation.currentURI,
    'data-name': model.name,
    'data-features': model.features,
    element: Driver.element,
    style: Style(styleSheet.iframe
                , ( model.page.pallet.background != null
                  ? { backgroundColor: model.page.pallet.background }
                  : null
                  )
                ),
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

    onBlur: on(address, always(BlurShell)),
    onFocus: on(address, always(FocusShell)),
    // onMozbrowserAsyncScroll: on(address, decodeAsyncScroll),
    onMozBrowserClose: on(address, always(Close)),
    onMozBrowserOpenWindow: on(address, decodeOpenWindow),
    onMozBrowserOpenTab: on(address, decodeOpenTab),
    onMozBrowserContextMenu: on(address, decodeContexMenu),
    onMozBrowserError: on(address, decodeError),
    onMozBrowserLoadStart: on(address, decodeLoadStart),
    onMozBrowserConnected: on(address, decodeConnected),
    onMozBrowserLoadEnd: on(address, decodeLoadEnd),
    onMozBrowserFirstPaint: on(address, decodeFirstPaint),
    onMozBrowserDocumentFirstPaint: on(address, decodeDocumentFirstPaint),
    onMozBrowserMetaChange: on(address, decodeMetaChange),
    onMozBrowserIconChange: on(address, decodeIconChange),
    onMozBrowserLocationChange: on(address, decodeLocationChange),
    onMozBrowserSecurityChange: on(address, decodeSecurityChange),
    onMozBrowserTitleChange: on(address, decodeTitleChange),
    onMozBrowserShowModalPrompt: on(address, decodeModalPrompt),
    onMozBrowserUserNameAndPasswordRequired: on(address, decodeAuthenticate),
    onMozBrowserScrollAreaChanged: on(address, decodeScrollAreaChange),
  });

export const view/*:type.view*/ = (model, address) => {
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
    }
  , [ viewFrame(model, address)
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
      ( { className: 'global-create-tab-icon'
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
      ( { className: 'global-create-tab-icon'
        , style:
            Style
            ( styleSheet.iconBack
            , ( isModelDark
              ? styleSheet.iconBackDark
              : styleSheet.iconBackBright
              )
            )
        , onClick: forward(address, always(GoBack))
        }
      , ['']
      )
    ]
  );
};


const decodeClose = always(Close);

// TODO: Figure out what's in detail
const decodeDetail = ({detail}) => detail;
const decodeTime = ({detail}) => performance.now();

// Detail is different in each case, so we define a special reader function
// for this particular case.
const decodeOpenDetail = ({detail}) =>
  ( { frameElement: detail.frameElement
    // Change url to uri for naming consistency.
    , uri: detail.url
    , name: detail.name
    , features: detail.features
    }
  );

const decodeOpenWindow = compose(OpenSyncWithMyIFrame, decodeOpenDetail);
const decodeOpenTab = compose(OpenSyncWithMyIFrame, decodeOpenDetail);


const decodeContexMenu = compose(ContextMenu, decodeDetail);

// TODO: Figure out what's in detail
const decodeModalPrompt = compose(ModalPrompt, decodeDetail);

// TODO: Figure out what's in detail
const decodeAuthenticate = compose(Authentificate, decodeDetail);

// TODO: Figure out what's in detail
const decodeError = compose(ReportError, decodeDetail);

// Navigation

const decodeLocationChange = ({detail}) => {
  var uri;
  // Servo and Gecko have different implementation of detail.
  // In Gecko, detail is a string (the uri).
  // In Servo, detail is an object {uri,canGoBack,canGoForward}
  if (typeof detail == 'string') {
    uri = detail;
  } else {
    uri = detail.uri;
  }
  return LocationChanged(uri, performance.now());
}

// Progress

// @TODO This is not ideal & we should probably convert passed `timeStamp` to
// the same format as `performance.now()` so that time passed through animation
// frames is in the same format, but for now we just call `performance.now()`.

const decodeLoadStart = compose(LoadStart, decodeTime);

const decodeConnected = compose(Progress.Connect, decodeTime);

const decodeLoadEnd = compose(LoadEnd, decodeTime);

// Page

const decodeFirstPaint = always(FirstPaint);
const decodeDocumentFirstPaint = always(DocumentFirstPaint);
const decodeTitleChange = compose(TitleChanged, decodeDetail);
const decodeIconChange = compose(IconChanged, decodeDetail);

const decodeMetaChange = ({detail: {name, content}}) =>
  MetaChanged(name, content);

// TODO: Figure out what's in detail
const decodeAsyncScroll = ({detail}) =>
  Scrolled(detail);

const decodeScrollAreaChange = ({detail, target}) =>
  OverflowChanged(detail.height > target.parentNode.clientHeight);

const decodeSecurityChange =
  ({detail: {state, extendedValidation}}) =>
  SecurityChanged(state, extendedValidation);
