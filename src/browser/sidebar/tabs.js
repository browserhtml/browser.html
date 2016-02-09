/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge} from '../../common/prelude';
import {Style, StyleSheet} from '../../common/style';
import {cursor, join} from '../../common/cursor';
import * as Toolbar from './toolbar';
import * as Tab from './tab';
import * as Unknown from '../../common/unknown';

/*:: import * as type from "../../../type/browser/sidebar/tabs" */

const styleSheet = StyleSheet.create({
  base: {
    width: '100%',
    height: `calc(100% - ${Toolbar.styleSheet.base.height})`,
    // This padding matches title bar height.
    paddingTop: '32px',
    overflowY: 'scroll',
    boxSizing: 'border-box'
  }
});

export const Close/*:type.Close*/ = id =>
  ( { type: "Close"
    , id
    }
  );


export const Activate/*:type.Activate*/ = id =>
  ( { type: "Activate"
    , id
    }
  );

export const ByID/*:type.ByID*/ =
  id =>
  action =>
  ( action.type === "Close"
  ? Close(id)
  : action.type === "Activate"
  ? Activate(id)
  : { type: "Tab"
    , id
    , source: action
    }
  );


export const view/*:type.view*/ = (model, address, display) =>
  html.div
  ( { className: 'sidebar-tabs-scrollbox'
    , style: styleSheet.base
    }
  , model
      .order
      .map
      ( id =>
          thunk
          ( id
          , Tab.view
          , model.entries[id]
          , forward(address, ByID(id))
          , display
          )
      )
  );
