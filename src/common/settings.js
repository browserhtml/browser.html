/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* @flow */

/*:: import * as type from '../../type/common/devtools' */

import * as Settings from '../common/settings';
import * as Runtime from '../common/runtime';
import {merge} from '../common/prelude';
import {Effects, Task} from 'reflex';

export const NotSupported = {
  type: "Settings.NotSupported",
  description: "navigator.mozSettings API is not available"
};

export const asFetched = settings => ({
  type: "Settings.Fetched",
  settings
});

export const asFetchError = error => ({
  type: "Settings.FetchError",
  error: error
});

export const asUpdated = settings => ({
  type: "Settings.Updated",
  settings
});

export const asUpdateError = error => ({
  type: "Settings.UpdateError",
  error
});

export const asChanged = (name, value) => ({
  type: "Settings.Changed",
  name, value
});

export const makeHash = pairs =>
  pairs.reduce((result, [key, value]) => {
    result[key] = value
    return result
  }, {});

export const fetch = (names) =>
  Effects.task(Task.future(() => {
    if (navigator.mozSettings) {
      const lock = navigator.mozSettings.createLock();
      const settings = names
        .map(name =>
              lock.get(name)
                  .then(result => [name, result[name]]));

      return Promise.all(settings)
                    .then(makeHash)
                    .then(asFetched)
                    .catch(asFetchError);
    } else {
      return Promise.resolve(NotSupported);
    }
  }));

export const update = (settings) =>
  Effects.task(Task.future(() => {
    if (navigator.mozSettings) {
      const lock = navigator.mozSettings.createLock();
      return lock.set(settings)
                 .then(_ => asUpdated(settings))
                 .catch(asUpdateError);
    } else {
      return Promise.resolve(NotSupported);
    }
  }));

export const observe = (name) =>
  Effects.task(Task.io(deliver => {
    const observer = change => {
      navigator.mozSettings.removeObserver(name, observer);
      deliver(Task.succeed(asChanged(change.settingName, change.settingValue)));
    }

    if (navigator.mozSettings) {
      navigator.mozSettings.addObserver(name, observer);
    } else {
      deliver(Task.fail(NotSupported));
    }
  }));
