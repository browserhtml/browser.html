/* @flow */

import * as Runtime from "./runtime"

import {performance} from "./performance"


const state =
  { requests: []
  , ids: []
  , nextID: 0
  , isScheduled: false
  , time: 0
  }

const frameTime = 1000 / 60

export const requestAnimationFrame =
  (request/*:(time:number) => any*/):number => {
    const id = ++state.nextID;
    state.ids.push(id);
    state.requests.push(request);

    if (!state.isScheduled) {
      const now = performance.now()
      const delta = Math.max(0, frameTime - (now - state.time));
      setTimeout(onAnimationFrame, delta);
      state.isScheduled = true;
    }

    return id;
  }

export const cancelAnimationFrame =
  (id:number) => {
    const index = state.ids.indexOf(id);
    if (index >= 0) {
      state.ids.splice(index, 1);
      state.requests.splice(index, 1);
    }
  }

const onAnimationFrame =
  () => {
    const now = performance.now();
    state.time = now;
    state.isScheduled = false;
    state.ids.splice(0);
    const requests = state.requests.splice(0);

    const count = requests.length;
    let index  = 0;
    while (index < count) {
      requests[index++](now);
    }
  }

export const doOverride =
  () => {
    window.requestAnimationFrame = requestAnimationFrame
    console.warn("non-native requestAnimationFrame will be used");
  }


if (Runtime.env.raf === "timer") {
  doOverride()
}
