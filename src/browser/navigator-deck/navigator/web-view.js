/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward} from 'reflex';
import {merge, always, batch} from '../../../common/prelude';
import {cursor} from '../../../common/cursor';
import {compose} from '../../../lang/functional';
import {on} from '@driver';
import {isElectron} from "../../../common/runtime";
import * as Shell from './web-view/shell';
import * as Navigation from './web-view/navigation';
import * as Security from './web-view/security';
import * as Page from './web-view/page';
import * as Unknown from '../../../common/unknown';
import * as Stopwatch from '../../../common/stopwatch';
import {Style, StyleSheet} from '../../../common/style';
import {readTitle, isDark, canGoBack} from './web-view/util';
import * as Driver from '@driver';
import * as Focusable from '../../../common/focusable';
import * as Easing from 'eased';
import * as MozBrowserFrame from './web-view/moz-browser-frame';
import * as ElectronFrame from './web-view/electron-frame';
import * as Layer from './Layer';
import * as Ref from '../../../common/ref';
import * as Tab from '../../sidebar/tab';

/*::
import type {Address, DOM} from "reflex"
import type {URI, Time, Integer, Float} from "../../../common/prelude"
import type {Icon} from "../../../common/favicon"
import {performance} from "../../../common/performance"

export type {URI, Time}

export type Display =
  { opacity: Float
  }

export type Disposition =
  | 'default'
  | 'foreground-tab'
  | 'background-tab'
  | 'new-window'
  | 'new-popup'

export type Flags =
  { uri: URI
  , disposition: Disposition
  , name: string
  , features: string
  , options?: {}
  , ref: any
  , guestInstanceId: ?string
  }

export type Action =
  | { type: "NoOp" }
  | { type: "Select" }
  | { type: "Selected" }
  | { type: "Unselect" }
  | { type: "Unselected" }
  | { type: "Activate" }
  | { type: "Activated" }
  | { type: "Deactivate" }
  | { type: "Deactivated" }
  | { type: "Focus" }
  | { type: "Blur" }
  | { type: "Load"
    , uri: URI
    }
  | { type: "LoadStart"
    , time: Time
    }
  | { type: "LoadEnd"
    , time: Time
    }
  | { type: "Connect"
    , time: Time
    }
  | { type: "LocationChanged"
    , uri: URI
    , canGoBack: ?boolean
    , canGoForward: ?boolean
    , time: Time
    }
  | { type: "FirstPaint" }
  | { type: "DocumentFirstPaint" }
  | { type: "MetaChanged", name: string, content: string }
  | { type: "IconChanged", icon: Icon }
  | { type: "TitleChanged", title: string }
  | { type: "SecurityChanged"
    , state: "broken" | "secure" | "insecure"
    , extendedValidation: boolean
    , trackingContent: boolean
    , mixedContent: boolean
    }
  | { type: "Close" }
  | { type: "Closed" }
  | { type: "Edit" }
  | { type: "ShowTabs" }
  | { type: "Create" }
  | { type: "PushDown" }
  | { type: "PushedDown" }
  | { type: "SelectAnimation"
    , action: Stopwatch.Action
    }
  // | { type: "Progress"
  //   , progress: Progress.Action
  //   }
  | { type: "Shell"
    , shell: Shell.Action
    }
  | { type: "Page"
    , page: Page.Action
    }
  | { type: "Tab"
    , tab: Tab.Action
    }
  | { type: "Security"
    , security: Security.Action
    }
  | { type: "Navigation"
    , navigation: Navigation.Action
    }
  | { type: "Open"
    , options: Flags
    }
  | { type: "ContextMenu"
    , clientX: Float
    , clientY: Float
    , systemTargets: any
    , contextMenu: any
    }
  | { type: "Authentificate"
    , host: string
    , realm: string
    , isProxy: boolean
    }
  | { type: "LoadFail"
    , time: Time
    , reason: string
    , code: Integer
    }
  | { type: "ModalPrompt"
    , kind: "alert" | "confirm" | "prompt"
    , title: string
    , message: string
    }

*/

export class Model {
  /*::
  ref: Ref.Model;
  guestInstanceId: ?string;
  name: string;
  features: string;
  tab: Tab.Model;
  shell: Shell.Model;
  navigation: Navigation.Model;
  security: Security.Model;
  page: Page.Model;
  */
  constructor(
    ref/*: Ref.Model*/
  , guestInstanceId/*: ?string*/
  , name/*: string*/
  , features/*: string*/
  , tab/*: Tab.Model*/
  , shell/*: Shell.Model*/
  , navigation/*: Navigation.Model*/
  , security/*: Security.Model*/
  , page/*: Page.Model*/
  ) {
    this.ref = ref
    this.guestInstanceId = guestInstanceId
    this.name = name
    this.features = features
    this.tab = tab
    this.shell = shell
    this.navigation = navigation
    this.security = security
    this.page = page
  }
}

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
      default:
        return {
          type: "Tab"
        , tab: action
        };
    }
  };

const SelectAnimationAction = action =>
  ( action.type === "End"
  ? Selected
  : { type: "SelectAnimation"
    , action
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
  (options/*:Flags*/)/*:[Model, Effects<Action>]*/ => {
    const ref = Ref.create()
    return assemble(
        ref
      , options.guestInstanceId
      , options.name
      , options.features
      , Tab.init()
      , Shell.init(ref, options.disposition !== 'background-tab')
      , Navigation.init(ref, options.uri)
      , Security.init()
      , Page.init(options.uri)
      )
  };

const assemble =
  ( ref/*:Ref.Model*/
  , guestInstanceId/*:?string*/
  , name/*:string*/
  , features/*:string*/
  , [tab, $tab]/*:[Tab.Model, Effects<Tab.Action>]*/
  , [shell, $shell]/*:[Shell.Model, Effects<Shell.Action>]*/
  , [navigation, $navigation]/*:[Navigation.Model, Effects<Navigation.Action>]*/
  , [security, $security]/*:[Security.Model, Effects<Security.Action>]*/
  , [page, $page]/*:[Page.Model, Effects<Page.Action>]*/
  ) => {
    const model = new Model
      ( ref
      , guestInstanceId
      , name
      , features
      , tab
      , shell
      , navigation
      , security
      , page
      )

    const fx = Effects.batch
      ( [ $shell.map(ShellAction)
        , $page.map(PageAction)
        , $tab.map(TabAction)
        , $security.map(SecurityAction)
        , $navigation.map(NavigationAction)
        ]
      )

    return [model, fx]
  }

// const startSelectAnimation = model => {
//   const [animation, fx] = Stopwatch.update(model.animation, Stopwatch.Start);
//   return (
//     [ merge(model, {animation})
//     , fx.map(SelectAnimationAction)
//     ]
//   );
// }
//
// const select = model =>
//   ( model.isSelected
//   ? [ model, Effects.none ]
//   : startSelectAnimation(merge(model, {isSelected: true}))
//   );
//
// const selected = model =>
//   [ model
//   , Effects.receive(Selected)
//   ];
//
// const unselect = model =>
//   ( model.isSelected
//   ? [ merge
//       ( model
//       , { isSelected: false
//         , display: {opacity: 1}
//         }
//       )
//     , Effects.none
//     ]
//   : [ model, Effects.none ]
//   );
//
// const unselected = model =>
//   [ model
//   , Effects.receive(Unselected)
//   ];
//
// const activate = model =>
//   ( model.isActive
//   ? [ model, Effects.none ]
//   : [ merge(model, {isActive: true, isSelected: true})
//     , Effects.receive(Activated)
//     ]
//   );
//
// const activated = model =>
//   updateShell(model, Shell.Focus);
//
// const deactivate = model =>
//   ( model.isActive
//   ? [ merge(model, {isActive: false})
//     , Effects.receive(Deactivated)
//     ]
//   : [ model, Effects.none ]
//   );
//
// const deactivated = model =>
//   [ model, Effects.none ];

const focus =
  model =>
  // ( model.isActive
  // ?
  updateShell(model, Shell.Focus)
  // : activate(model)
  // );

const load = (model, uri) =>
  updateNavigation(model, Navigation.Load(uri));


const startLoad = (model, time) =>
  batch
  ( update
  , model
  , [ /*ProgressAction(Progress.Start(time))
    , */PageAction(Page.LoadStart)
    , SecurityAction(Security.LoadStart)
    ]
  );

const endLoad = (model, time) =>
  batch
  ( update
  , model
  , [ /*ProgressAction(Progress.LoadEnd(time))
    , */PageAction(Page.LoadEnd)
    ]
  );

const connect = (model, time) =>
  batch
  ( update
  , model
  , [ /*ProgressAction(Progress.Connect(time))*/
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
      // case "Select":
      //   return select(model);
      // case "Selected":
      //   return [ model, Effects.none ];
      // case "Unselect":
      //   return unselect(model);
      // case "Unselected":
      //   return [ model, Effects.none ];
      // case "Activate":
      //   return activate(model);
      // case "Activated":
      //   return activated(model);
      // case "Deactivate":
      //   return deactivate(model);
      // case "Deactivated":
      //   return deactivated(model);
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
          , Effects.perform(Unknown.warn(action))
            .map(NoOp)
          ];
      case "Close":
        return close(model);

  // Force push actions.
  // We forward these up to WebViews.
      case "PushDown":
        return [ model, Effects.receive(PushedDown) ];

  // Animation
      // case "SelectAnimation":
      //   return updateSelectAnimation(model, action.action);

  // Delegate
      // case "Progress":
      //   return updateProgress(model, action.progress);
      case "Shell":
        return updateShell(model, action.shell);
      case "Page":
        return updatePage(model, action.page);
      case "Tab":
        return updateTab(model, action.tab);
      case "Security":
        return updateSecurity(model, action.security);
      case "Navigation":
        return updateNavigation(model, action.navigation);
      default:
        return Unknown.update(model, action);
    }
  };

const topBarHeight = '27px';

const styleSheet = StyleSheet.create({
  webviewActive: {

  },

  webviewSelected: {
    // zIndex: 3
  },

  webviewInactive: {
    pointerEvents: 'none',
    // zIndex: 1
  },

  base: {
    position: 'absolute',
    top: topBarHeight,
    zIndex: Layer.output,
    left: 0,
    width: '100%',
    height: `calc(100% - ${topBarHeight})`,
    mozUserSelect: 'none', // necessary to pass text drag to iframe's content
    borderWidth: 0,
    backgroundColor: 'white',
    MozWindowDragging: 'no-drag',
    WebkitAppRegion: 'no-drag',
  }
});

const Frame =
  ( isElectron
  ? ElectronFrame
  : MozBrowserFrame
  );


export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  Frame.view(styleSheet, model, address);
