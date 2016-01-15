/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward, Task} from "reflex"
import {partial} from "../lang/functional"
import {always, merge} from "../common/prelude"
import * as Result from "../common/result"
import * as Runtime from "../common/runtime"
import * as Unknown from "../common/unknown"
import * as URI from "../common/url-helper"
import * as WhatWGFetch from "../polyfill/fetch"
import {Style, StyleSheet} from '../common/style'

/*:: import * as type from "../../type/browser/updater" */

const second = 1000;
const minute = 60 * second;

const defaultUpdateURI = 'https://api.github.com/repos/mozilla/browser.html/contents/HEAD?ref=refs/heads/gh-pages'

const VERSION_SETTING_NAME = 'browserhtml.HEAD_HASH';

const ApplyUpdates/*:type.ApplyUpdates*/ =
  { type: 'ApplyUpdates'
  };

const RuntimeUpdateAvailable/*:type.RuntimeUpdateAvailable*/ =
  { type: 'RuntimeUpdateAvailable'
  };

const ApplicationVersionFetched = version =>
  ( { type: 'ApplicationVersionFetched'
    , version
    }
  );

const AvailableApplicationVersionFetched = response =>
  ( { type: 'AvailableApplicationVersionFetched'
    , response
    }
  );

export const CheckApplicationUpdate/*:type.CheckApplicationUpdate*/ =
  { type: "CheckApplicationUpdate"
  };

export const CheckRuntimeUpdate/*:type.CheckRuntimeUpdate*/ =
  { type: "CheckRuntimeUpdate"
  };

const Report = result =>
  ( { type: "Report"
    , result: result
    }
  );

const ApplicationVersionResponse = (eTag, pollInterval, time, version) =>
  ( { eTag
    , pollInterval
    , time
    , version
    }
  );


// IO

const decodeVersion = data =>
  ( ( data == null || data.content == null )
  ? Result.error(`Unable to decode fetched application version from response:\n ${JSON.stringify(json, 2, 2)}`)
  : Result.ok(atob(data.content.toString()))
  );

const decodeApplicationUpdateResponse = response => {
  const eTag = response.headers.get('ETag');
  const xPoll = response.headers.get('X-Poll-Interval');
  const pollInterval =
    ( typeof(xPoll) === "string"
    ? parseInt(xPoll) * second
    : null
    );
  const time = Date.now();

  const result =
    ( response.status === 200
    ? response
        .json()
        .then(decodeVersion)
        .then(partial(ApplicationVersionResponse, eTag, pollInterval, time))
    : response.status === 304
    ? ApplicationVersionResponse
      ( eTag
      , pollInterval
      , time
      , Result.ok(null)
      )
    : ApplicationVersionResponse
      ( eTag
      , pollInterval
      , time
      , Result.error
        ( Error(`Failed to check remote updates ${response.statusText}`)
        )
      )
    );

  return result;
}


export const fetchAvailableApplicationVersion/*:type.fetchAvailableApplicationVersion*/ =
  (uri, eTag) =>
  Task.future(() => {
    // Will tell github to return 304 (Not Modified) if nothing changed
    const headers =
      ( eTag == null
      ? {}
      : { 'If-None-Match': eTag }
      );

    const result =
      fetch(uri, {headers})
        .then(decodeApplicationUpdateResponse)
        .then(Result.ok, Result.error);

    return result
  });

export const receiveRuntimeUpdateAvailableNotification/*:type.receiveRuntimeUpdateAvailableNotification*/ =
  Runtime
  .receive('update-available')
  .map(always(RuntimeUpdateAvailable));

export const checkRuntimeUpdate/*:type.checkRuntimeUpdate*/ =
  Runtime.send({ type: 'force-update-check' });

const decodeApplicationVersionResponse = response =>
  ( response.status === 200
  ? response.text().then(Result.ok, Result.error)
  : Result.error(Error(`Can't reach HEAD: ${response.statusText}`))
  );

const checkApplicationVersion/*:type.checkApplicationVersion*/ =
  (applicationURI) =>
  Task.future(() => {
    const uri = URI.resolve(applicationURI, 'HEAD');
    const {hostname} = URI.parse(uri);

    const isLocal =
      hostname === '0.0.0.0' ||
      hostname === '127.0.0.1' ||
      hostname === 'localhost';

    const result =
      ( isLocal
      ? Promise.resolve(Result.ok(null))
      : fetch(uri)
        .then(decodeApplicationVersionResponse)
      );

    return result
  });

// Util

const isRuntimeUpdateAvailable = ({runtime}) =>
  runtime.isUpdateAvailable;

const isApplicationUpdateAvailable = ({application}) =>
  ( application.version == null
  ? false
  : application.availableVersion == null
  ? false
  : application.version !== application.availableVersion
  )

// Update

export const init/*:type.init*/ =
  (updateURI=defaultUpdateURI, applicationURI=location.href) =>
  [ { application:
      { applicationURI
      , updateURI
      , eTag: null
      , pollInterval: 10 * minute
      , lastChecked: null
      , version: null
      , availableVersion: null
      }
    , runtime:
      { isUpdateAvailable: false
      }
    }
  , Effects.batch
    ( [ Effects
        .task(receiveRuntimeUpdateAvailableNotification)
      , Effects
        .task(checkApplicationVersion(applicationURI))
        .map(ApplicationVersionFetched)
      , Effects
        .task(fetchAvailableApplicationVersion(updateURI, null))
        .map(AvailableApplicationVersionFetched)
      ]
    )
  ];

const handleRuntimeUpdateCheck = model =>
  [ model
  , Effects
    .task(checkRuntimeUpdate)
    .map(Result.ok)
    .map(Report)
  ];

const checkApplicationUpdate = model =>
  [ model
  , Effects.batch
    ( [ Effects
        .task(fetchAvailableApplicationVersion(model.application.updateURI, model.eTag))
        .map(AvailableApplicationVersionFetched)
      , ( model.application.version == null
        ? Effects
            .task(checkApplicationVersion(model.application.applicationURI))
            .map(ApplicationVersionFetched)
        : Effects.none
        )
      ]
    )
  ];

const updateRuntimeAvailable = model =>
  [ merge(model, {runtime: merge(model.runtime, {isUpdateAvailable: true})})
  , Effects.none
  ];

const updateApplicationVersion = (model, version) =>
  ( version.isOk
  ? [ merge
      ( model
      , { application: merge(model.application, { version: version.value }) }
      )
    , Effects.none
    ]
  : [ model
    , Effects.task(Unknown.error(version.error))
    ]
  );


const updateApplicationAvailable = (model, response) =>
  ( response.isOk
  ? updateAvailableApplicationInfo(model, response.value)
  : [ model
    , Effects.task(Unknown.error(version.error))
    ]
  );

const updateAvailableApplicationInfo = (model, result) =>
  [ merge
    ( model
    , { application:
        merge
        ( model.application
        , { eTag:
            ( result.eTag == null
            ? model.application.eTag
            : result.eTag
            )
          , lastChecked: result.time
          , pollInterval:
            ( result.pollInterval == null
            ? model.application.pollInterval
            : result.pollInterval
            )
          , availableVersion:
            ( result.version.isError
            ? model.application.availableVersion
            : result.version.value == null
            ? model.application.availableVersion
            : result.version.value
            )
          }
        )
      }
    )
  , ( result.version.isOk
    ? Effects.none
    : Effects.task(Unknown.error(result.version.error))
    )
  ];

const applyUpdates = model =>
  [ model
  , ( isApplicationUpdateAvailable(model)
    ? ( isRuntimeUpdateAvailable(model)
      ? Effects
        .task(Runtime.cleanRestart)
        .map(Report)
      : Effects
        .task(Runtime.cleanReload)
        .map(Report)
      )
    : ( isRuntimeUpdateAvailable(model)
      ? Effects
        .task(Runtime.restart)
        .map(Report)
      : Effects.none
      )
    )
  ];

const report = (model, result) =>
  [ model
  , ( result.isOk
    ? Effects.none
    : Effects.task(Unknown.error(result.error))
    )
  ];

export const update = (model, action) =>
  ( action.type === 'CheckRuntimeUpdate'
  ? handleRuntimeUpdateCheck(model)
  : action.type === 'RuntimeUpdateAvailable'
  ? updateRuntimeAvailable(model)

  : action.type === 'CheckApplicationUpdate'
  ? checkApplicationUpdate(model)
  : action.type === 'AvailableApplicationVersionFetched'
  ? updateApplicationAvailable(model, action.response)

  : action.type === 'ApplicationVersionFetched'
  ? updateApplicationVersion(model, action.version)

  : action.type === 'ApplyUpdates'
  ? applyUpdates(model)

  : action.type === 'Report'
  ? report(model, action.result)

  : Unknown.update(model, action)
  );


// View

const styleSheet = StyleSheet.create
  ( { base:
      { position: 'fixed'
      , bottom: '10px'
      , width: '400px'
      , left: 'calc(50vw - 200px)'
      , backgroundColor: 'rgba(36,60,83,0.95)'
      , borderRadius: '4px'
      , padding: '8px'
      , color: 'white'
      , transition: 'opacity 500ms ease-in'
      , fontWeight: '200'
      , cursor: 'default'
      }
    , visible:
      {

      }
    , hidden:
      { opacity: 0
      , pointerEvents: 'none'
      }
    , button:
      { padding: '8px 20px'
      , backgroundColor: 'rgb(115,206,113)'
      , color: 'inherit'
      , borderRadius: '4px'
      , float: 'right'
      , cursor: 'pointer'
      }
    , message:
      { float: 'left'
      , padding: '8px'
      }
    }
  );

export const view/*:type.view*/ = (model, address) =>
  html.div
  ( { style: Style
      ( styleSheet.base
      , ( isRuntimeUpdateAvailable(model)
        ? styleSheet.visible
        : isApplicationUpdateAvailable(model)
        ? styleSheet.visible
        : styleSheet.hidden
        )
      )
    }
  , [ html.div
      ( { key: 'bannerMessage'
        , style: styleSheet.message
        }
      , [ 'Hey! An update just for you!'
        ]
      )
    , html.button
      ( { key:  'bannerButton'
        , style: styleSheet.button
        , onClick: forward(address, always(ApplyUpdates))
        }
      , [ isRuntimeUpdateAvailable(model)
        ? `Apply (restart required)`
        : `Apply`
        ]
      )
    ]
  );
