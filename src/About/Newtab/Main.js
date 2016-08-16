/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import "babel-polyfill";
import {start, Effects} from "reflex";
import * as NewTab from "./Newtab";
import {Renderer} from "@driver";

const application = start({
  flags: void(0),
  init: NewTab.init,
  update: NewTab.update,
  view: NewTab.view
});

const renderer = new Renderer({target: document.body});
application.view.subscribe(renderer.address);
application.task.subscribe(Effects.driver(application.address));

window.application = application;
