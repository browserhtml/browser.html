/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function(require, exports, module) {

  'use strict';

  const React = require('react');
  const Cursor = require('immutable/cursor');

  // Function takes a React / Omniscient `Component`, `initial` state in form of
  // immutable data structure from `immutable.js` and a `target` DOM element into
  // which render loop will be writing using react. Component will be passed a
  // cursor for the inital state, any update with in the cursor will re-trigger
  // render loop.
  var render = (Component, initial, target) => {
    let current = null;

    const draw = () => {
      window.state = current;
      if (window.debug) {
        console.log('! render', current.toJSON());
      }
      // create a cursor for a current up to date state with a
      // step as change handler, to retriger render loop on change.
      const cursor = Cursor.from(current, step);
      // Finally use React to render current state with a component.
      React.render(Component(cursor), target);
    }

    const step = (to, from, path) => {
      // Note that only components that rely on state that changed
      // will be retriggered during rendering. This implies that some components
      // may be holding onto old cursors. If that is the case state `from` which
      // update was triggered won't match `current` state, there for we need to
      // be smart about handling updates.

      // If state update came `from` matches `current` state than component
      // triggering it was up to date & we just swap the current state to a
      // state it was updated `to`.
      if (current == from) {
        current = to;
      } else {
        // Othewise update was triggered from component that skipped update(s)
        // there for we can't just swap `current` state, instead we should focus
        // on changes under the `path` that were updated and apply those to the
        // current `state`.

        // If path was removed & it does exist in current state we remove
        // it from current state.
        if (!to.hasIn(path) && current.hasIn(path)) {
          current = current.removeIn(path);
        } else {
          // Otherwise we swap the state under the current path.
          current = current.setIn(path, to.getIn(path));
        }
      }

      if (window.debug) {
        console.log('! update', path.join('.'), current.toJSON());
      }


      draw();
    }

    // Spawn render loop by stepping into!
    step(initial, null, []);
  };

  // Exports:

  exports.render = render;

});
