/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {version} from "../package.json";
import * as Config from "../browserhtml.json";
import {Effects, html, forward, thunk} from "reflex";

import * as Shell from "./browser/shell";
import * as Input from "./browser/input";
import * as Assistant from "./browser/assistant";
import * as Sidebar from './browser/sidebar';
import * as WebViews from "./browser/web-views";
import * as Overlay from './browser/overlay';

import * as Devtools from "./common/devtools";
import * as Runtime from "./common/runtime";
import * as URL from './common/url-helper';
import * as Unknown from "./common/unknown";
import * as Focusable from "./common/focusable";
import * as OS from './common/os';
import * as Keyboard from './common/keyboard';
import * as Stopwatch from "./common/stopwatch";
import * as Easing from "eased";
import * as Issue from "./common/issue-reporter";
import {merge, always, batch, tag, tagged} from "./common/prelude";
import {cursor} from "./common/cursor";
import {Style, StyleSheet} from './common/style';

import {identity, compose} from "./lang/functional";

import {onWindow} from "@driver";

/*::
import type {Address, DOM} from "reflex"
import type {URI} from "./common/prelude"
import type {Model, Action} from "./browser"
*/

export const init = ()/*:[Model, Effects<Action>]*/ => {
  const [devtools, devtoolsFx] = Devtools.init({isActive: Config.devtools});
  const [input, inputFx] = Input.init(false, false, "");
  const [shell, shellFx] = Shell.init();
  const [issue, issueFx] = Issue.init();
  const [webViews, webViewsFx] = WebViews.init();
  const [sidebar, sidebarFx] = Sidebar.init();
  const [assistant, assistantFx] = Assistant.init();
  const [overlay, overlayFx] = Overlay.init(false, false);

  const model =
    { version
    , mode: 'create-web-view'
    , shell
    , issue
    , input
    , assistant
    , webViews
    , sidebar
    , overlay
    , devtools
    , resizeAnimation: null

    , display: { rightOffset: 0 }
    , isExpanded: true
    };

  const fx =
    Effects.batch
    ( [ devtoolsFx.map(DevtoolsAction)
      , inputFx.map(InputAction)
      , shellFx.map(ShellAction)
      , issueFx.map(IssueAction)
      , webViewsFx.map(WebViewsAction)
      , sidebarFx.map(SidebarAction)
      , assistantFx.map(AssistantAction)
      , overlayFx.map(OverlayAction)
      , Effects.receive(CreateWebView)
      , Effects
        .perform(Runtime.receive('mozbrowseropenwindow'))
        .map(OpenURL)
      ]
    );

  return [model, fx];
}

const NoOp = always({ type: "NoOp" });

const SidebarAction = action =>
  ( action.type === "CreateWebView"
  ? CreateWebView
  : action.type === "ActivateTab"
  ? ActivateWebViewByID(action.id)
  : action.type === "CloseTab"
  ? CloseWebViewByID(action.id)
  : action.type === "Tabs"
  ? WebViewActionByID(action.source.id, action.source)
  : action.type === "Attach"
  ? AttachSidebar
  : action.type === "Detach"
  ? DetachSidebar
  : { type: "Sidebar"
    , action
    }
  );

const OverlayAction = action =>
  ( action.type === "Click"
  ? OverlayClicked
  : { type: "Overlay"
    , action
    }
  );


const InputAction = action =>
  ( action.type === 'Submit'
  ? SubmitInput
  : action.type === 'Abort'
  ? ExitInput
  : action.type === 'Blur'
  ? BlurInput
  : action.type === 'Query'
  ? Query
  : action.type === 'SuggestNext'
  ? SuggestNext
  : action.type === 'SuggestPrevious'
  ? SuggestPrevious
  : { type: 'Input'
    , source: action
    }
  );

const WebViewsAction = (action/*:WebViews.Action*/)/*:Action*/ =>
  ( action.type === "ShowTabs"
  ? ShowTabs
  : action.type === "Create"
  ? CreateWebView
  : action.type === "Crash"
  ? {
    type: "ReportWebviewCrash",
    source: action
  }
  : action.type === "Edit"
  ? EditWebView
  : action.type === "SelectRelative"
  ? { type: "SelectTab"
    , source: action
    }
    // Note: Flow type checker has some bug releated to union types where
    // use of the same properties across union types seem to confuse it.
    // avoiding same shapes (and calling source differently on each type)
    // seems to resolve the problem.
  : action.type === "ActivateSelected"
  ? { type: "ActivateTab"
    , activateTab: action
    }
  : action.type === "ActivateByID"
  ? { type: "ActivateTabByID"
    , activateTabByID: action
    }
  : { type: 'WebViews'
    , source: action
    }
  );

const ShellAction = action =>
  ( action.type === 'Focus'
  ? { type: 'Focus'
    , source: action
    }
  : { type: 'Shell'
    , source: action
    }
  );

const IssueAction = action =>
  ( action.type === "DismissReport"
   ? {
     type: "DismissReport",
   }
   : action.type === "FileReport"
   ? {
     type: "FileReport",
   }
   : { type: 'Issue'
     , action
    }
  )

const DevtoolsAction = action =>
  ( { type: 'Devtools'
    , action
    }
  );

const AssistantAction =
  action =>
  ( action.type === 'Suggest'
  ? Suggest(action.source)
  : { type: 'Assistant'
    , source: action
    }
  );

const updateInput = cursor({
  get: model => model.input,
  set: (model, input) => merge(model, {input}),
  update: Input.update,
  tag: InputAction
});

const updateWebViews = cursor({
  get: model => model.webViews,
  set: (model, webViews) => merge(model, {webViews}),
  update: WebViews.update,
  tag: WebViewsAction
});

const updateShell = cursor({
  get: model => model.shell,
  set: (model, shell) => merge(model, {shell}),
  update: Shell.update,
  tag: ShellAction
});

const updateDevtools = cursor({
  get: model => model.devtools,
  set: (model, devtools) => merge(model, {devtools}),
  update: Devtools.update,
  tag: DevtoolsAction
});

const updateAssistant = cursor({
  get: model => model.assistant,
  set: (model, assistant) => merge(model, {assistant}),
  update: Assistant.update,
  tag: AssistantAction
});

const updateSidebar = cursor({
  get: model => model.sidebar,
  set: (model, sidebar) => merge(model, {sidebar}),
  tag: SidebarAction,
  update: Sidebar.update
});

const updateOverlay = cursor({
  get: model => model.overlay,
  set: (model, overlay) => merge(model, {overlay}),
  tag: OverlayAction,
  update: Overlay.update
});

const updateIssue = cursor({
  get: model => model.issue,
  set: (model, issue) => merge(model, {issue}),
  update: Issue.update,
  tag: IssueAction
});

const Reloaded/*:Action*/ =
  { type: "Reloaded"
  };

const Failure = error =>
  ( { type: "Failure"
    , error: error
    }
  );


// ### Mode changes


export const CreateWebView/*:Action*/ =
  { type: 'CreateWebView'
  };

export const EditWebView/*:Action*/ =
  { type: 'EditWebView'
  };

export const ShowWebView/*:Action*/ =
  { type: 'ShowWebView'
  };

export const ShowTabs/*:Action*/ =
  { type: 'ShowTabs'
  };

export const SelectWebView/*:Action*/ =
  { type: 'SelectWebView'
  };

// ### Actions that affect multilpe sub-components

export const OpenWebView/*:Action*/ =
  { type: 'OpenWebView'
  };

export const AttachSidebar/*:Action*/ =
  { type: "AttachSidebar"
  , source: Sidebar.Attach
  };

export const DetachSidebar/*:Action*/ =
  { type: "DetachSidebar"
  , source: Sidebar.Detach
  };

export const OverlayClicked/*:Action*/ =
  { type: "OverlayClicked"
  };

export const SubmitInput/*:Action*/ =
  { type: 'SubmitInput'
  };

export const ExitInput/*:Action*/ =
  { type: 'ExitInput'
  , source: Input.Abort
  };

export const Escape/*:Action*/ =
  { type: 'Escape'
  };


export const Unload/*:Action*/ =
  { type: 'Unload'
  };

export const ReloadRuntime/*:Action*/ =
  { type: 'ReloadRuntime'
  };

export const BlurInput/*:Action*/ =
  { type: 'BlurInput'
  };

// ## Resize actions

export const SuggestNext/*:Action*/ = { type: "SuggestNext" };
export const SuggestPrevious/*:Action*/ = { type: "SuggestPrevious" };
export const Suggest = tag('Suggest');
export const Expand/*:Action*/ = {type: "Expand"};
export const Expanded/*:Action*/ = {type: "Expanded"};
export const Shrink/*:Action*/ = {type: "Shrink"};
export const Shrinked/*:Action*/ = {type: "Shrinked"};


// Following Browser actions directly delegate to a `WebViews` module, there for
// they are just tagged versions of `WebViews` actions, but that is Just an
// implementation detail.
export const ZoomIn = WebViewsAction(WebViews.ZoomIn);
export const ZoomOut = WebViewsAction(WebViews.ZoomOut);
export const ResetZoom = WebViewsAction(WebViews.ResetZoom);
export const Reload = WebViewsAction(WebViews.Reload);
export const CloseWebView = WebViewsAction(WebViews.CloseActive);
export const GoBack = WebViewsAction(WebViews.GoBack);
export const GoForward = WebViewsAction(WebViews.GoForward);
export const SelectNext = WebViewsAction(WebViews.SelectNext);
export const SelectPrevious = WebViewsAction(WebViews.SelectPrevious);
export const ActivateSeleted = WebViewsAction(WebViews.ActivateSelected);
export const FocusWebView = WebViewsAction(WebViews.Focus);
export const NavigateTo = compose(WebViewsAction, WebViews.NavigateTo);
const UnfoldWebViews = WebViewsAction(WebViews.Unfold);
const FoldWebViews = WebViewsAction(WebViews.Fold);
const Open = compose(WebViewsAction, WebViews.Open);
const ReceiveOpenURLNotification =
  { type: "ReceiveOpenURLNotification"
  };

const OpenURL = ({url}) =>
  ( { type: "OpenURL"
    , uri: url
    }
  );
const Query/*:Action*/ = { type: 'Query' };

export const ActivateWebViewByID =
  compose(WebViewsAction, WebViews.ActivateByID);
const WebViewActionByID =
  compose(WebViewsAction, WebViews.ActionByID);

const CloseWebViewByID =
  compose(WebViewsAction, WebViews.CloseByID);

// Following browser actions directly delegate to one of the existing modules
// there for we define them by just wrapping actions from that module to avoid
// additional wiring (which is implementation detail that may change).
export const ToggleDevtools = DevtoolsAction(Devtools.Toggle);
const PrintSnapshot = { type: "PrintSnapshot" };
const PublishSnapshot = { type: "PublishSnapshot" };
export const Blur = ShellAction(Shell.Blur);
export const Focus = ShellAction(Shell.Focus);


const ShowInput = InputAction(Input.Show);
const HideInput = InputAction(Input.Hide);
const EnterInput = InputAction(Input.Enter);
const EnterInputSelection = compose(InputAction, Input.EnterSelection);
export const FocusInput = InputAction(Input.Focus);

const OpenAssistant = AssistantAction(Assistant.Open);
const CloseAssistant = AssistantAction(Assistant.Close);
const ExpandAssistant = AssistantAction(Assistant.Expand);
const QueryAssistant = compose(AssistantAction, Assistant.Query);

const OpenSidebar = SidebarAction(Sidebar.Open);
const CloseSidebar = SidebarAction(Sidebar.Close);

const DockSidebar =
  { type: "Sidebar"
  , action: Sidebar.Attach
  };

const UndockSidebar =
  { type: "Sidebar"
  , action: Sidebar.Detach
  };

const HideOverlay = OverlayAction(Overlay.Hide);
const ShowOverlay = OverlayAction(Overlay.Show);
const FadeOverlay = OverlayAction(Overlay.Fade);

export const LiveReload =
  { type: 'LiveReload'
  };

// Animation

const ResizeAnimationAction = action =>
  ( { type: "ResizeAnimation"
    , action
    }
  );




const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
const decodeKeyDown = Keyboard.bindings({
  'accel l': always(EditWebView),
  'accel t': always(CreateWebView),
  'accel 0': always(ResetZoom),
  'accel -': always(ZoomOut),
  'accel =': always(ZoomIn),
  'accel shift =': always(ZoomIn),
  'accel w': always(CloseWebView),
  'accel shift ]': always(SelectNext),
  'accel shift [': always(SelectPrevious),
  'control tab': always(SelectNext),
  'control shift tab': always(SelectPrevious),
  // 'accel shift backspace':  always(ResetBrowserSession),
  // 'accel shift s': always(SaveBrowserSession),
  'accel r': always(Reload),
  'escape': always(Escape),
  [`${modifier} left`]: always(GoBack),
  [`${modifier} right`]: always(GoForward),

  // TODO: `meta alt i` generates `accel alt i` on OSX we need to look
  // more closely into this but so declaring both shortcuts should do it.
  'accel alt i': always(ToggleDevtools),
  'accel alt ˆ': always(ToggleDevtools),
  'F12': always(ToggleDevtools),
  'F5': always(ReloadRuntime),
  'meta control r': always(ReloadRuntime),
  'meta alt 3': always(PrintSnapshot),
  'meta alt 4': always(PublishSnapshot)
});

const decodeKeyUp = Keyboard.bindings({
  'control': always(ActivateSeleted),
  'accel': always(ActivateSeleted)
});

const showWebView = model =>
  batch
  ( update
  , merge(model, {mode: 'show-web-view'})
  , [ HideInput
    , CloseAssistant
    , CloseSidebar
    , HideOverlay
    , FoldWebViews
    , FocusWebView
    ]
  );

const createWebView = model =>
  batch
  ( update
  , merge(model, {mode: 'create-web-view'})
  , [ ShowInput
    , ExpandAssistant
    , CloseSidebar
    , HideOverlay
    , FoldWebViews
    , EnterInput
    ]
  );

const editWebView = model =>
  batch
  ( update
  , merge(model, {mode: 'edit-web-view'})
  , [ ShowInput
    , OpenAssistant
    , CloseSidebar
    , ShowOverlay
    , FoldWebViews
    , EnterInputSelection(WebViews.getActiveURI(model.webViews, ''))
    ]
  );

const showTabs = model =>
  batch
  ( update
  , merge(model, {mode: 'show-tabs'})
  , [ HideInput
    , CloseAssistant
    , OpenSidebar
    , ShowOverlay
    , UnfoldWebViews
    ]
  );


const selectWebView = (model, action) =>
  batch
  ( update
  , merge(model, {mode: 'select-web-view'})
  , [ HideInput
    , CloseAssistant
    , OpenSidebar
    , UnfoldWebViews
    , FadeOverlay
    ]
  );


const submitInput = model =>
  update(model, NavigateTo(URL.read(model.input.value)));

const openWebView = model =>
  update
  ( model
  , Open
    ( { uri: URL.read(model.input.value)
      , disposition: 'default'
      , name: ''
      , features: ''
      , ref: null
      , guestInstanceId: null
      }
    )
  );

const openURL = (model, uri) =>
  batch
  ( update
  , model
  , [ Open
      ( { uri
        , disposition: 'default'
        , name: ''
        , features: ''
        , ref: null
        , guestInstanceId: null
        }
      )
    , ShowWebView
    , ReceiveOpenURLNotification
    ]
  );

const reciveOpenURLNotification = model =>
  [ model
  , Effects
    .perform(Runtime.receive('mozbrowseropenwindow'))
    .map(OpenURL)
  ];


const focusWebView = model =>
  update(model, FocusWebView)

const exitInput = model =>
  batch
  ( update
  , model
  , [ CloseAssistant
    , FocusWebView
    ]
  );


const attachSidebar = model =>
  batch
  ( update
  , merge(model, {mode: 'show-web-view'})
  , [ DockSidebar
    , Shrink
    , CloseSidebar
    , HideOverlay
    , FoldWebViews
    , FocusWebView
    ]
  );

const detachSidebar = model =>
  batch
  ( update
  , model
  , [ UndockSidebar
    , Expand
    ]
  );

const reloadRuntime = model =>
  [ model
  , Effects
    .perform(Runtime.reload)
    .map(always(Reloaded))
  ];


const updateQuery =
  (model, action) =>
  updateAssistant
  ( model
  , Assistant.Query(model.input.value)
  );

// Animations

const expand = model =>
  ( model.isExpanded
  ? [ model, Effects.none ]
  : startResizeAnimation(merge(model, {isExpanded: true}))
  );

const shrink = model =>
  ( model.isExpanded
  ? startResizeAnimation(merge(model, {isExpanded: false}))
  : [ model, Effects.none ]
  );


const startResizeAnimation = model => {
  const [resizeAnimation, fx] =
    Stopwatch.update(model.resizeAnimation, Stopwatch.Start);
  return [ merge(model, {resizeAnimation}), fx.map(ResizeAnimationAction) ];
}

const endResizeAnimation = model => {
  const [resizeAnimation, fx] =
    Stopwatch.update(model.resizeAnimation, Stopwatch.End);

  return [ merge(model, {resizeAnimation}), Effects.none ];
}

const shrinked = endResizeAnimation;
const expanded = endResizeAnimation;

const updateResizeAnimation = (model, action) => {
  const [resizeAnimation, fx] =
    Stopwatch.update(model.resizeAnimation, action);
  const duration = 200;

  const [begin, end] =
    ( model.isExpanded
    ? [50, 0]
    : [0, 50]
    );

  const result =
    ( (resizeAnimation && duration > resizeAnimation.elapsed)
    ? [ merge
        ( model
        , { resizeAnimation
          , display:
              merge
              ( model.display
              , { rightOffset
                  : Easing.ease
                    ( Easing.easeOutCubic
                    , Easing.float
                    , begin
                    , end
                    , duration
                    , resizeAnimation.elapsed
                    )
                }
              )
          }
        )
      , fx.map(ResizeAnimationAction)
      ]
    : [ merge
        ( model
        , { resizeAnimation
          , display: merge(model.display, { rightOffset: end })
          }
        )
      , Effects.receive
        ( model.isExpanded
        ? Expanded
        : Shrinked
        )
      ]
    );

  return result;
}



export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === 'SubmitInput'
  ? submitInput(model)
  : action.type === 'OpenWebView'
  ? openWebView(model)
  : action.type === 'OpenURL'
  ? openURL(model, action.uri)
  : action.type === 'ReceiveOpenURLNotification'
  ? reciveOpenURLNotification(model)
  : action.type === 'ExitInput'
  ? exitInput(model)
  : action.type === 'CreateWebView'
  ? createWebView(model)
  : action.type === 'EditWebView'
  ? editWebView(model)
  : action.type === 'ShowWebView'
  ? showWebView(model)
  : action.type === 'ShowTabs'
  ? showTabs(model)
  : action.type === 'SelectWebView'
  ? selectWebView(model)
  // @TODO Change this to toggle tabs instead.
  : action.type === 'Escape'
  ? showTabs(model)
  : action.type === 'AttachSidebar'
  ? attachSidebar(model)
  : action.type === 'DetachSidebar'
  ? detachSidebar(model)
  : action.type === 'ReloadRuntime'
  ? reloadRuntime(model)

  // Expand / Shrink animations
  : action.type === "Expand"
  ? expand(model)
  : action.type === "Shrink"
  ? shrink(model)
  : action.type === "ResizeAnimation"
  ? updateResizeAnimation(model, action.action)
  : action.type === "Expanded"
  ? expanded(model)
  : action.type === "Shrinked"
  ? shrinked(model)

  // Delegate to the appropriate module
  : action.type === 'Input'
  ? updateInput(model, action.source)
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

  : action.type === 'BlurInput'
  ? updateInput(model, Input.Blur)

  : action.type === 'WebViews'
  ? updateWebViews(model, action.source)
  : action.type === 'SelectTab'
  ? updateWebViews(model, action.source)
  : action.type === 'ActivateTabByID'
  ? updateWebViews(model, action.activateTabByID)
  : action.type === 'ActivateTab'
  ? updateWebViews(model, action.activateTab)

  : action.type === 'Shell'
  ? updateShell(model, action.source)
  : action.type === 'Focus'
  ? updateShell(model, Shell.Focus)

  // Assistant
  : action.type === 'Assistant'
  ? updateAssistant(model, action.source)
  : action.type === 'Query'
  ? updateQuery(model)
  : action.type === 'SuggestNext'
  ? updateAssistant(model, Assistant.SuggestNext)
  : action.type === 'SuggestPrevious'
  ? updateAssistant(model, Assistant.SuggestPrevious)

  : action.type === 'Devtools'
  ? updateDevtools(model, action.action)
  : action.type === 'Sidebar'
  ? updateSidebar(model, action.action)
  : action.type === 'Overlay'
  ? updateOverlay(model, action.action)

  : action.type === 'Failure'
  ? [ model
    , Effects
      .perform(Unknown.error(action.error))
      .map(NoOp)
    ]

  : action.type === 'ReportWebviewCrash' ||
    action.type === 'DismissReport' ||
    action.type === 'FileReport'
  ? updateIssue(model, action)

  // Ignore some actions.
  : action.type === 'Reloaded'
  ? [model, Effects.none]
  : action.type === 'PrintSnapshot'
  ? [model, Effects.none]
  : action.type === 'UploadSnapshot'
  ? [model, Effects.none]
  // TODO: Delegate to modules that need to do cleanup.
  : action.type === 'LiveReload'
  ? [model, Effects.none]

  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create({
  root: {
    background: '#171814',
    perspective: '1000px',
    // These styles prevent scrolling with the arrow keys in the root window
    // when elements move outside of viewport.
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'absolute',
    MozWindowDragging: 'drag',
    WebkitAppRegion: 'drag'
  },
  content: {
    position: 'absolute',
    perspective: '1000px',
    height: '100vh',
    width: '100vw'
  }
});

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.main
  ( { className: 'root'
    , style: styleSheet.root
    , tabIndex: 1
    , onKeyDown: onWindow(address, decodeKeyDown)
    , onKeyUp: onWindow(address, decodeKeyUp)
    , onBlur: onWindow(address, always(Blur))
    , onFocus: onWindow(address, always(Focus))
    , onUnload: onWindow(address, always(Unload))
    }
  , [ html.div
      ( { className: 'browser-content'
        , style:
          Style
          ( styleSheet.content
          , { width: `calc(100vw - ${model.display.rightOffset}px)`
            }
          )
        }
      , [ thunk
          ( 'web-views'
          , WebViews.view
          , model.webViews
          , forward(address, WebViewsAction)
          )
        , thunk
          ( 'overlay'
          , Overlay.view
          , model.overlay
          , forward(address, OverlayAction))
        , thunk
          ( 'assistant'
          , Assistant.view
          , model.assistant
          , forward(address, AssistantAction)
          )
        , thunk
          ( 'input'
          , Input.view
          , model.input
          , forward(address, InputAction)
          )
        , thunk
          ( 'devtools'
          , Devtools.view
          , model.devtools
          , forward(address, DevtoolsAction)
          )
        ]
      )
      , thunk
      ( 'sidebar'
      , Sidebar.view
      , model.sidebar
      , model.webViews
      , forward(address, SidebarAction)
      )

    , thunk
      ( 'shell'
      , Shell.view
      , model.shell
      , forward(address, ShellAction)
      )

    , thunk
      ( 'issue'
      , Issue.view
      , model.issue
      , forward(address, IssueAction)
      )
    ]
  );
