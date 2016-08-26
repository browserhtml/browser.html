/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import * as Package from "../package.json";
import * as Config from "../browserhtml.json";
import {Effects, html, forward, thunk} from "reflex";

import * as Shell from "./Browser/Shell";
import * as Sidebar from './Browser/Sidebar';
import * as Devtools from "./Common/Devtools";
import * as Runtime from "./Common/Runtime";
import * as URL from './Common/URLHelper';
import * as Unknown from "./Common/Unknown";
import * as Focusable from "./Common/Focus";
import * as OS from './Common/OS';
import * as Keyboard from './Common/Keyboard';
import * as Stopwatch from "./Common/Stopwatch";
import * as Easing from "eased";
import {always, batch, tag, tagged} from "./Common/Prelude";
import {cursor} from "./Common/Cursor";
import {Style, StyleSheet} from './Common/Style';
import type {Result} from "./Common/Result"

import {identity, compose} from "./Lang/Functional";

import {onWindow, on} from "@driver";
import * as Navigators from "./Browser/Navigators";
import type {ID} from "./Common/Prelude"
import * as Tabs from "./Browser/Sidebar/Tabs"
import * as IssueReporter from "./Browser/IssueReporter";

export type Version = string

export type Action =
  | { type: "NoOp" }
  | { type: "GoBack" }
  | { type: "GoForward" }
  | { type: "Reload" }
  | { type: "ZoomIn" }
  | { type: "ZoomOut" }
  | { type: "ResetZoom" }
  | { type: "CloseSelected" }
  | { type: "SelectNext" }
  | { type: "SelectPrevious" }
  | { type: "EndSelection" }
  | { type: "Focus" }
  | { type: "Blur" }
  | { type: "OpenNewTab" }
  | { type: "EditWebView" }
  | { type: "ShowWebView" }
  | { type: "ShowTabs" }
  | { type: "SelectWebView" }
  | { type: "OpenWebView" }
  | { type: "AttachSidebar" }
  | { type: "DetachSidebar" }
  | { type: "OverlayClicked" }
  | { type: "SubmitInput" }
  | { type: "BlurInput" }
  | { type: "ExitInput" }
  | { type: "Escape" }
  | { type: "Unload" }
  | { type: "ReloadRuntime" }
  | { type: "PrintSnapshot" }
  | { type: "PublishSnapshot" }
  | { type: "Sidebar", action: Sidebar.Action }
  | { type: "Navigators", navigators: Navigators.Action }
  | { type: "Shell", source: Shell.Action }
  | { type: "Devtools", action: Devtools.Action }
  | { type: "Expand" }
  | { type: "Expanded" }
  | { type: "Shrink" }
  | { type: "Shrinked" }
  | { type: "ReceiveOpenURLNotification" }
  | { type: "LiveReload" }
  | { type: "Reloaded" }
  | { type: "OpenURL", uri: URI }
  | { type: "Close" }
  | { type: "CloseRuntime" }
  | { type: "Closed", result: Result<Error, void> }
  // @TODO: Do not use any here.
  | { type: "Modify", modify: ID, action: any }
  | { type: "Open" }
  | { type: "Tabs", tabs: Tabs.Action }
  | { type: "Failure", error: {} }
  | { type: "Crash", crash: IssueReporter.Report }
  | { type: "IssueReporter", issueReporter: IssueReporter.Action }


import type {Address, DOM} from "reflex"
import type {URI} from "./Common/Prelude"

export class Model {

  version: Version;
  shell: Shell.Model;
  navigators: Navigators.Model;
  sidebar: Sidebar.Model;
  issueReporter: IssueReporter.Model;
  devtools: Devtools.Model;

  constructor(
    version:Version=Package.version
  , shell:Shell.Model
  , navigators:Navigators.Model
  , sidebar:Sidebar.Model
  , issueReporter:IssueReporter.Model
  , devtools:Devtools.Model
  ) {
    this.version = version
    this.shell = shell
    this.navigators = navigators
    this.sidebar = sidebar
    this.issueReporter = issueReporter
    this.devtools = devtools
  }
}


const Modify =
  (id, action) =>
  ( { type: "Modify"
    , modify: id
    , action
    }
  )

export const init = ():[Model, Effects<Action>] => {
  const [devtools, devtoolsFx] = Devtools.init({isActive: Config.devtools});
  const [shell, shellFx] = Shell.init();
  const [sidebar, sidebarFx] = Sidebar.init();
  const [navigators, navigatorsFx] = Navigators.init();
  const [issueReporter, issueReporterFx] = IssueReporter.init();

  const model = new Model
    ( Package.version
    , shell
    , navigators
    , sidebar
    , issueReporter
    , devtools
    );

  const fx =
    Effects.batch
    ( [ devtoolsFx.map(DevtoolsAction)
      , shellFx.map(ShellAction)
      , sidebarFx.map(SidebarAction)
      , navigatorsFx.map(NavigatorsAction)
      , issueReporterFx.map(IssueReporterAction)
      , Effects
        .perform(Runtime.receive('mozbrowseropenwindow'))
        .map(OpenURL)
      ]
    );

  return [model, fx];
}

const NoOp = always({ type: "NoOp" });

const SidebarAction = action =>
  ( action.type === "OpenNewTab"
  ? OpenNewTab
  : action.type === "Tabs"
  ? action
  : action.type === "Attach"
  ? AttachSidebar
  : action.type === "Detach"
  ? DetachSidebar
  : { type: "Sidebar"
    , action
    }
  );


const NavigatorsAction =
  (action:Navigators.Action):Action => {
    switch (action.type) {
      case "ShowTabs":
        return ShowTabs
      case "ShowWebView":
        return ShowWebView
      case "OpenNewTab":
        return OpenNewTab
      case "Crash":
        return action;
      default:
        return { type: 'Navigators', navigators: action }
    }
  };


const ShellAction = action =>
  ( action.type === 'Focus'
  ? { type: 'Focus'
    , source: action
    }
  : { type: 'Shell'
    , source: action
    }
  );

const IssueReporterAction =
  action =>
  ( { type: "IssueReporter"
    , issueReporter: action
    }
  );

const DevtoolsAction = action =>
  ( { type: 'Devtools'
    , action
    }
  );


const updateNavigators = cursor({
  get: model => model.navigators,
  set:
    (model, navigators) =>
    new Model
    ( model.version
    , model.shell
    , navigators
    , model.sidebar
    , model.issueReporter
    , model.devtools
    ),
  update: Navigators.update,
  tag: NavigatorsAction
});

const updateShell = cursor({
  get: model => model.shell,
  set:
    (model, shell) =>
    new Model
    ( model.version
    , shell
    , model.navigators
    , model.sidebar
    , model.issueReporter
    , model.devtools
    ),
  update: Shell.update,
  tag: ShellAction
});

const updateDevtools = cursor({
  get: model => model.devtools,
  set:
    (model, devtools) =>
    new Model
    ( model.version
    , model.shell
    , model.navigators
    , model.sidebar
    , model.issueReporter
    , devtools
    ),
  update: Devtools.update,
  tag: DevtoolsAction
});

const updateSidebar = cursor({
  get: model => model.sidebar,
  set:
    (model, sidebar) =>
    new Model
    ( model.version
    , model.shell
    , model.navigators
    , sidebar
    , model.issueReporter
    , model.devtools
    ),
  tag: SidebarAction,
  update: Sidebar.update
});

const updateIssueReporter = cursor({
  get: model => model.issueReporter,
  set:
    (model, issueReporter) =>
    new Model
    ( model.version
    , model.shell
    , model.navigators
    , model.sidebar
    , issueReporter
    , model.devtools
    ),
  tag: IssueReporterAction,
  update: IssueReporter.update
});


const closed = (model, result) =>
  ( result.isOk
   ? [ model, Effects.none ]
   : [ model, Effects.perform(Unknown.error(result.error)) ]
  );

const Reloaded:Action =
  { type: "Reloaded"
  };

const Failure = error =>
  ( { type: "Failure"
    , error: error
    }
  );

const Closed = result =>
  ( { type: "Closed"
    , result
    }
  )


// ### Mode changes


export const OpenNewTab:Action =
  { type: 'OpenNewTab'
  };

export const EditWebView:Action =
  { type: 'EditWebView'
  };

export const ShowWebView:Action =
  { type: 'ShowWebView'
  };

export const ShowTabs:Action =
  { type: 'ShowTabs'
  };

export const SelectWebView:Action =
  { type: 'SelectWebView'
  };

// ### Actions that affect multilpe sub-components

export const OpenWebView:Action =
  { type: 'OpenWebView'
  };

export const AttachSidebar:Action =
  { type: "AttachSidebar"
  , source: Sidebar.Attach
  };

export const DetachSidebar:Action =
  { type: "DetachSidebar"
  , source: Sidebar.Detach
  };

export const Escape:Action =
  { type: 'Escape'
  };


export const Unload:Action =
  { type: 'Unload'
  };

export const ReloadRuntime:Action =
  { type: 'ReloadRuntime'
  };

export const BlurInput:Action =
  { type: 'BlurInput'
  };

export const CloseRuntime:Action =
  { type: "CloseRuntime"
  };


// Following Browser actions directly delegate to a `WebViews` module, there for
// they are just tagged versions of `WebViews` actions, but that is Just an
// implementation detail.
export const ZoomIn = { type: "ZoomIn" }
export const ZoomOut = { type: "ZoomOut" }
export const ResetZoom = { type: "ResetZoom" }
export const Reload = { type: "Reload" }
export const Close = { type: "Close" }
export const GoBack = { type: "GoBack" };
export const GoForward = { type: "GoForward" };
export const SelectNext = { type: "SelectNext" };
export const SelectPrevious = { type: "SelectPrevious" }
export const EndSelection = { type: "EndSelection" }

const ReceiveOpenURLNotification =
  { type: "ReceiveOpenURLNotification"
  };

const OpenURL = ({url}) =>
  ( { type: "OpenURL"
    , uri: url
    }
  );
// Following browser actions directly delegate to one of the existing modules
// there for we define them by just wrapping actions from that module to avoid
// additional wiring (which is implementation detail that may change).
export const ToggleDevtools = DevtoolsAction(Devtools.Toggle);
const PrintSnapshot = { type: "PrintSnapshot" };
const PublishSnapshot = { type: "PublishSnapshot" };
export const Blur = ShellAction(Shell.Blur);
export const Focus = ShellAction(Shell.Focus);
const ExpandSidebar = SidebarAction(Sidebar.Expand);
const CollapseSidebar = SidebarAction(Sidebar.Collapse);

const ExposeNavigators = NavigatorsAction(Navigators.Expose);
const NavigatorsOpenNewTab = NavigatorsAction(Navigators.OpenNewTab);
const FocusNavigators = NavigatorsAction(Navigators.Focus);
const ShrinkNavigators = NavigatorsAction(Navigators.Shrink);
const ExpandNavigators = NavigatorsAction(Navigators.Expand);
const EditNivagatorInput = NavigatorsAction(Navigators.EditInput);

const DockSidebar =
  { type: "Sidebar"
  , action: Sidebar.Attach
  };

const UndockSidebar =
  { type: "Sidebar"
  , action: Sidebar.Detach
  };

export const LiveReload =
  { type: 'LiveReload'
  };

const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
const decodeKeyDown = Keyboard.bindings({
  'accel l': always(EditWebView),
  'accel t': always(OpenNewTab),
  'accel 0': always(ResetZoom),
  'accel -': always(ZoomOut),
  'accel =': always(ZoomIn),
  'accel shift =': always(ZoomIn),
  'accel w': always(Close),
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
  [`${modifier} q`]: always(CloseRuntime),
  'meta alt 3': always(PrintSnapshot),
  'meta alt 4': always(PublishSnapshot)
});

const decodeKeyUp = Keyboard.bindings({
  'control': always(EndSelection),
  'accel': always(EndSelection)
});

const showWebView = model =>
  batch
  ( update
  , model
  , [ CollapseSidebar
    , FocusNavigators
    ]
  );

const openNewTab =
  model => {
    const [sidebar, $sidebar] =
      Sidebar.update(model.sidebar, Sidebar.Collapse);

    const [navigators, $navigators] =
      Navigators.update(model.navigators, Navigators.OpenNewTab);

    const next = new Model
      ( model.version
      , model.shell
      , navigators
      , sidebar
      , model.issueReporter
      , model.devtools
      )

    const fx = Effects.batch
      ( [ $sidebar.map(SidebarAction)
        , $navigators.map(NavigatorsAction)
        ]
      )

    return [next, fx]
  }


const editWebView = model =>
  batch
  ( update
  , model
  , [ /*ShowInput
    , OpenAssistant
    , */CollapseSidebar
    // , ShowOverlay
    // , FoldWebViews
    /*, EnterInputSelection(WebViews.getActiveURI(model.webViews, ''))*/
    , FocusNavigators
    , EditNivagatorInput
    ]
  );

const showTabs = model =>
  batch
  ( update
  , model
  , [ ExpandSidebar
    , ExposeNavigators
    ]
  );

const toggleTabs =
  model =>
  ( model.sidebar.isExpanded
  ? showWebView(model)
  : showTabs(model)
  );


const goBack =
  model =>
  updateNavigators
  ( model
  , Navigators.GoBack
  )

const goForward =
  model =>
  updateNavigators
  ( model
  , Navigators.GoForward
  )


const reload =
  model =>
  updateNavigators
  ( model
  , Navigators.Reload
  )

const zoomIn =
  model =>
  updateNavigators
  ( model
  , Navigators.ZoomIn
  )

const zoomOut =
  model =>
  updateNavigators
  ( model
  , Navigators.ZoomOut
  )


const resetZoom =
  model =>
  updateNavigators
  ( model
  , Navigators.ResetZoom
  )

const close =
  model =>
  updateNavigators
  ( model
  , Navigators.Close
  )

const closeRuntime = model =>
  [ model
  , Effects
    .perform(Runtime.quit)
    .map(Closed)
  ];

const SelectNextNavigator =
  { type: "Navigators"
  , navigators: Navigators.SelectNext
  }

const selectNext =
  model =>
  batch
  ( update
  , model
  , [ ExpandSidebar
    , ExposeNavigators
    , SelectNextNavigator
    ]
  )

const SelectPreviousNavigator =
  { type: "Navigators"
  , navigators: Navigators.SelectPrevious
  }

const selectPrevious =
  model =>
  batch
  ( update
  , model
  , [ ExpandSidebar
    , ExposeNavigators
    , SelectPreviousNavigator
    ]
  )

const endSelection = showWebView

const reciveOpenURLNotification = model =>
  [ model
  , Effects
    .perform(Runtime.receive('mozbrowseropenwindow'))
    .map(OpenURL)
  ];

const attachSidebar = model =>
  batch
  ( update
  , model
  , [ DockSidebar
    , ShrinkNavigators
    ]
  );

const detachSidebar = model =>
  batch
  ( update
  , model
  , [ UndockSidebar
    , ExpandNavigators
    ]
  );

const reloadRuntime = model =>
  [ model
  , Effects
    .perform(Runtime.reload)
    .map(always(Reloaded))
  ];




export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case 'GoBack':
        return goBack(model);
      case 'GoForward':
        return goForward(model);
      case 'Reload':
        return reload(model);
      case 'ZoomIn':
        return zoomIn(model);
      case 'ZoomOut':
        return zoomOut(model);
      case 'ResetZoom':
        return resetZoom(model);
      case 'Close':
        return close(model);
      case 'CloseRuntime':
        return closeRuntime(model);
      case 'OpenNewTab':
        return openNewTab(model);
      case 'EditWebView':
        return editWebView(model);
      case 'ShowWebView':
        return showWebView(model);
      case 'ShowTabs':
        return showTabs(model);
      case 'Escape':
        return toggleTabs(model);
      case 'AttachSidebar':
        return attachSidebar(model);
      case 'DetachSidebar':
        return detachSidebar(model);
      case 'ReloadRuntime':
        return reloadRuntime(model);
      case 'SelectNext':
        return selectNext(model);
      case 'SelectPrevious':
        return selectPrevious(model);
      case 'EndSelection':
        return endSelection(model);
      case 'Shell':
        return updateShell(model, action.source);
      case 'Focus':
        return updateShell(model, Shell.Focus);
      case 'Devtools':
        return updateDevtools(model, action.action);
      case 'Sidebar':
        return updateSidebar(model, action.action);
      case 'Tabs':
        return updateNavigators(model, action);
      case 'Navigators':
        return updateNavigators(model, action.navigators);
      case 'Failure':
        return [
           model
        , Effects
          .perform(Unknown.error(action.error))
        ];
      case 'Crash':
        return updateIssueReporter(model, action);
      case 'IssueReporter':
        return updateIssueReporter(model, action.issueReporter);
      case 'Closed':
        return closed(model, action.result);

      // Ignore some actions.
      case 'Reloaded':
        return [ model, Effects.none ]
      case 'PrintSnapshot':
        return [model, Effects.none];
      case 'UploadSnapshot':
        return [model, Effects.none];
      // TODO: Delegate to modules that need to do cleanup.
      case 'LiveReload':
        return [model, Effects.none];

      default:
        return Unknown.update(model, action);
    }
  };

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
  (model:Model, address:Address<Action>):DOM =>
  html.main
  ( { className: 'root'
    , style: styleSheet.root
    , tabIndex: 1
    , onKeyDown: onWindow(address, decodeKeyDown)
    , onKeyUp: onWindow(address, decodeKeyUp)
    , onBlur: onWindow(address, always(Blur))
    , onFocus: onWindow(address, always(Focus))
    , onUnload: onWindow(address, always(Unload))
    , onServoMouseForceDown: on(address, always(ShowTabs))
    , onWebkitMouseForceDown: on(address, always(ShowTabs))
    , onMozBrowserError: onWindow(address, decodeError)
    }
  , [ Navigators.view
      ( model.navigators
      , forward(address, NavigatorsAction)
      )

    , Sidebar.view
      ( model.sidebar
      , model.navigators.deck
      , forward(address, SidebarAction)
      )

    , Shell.view
      ( model.shell
      , forward(address, ShellAction)
      )

    , Devtools.view
      ( model.devtools
      , forward(address, DevtoolsAction)
      )

    , IssueReporter.view
      ( model.issueReporter
      , forward(address, IssueReporterAction)
      )
    ]
  );

const decodeError =
  ( event ) =>
  ( event.detail.type === "fatal"
  ? decodeCrash(event)
  : Failure(event.detail)
  )

const decodeCrash =
  ({ detail }) =>
  ( { type: "Crash"
    , crash:
      { description: detail.description
      , version: detail.version
      , backtrace: detail.report
      , url: ""
      }
    }
  )
