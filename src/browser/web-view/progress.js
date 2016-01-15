/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../../type/browser/web-view/progress" */

import {Effects, html} from 'reflex';
import {ease, easeOutQuart, float} from 'eased';
import {StyleSheet, Style} from '../../common/style';
import {merge} from '../../common/prelude';
import * as Unknown from '../../common/unknown';

const second = 1000;

export const Start/*:type.Start*/ = time =>
  ( { type: "Start"
    , time
    }
  );

// @TODO Is change supposed to be connected to http progress events from
// the browser? In this case would it modify the loadEnd estimate in the model?
export const Change/*:type.Change*/ = time =>
  ( { type: "Change"
    , time
    }
  );

export const End/*:type.End*/ = time =>
  ( { type: "End"
    , time
    }
  );

export const Tick/*:type.Tick*/ = time =>
  ( { type: "Tick"
    , time
    }
  );

// Start a new progress cycle.
const start = time =>
  [ { loadStart: time
    // Predict a 7s load if we don't know.
    , loadEnd: time + (7 * second)
    , updateTime: time
    }
  , Effects.tick(Tick)
  ];

// Invoked on End action and returns model with updated `timeStamp`:
//  [
//    {...model, loadEnd: timeStamp},
//    Effects.none
//  ]
const end = (time, model) =>
  // It maybe that our estimated load time was naive and we finished load
  // animation before we received loadEnd. In such case we update both `loadEnd`
  // & `updateTime` so that load progress will remain complete. Otherwise we
  // update `loadEnd` with `timeStamp + 500` to make progressbar sprint to the
  // end in next 500ms.
  ( model.loadEnd > model.updateTime
  ? [ merge(model, {loadEnd: time + 500}), Effects.none ]
  : [ merge
      ( model
      , { loadEnd: time + 500
        , updateTime: time + 500
        }
      )
    , Effects.none
    ]
  );

// Update the progress and request another tick.
// Returns a new model and a tick effect.
export const tick/*:type.tick*/ = (time, model) =>
  ( model.loadEnd > time
  ? [ merge(model, {updateTime: time}), Effects.tick(Tick) ]
  : [ merge(model, {updateTime: time}), Effects.none ]
  );

export const init/*:type.init*/ = () =>
  [null, Effects.none];

export const update/*:type.update*/ = (model, action) =>
  ( action.type === 'Start'
  ? start(action.time)
  : model == null
  ? start(action.time)
  : action.type === 'End'
  ? end(action.time, model)
  : action.type === 'Tick'
  ? tick(action.time, model)
  : Unknown.update(model, action)
  );

export const progress/*:type.progress*/ = (model) =>
  model ?
    ease(easeOutQuart, float, 0, 100,
      model.loadEnd - model.loadStart, model.updateTime - model.loadStart) : 0;

const style = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: '27px',
    height: '4px',
    width: '100%'
  },
  // This is the angle that we have at the end of the progress bar
  arrow: {
    width: '4px',
    height: '4px',
    position: 'absolute',
    servo$right: '-4px',
  },
});

// @TODO bring back color theme
export const view/*:type.view*/ = (model) =>
  html.div({
    className: 'progressbar',
    style: Style(style.bar, {
      backgroundColor: '#4A90E2',
      // @TODO this progress treatment is extremely naive and ugly. Fix it.
      transform: `translateX(${-100 + progress(model)}%)`,
      visibility: progress(model) < 100 ? 'visible' : 'hidden'
    }),
  }, [html.div({
    className: 'progressbar-arrow',
    style: Style(style.arrow, {
      backgroundImage: 'linear-gradient(135deg, #4A90E2 50%, transparent 50%)',
    })
  })]);
