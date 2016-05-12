/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import "babel-polyfill";
import "./common/request-animation-frame";
import {start, Effects} from "reflex";
import * as UI from "./perspective-ui";
import {version} from "../package.json";
import * as Config from "../browserhtml.json";
import * as Runtime from "./common/runtime";
import {Renderer} from "@driver";
import * as Devtools from "./devtools"

const isReload = window.application != null;
console.timeStamp =
  ( console.timeStamp == null
  ? console.log
  : console.timeStamp
  );

// If hotswap change address so it points to a new mailbox &r
// re-render.
if (isReload) {
  window.application.address(Devtools.Persist);
}

document.body.classList.toggle('use-native-titlebar',
                               Runtime.useNativeTitlebar());

const application = start
  ( { flags:
      { Debuggee: UI
      , flags: void(0)
      }
    , init:
      ( isReload
      ? Devtools.restore
      : Devtools.init
      )



    , update: Devtools.update
    , view: Devtools.view
    }
  );


const renderer = new Renderer({target: document.body});

application.view.subscribe(renderer.address);
application.task.subscribe(Effects.driver(application.address));

window.application = application;
window.renderer = renderer;
