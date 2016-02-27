/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {start, Effects} from "reflex";
import * as UI from "./repl";
import {Renderer} from "driver";

const isReload = window.application != null;
// If hotswap change address so it points to a new mailbox &r
// re-render.
if (isReload) {
  window.application.address(UI.Terminate);
}


const application = start({
  initial: isReload ?
            window.application.model.value :
            UI.init(),
  step: (model, action) => {
    console.log(">>> Action:", action);
    const [state, fx] = UI.update(model, action);
    console.log('<<< Model:', state);
    console.log('<<< FX:', fx);
    return [state, fx];
  },
  view: UI.view
});

const renderer = new Renderer({target: document.body});
application.view.subscribe(renderer.address);
application.task.subscribe(Effects.service(application.address));

window.application = application;
