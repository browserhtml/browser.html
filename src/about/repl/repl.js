/* @noflow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge, always, batch, tag, tagged} from "../../common/prelude";
import {Style, StyleSheet} from '../../common/style';
import * as Cell from './cell';
import * as Settings from '../../common/settings';
import * as Unknown from '../../common/unknown';
import * as Host from './host';

import {onWindow} from "driver";

// Actions

const CreateCell =
  ( { type: "CreateCell"
    }
  );

const Focus =
  ( { type: "Focus"
    }
  );

const Evaluate =
  (id, input) =>
  ( { type: "Evaluate"
    , id
    , source: input
    }
  );

const Print =
  (id, version) =>
  result =>
  ( { type: "Print"
    , id
    , source: Cell.Print
      ( { version
        , result
        }
      )
    }
  );

const Terminate = tagged("Terminate");


const CellAction =
  id =>
  action =>
  CellActionByID(id, action);

const CellActionByID =
  (id, action) =>
  ( action.type === "Submit"
  ? { type: "Evaluate"
    , id
    , source: action.source
    }
  : { type: "Cell"
    , id
    , source: action
    }
  );


export const init =
  () =>
  createCell
  ( { nextID: 0
    , order: []
    , cells: {}
    , active: -1
    }
  );


const terminate =
  model =>
  [ model
  , Effects.none
  ];

const createCell =
  model => {
    const id = String(model.nextID);
    const [cell, fx] = Cell.init(id);
    const state = merge
      ( model
      , { nextID: model.nextID + 1
        , order: [...model.order, id]
        , active: id
        , cells: merge
          ( model.cells
          , {[id]: cell}
          )
        }
      );

    return [state, fx.map(CellAction(id))];
  }

const updateCell =
  (model, {id, source}) => {
    const [cell, fx] =
      Cell.update(model.cells[id], source);

    const result =
      [ merge
        ( model
        , { cells
          : merge
            ( model.cells
            , { [id]: cell }
            )
          }
        )
      , fx.map(CellAction(id))
      ]

    return result
  }

const focus =
  model =>
  updateCell(model, CellActionByID(model.active, Cell.Edit));

const evaluate =
  (model, {id, source}) =>
  [ model
  , Effects
    .task(Host.evaluate(id, source.value))
    .map(Print(id, source.version))
  ];

const isActive =
  (model, id) =>
  model.active === id;

const isLast =
  (model, id) =>
  model.order[model.order.length - 1] === id;

const print = (model, action) =>
  ( (isActive(model, action.id) && isLast(model, action.id))
  ? batch
    ( update
    , model
    , [ CreateCell
      , action
      ]
    )
  : updateCell(model, action)
  );

export const update =
  (model, action) =>
  ( action.type === 'Cell'
  ? updateCell(model, action)
  : action.type === 'Evaluate'
  ? evaluate(model, action)
  : action.type === 'Print'
  ? print(model, action)
  : action.type === 'Focus'
  ? focus(model)
  : action.type === 'CreateCell'
  ? createCell(model)
  : action.type === 'Terminate'
  ? terminate(model)
  : Unknown.update(model, action)
  );


const styleSheet = StyleSheet.create
  ( { base:
      { width: '100%'
      , height: '100%'
      , position: 'absolute'
      , top: '0px'
      , left: '0px'
      , color: '#839496'
      , backgroundColor: '#002b36'
      , fontSize: '12px'
      , fontFamily: 'Menlo, Courier, monospace'
      , lineHeight: '14px'
      , overflow: 'auto'
      }
    }
  );

export const view =
  (model, address) =>
  html.div
  ( { style: styleSheet.base
    , id: 'repl'
    , onWindowFocus: onWindow(address, always(Focus))
    }
  , [ ...Object
      .keys(model.cells)
      .map
      ( id =>
        Cell.view
        ( model.cells[id]
        , forward(address, CellAction(id))
        )
      )
    , html.meta
      ( { name: 'theme-color'
        , content: `${styleSheet.base.backgroundColor}|${styleSheet.base.color}`
        }
      )
    ]
  );
