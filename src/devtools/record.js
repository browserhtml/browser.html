/* @flow */

import {Effects, Task, html, thunk, forward} from "reflex"
import {merge, always} from "../common/prelude"
import {ok, error} from "../common/result"
import * as Runtime from "../common/runtime"
import * as Unknown from "../common/unknown"
import * as Style from "../common/style"

/*::
import {performance} from "../common/performance"
import type {Address, Never, DOM, Init, Update, View, AdvancedConfiguration} from "reflex"
import type {Result} from "../common/result"
import type {URI, ID} from "../common/prelude"

export type Time = number

export type Gist =
  { id: ID
  , url: URI
  , description: String
  , public: boolean
  , files:
    { "snapshot.json":
      { size: number
      , raw_url: URI
      , type: "application/json"
      , language: "JSON"
      , truncated: boolean
      , "content": JSON
      }
    }
  , html_url: URI
  , created_at: String
  , updated_at: String
  }

export type Event <action> =
  { time: Time
  , action: action
  }

export type Model <model, action> =
  { isUploading: boolean
  , description: string
  , record: ?Record<model, action>
  }

export type Action <model, action> =
  | { type: "NoOp" }
  | { type: "Debuggee", debuggee: action }
  | { type: "StartRecording" }
  | { type: "StopRecording" }
  | { type: "PrintSnapshot" }
  | { type: "PrintedSnapshot" }
  | { type: "PublishSnapshot" }
  | { type: "PublishedSnapshot", result: Result<Error, Gist> }

type Step <model, action> =
  [ Model<model, action>
  , Effects<Action<model, action>>
  ]
*/

class Record /*::<model, action>*/ {
  /*::
  version: number;
  time: Time;
  state: model;
  timeline: Array<Time>;
  events: Array<number>;
  index: Array<action>;

  lookup: Array<string>;
  */
  constructor(time/*:Time*/, state/*:model*/, version/*:number*/=0.1) {
    this.version = version;
    this.time = time;
    this.state = state;

    this.timeline = [];
    this.index = [];
    this.events = [];
    this.lookup = [];
  }
  static write(event/*:action*/, source/*:Record<model, action>*/)/*:Record<model, action>*/ {
    const record = new Record(source.time, source.state, source.version);

    record.timeline = [...source.timeline, performance.now() - source.time];

    // @TODO: We should serialize actions in chunks instead. To reduce size of
    // the record even further.
    const hash = JSON.stringify(event);
    const index = source.lookup.indexOf(hash);
    if (index < 0) {
      record.lookup = [...source.lookup, hash];
      record.index = [...source.index, event];
      record.events = [...source.events, source.index.length];
    }
    else {
      record.lookup = source.lookup;
      record.index = source.index;
      record.events = [...source.events, index];
    }

    return record
  }
  static encode(record/*:Record<model, action>*/)/*:string*/ {
    const string = JSON.stringify
    ( { version: record.version
      , time: record.time
      , state: record.state
      , timeline: record.timeline
      , events: record.events
      , index: record.index
      }
    )
    return string
  }
}


const NoOp = always({ type: "NoOp" });
const PrintSnapshot = { type: "PrintSnapshot" };
const PublishSnapshot = { type: "PublishSnapshot" };
const PrintedSnapshot = always({ type: "PrintedSnapshot" });
const PublishedSnapshot = /*::<model, action>*/
  (result/*:Result<Error, Gist>*/)/*:Action<model, action>*/ =>
  ( { type: "PublishedSnapshot"
    , result
    }
  );

export const init = /*::<model, action, flags>*/
  ()/*:Step<model, action>*/ =>
  ( [ { isUploading: false
      , description: ""
      , record: null
      }
    , Effects.none
    ]
  )

export const update = /*::<model, action>*/
  ( model/*:Model<model, action>*/
  , action/*:Action<model, action>*/
  )/*:Step<model, action>*/ =>
  ( action.type === "NoOp"
  ? nofx(model)
  : action.type === "StartRecording"
  ? startRecording(model)
  : action.type === "StopRecording"
  ? stopRecording(model)
  : action.type === "PrintSnapshot"
  ? printSnapshot(model)
  : action.type === "PrintedSnapshot"
  ? printedSnapshot(model)
  : action.type === "PublishSnapshot"
  ? publishSnapshot(model)
  : action.type === "PublishedSnapshot"
  ? publishedSnapshot(model, action.result)
  : action.type === "Debuggee"
  ? recordEvent(model, action.debuggee)
  : Unknown.update(model, action)
  )

const nofx = /*::<model, action>*/
  (model/*:model*/)/*:[model, Effects<action>]*/ =>
  [ model
  , Effects.none
  ]

const createSnapshot = /*::<model, action>*/
  (model/*:Model<model, action>*/)/*:Task<Error, string>*/ =>
  new Task((succeed, fail) => {
    try {
      succeed(JSON.stringify(window.application.model.value.debuggee))
    }
    catch (error) {
      fail(error)
    }
  })


const printSnapshot = /*::<model, action>*/
  (model/*:Model<model, action>*/)/*:Step<model, action>*/ =>
  [ merge(model, { status: 'Pending', description: 'Printing...' })
  , Effects.batch
    ( [ Effects.task
        ( createSnapshot(model)
          .chain(snapshot => Unknown.log(`\n\n${snapshot}\n\n`))
          .map(ok)
          .capture(reason => Task.succeed(error(reason)))
        )
        .map(NoOp)
      , Effects.task
        ( Task.sleep(200) )
        .map(PrintedSnapshot)
      ]
    )
  ];

const printedSnapshot = /*::<model, action>*/
  (model/*:Model<model, action>*/)/*:Step<model, action>*/ =>
  [ merge(model, { status: 'Idle', description: '' })
  , Effects.none
  ];

const publishSnapshot = /*::<model, action>*/
  (model/*:Model<model, action>*/)/*:Step<model, action>*/ =>
  [ merge(model, {isUploading: true, description: "Publishing..."})
  , Effects.task
    ( createSnapshot(model)
      .chain(uploadSnapshot)
      .map(ok)
      .capture(reason => Task.succeed(error(reason)))
    )
    .map(PublishedSnapshot)
  ]

const publishedSnapshot = /*::<model, action>*/
  ( model/*:Model<model, action>*/
  , result/*:Result<Error, Gist>*/
  )/*:Step<model, action>*/ =>
  [ merge(model, {isUploading: false, description: "" })
  , Effects.task
    ( result.isError
    ? Unknown.error(result.error)
    : Unknown.log(`Snapshot published as gist #${result.value.id}: ${result.value.html_url}`)
    )
    .map(NoOp)
  ]

const uploadSnapshot =
  (snapshot/*:string*/)/*:Task<Error, Gist>*/ =>
  new Task((succeed, fail) => {
    const request = new XMLHttpRequest({mozSystem: true});
    request.open('POST', 'https://api.github.com/gists', true);
    request.responseType = 'json';
    request.send
    ( JSON.stringify
      ( { "description": "Browser.html generated state snapshot"
        , "public": true
        , "files":
          { "snapshot.json":
            { "content": snapshot }
          }
        }
      )
    );

    request.onload = () =>
    ( request.status === 201
    ? succeed(request.response)
    : fail(Error(`Failed to upload snapshot : ${request.statusText}`))
    )
  });

const startRecording = /*::<model, action>*/
  ( model/*:Model<model, action>*/ )/*:Step<model, action>*/ =>
  nofx
  ( merge
    ( model
    , { record: new Record
        ( performance.now()
        , window.application.model.value.debuggee
        )
      }
    )
  )



const stopRecording =/*::<model, action>*/
  (model/*:Model<model, action>*/)/*:Step<model, action>*/ =>
  [ merge
    ( model
    , { record: null }
    )
  , Effects.task
    ( new Task((succeed) => {
        if (model.record != null) {
          console.log(`\n\n${Record.encode(model.record)}\n\n`);
        }
        succeed(void(0));
      })
    )
    .map(NoOp)
  ];

const recordEvent = /*::<model, action>*/
  ( model/*:Model<model, action>*/
  , action/*:action*/
  )/*:Step<model, action>*/ =>
  nofx
  ( model.record == null
  ? model
  : merge
    ( model
    , { record: Record.write(action, model.record)
      }
    )
  );

export const render = /*::<model, action>*/
  ( model/*:Model<model, action>*/
  , address/*:Address<Action<model, action>>*/
  )/*:DOM*/ =>
  html.dialog
  ( { id: "record"
    , style: Style.mix
      ( styleSheet.base
      , ( model.status === 'Pending'
        ? styleSheet.flash
        : styleSheet.noflash
        )
      )
    , open: true
    }
  , [ html.h1(null, [model.description])
    ]
  );

export const view = /*::<model, action>*/
  ( model/*:Model<model, action>*/
  , address/*:Address<Action<model, action>>*/
  )/*:DOM*/ =>
  thunk
  ( "record"
  , render
  , model
  , address
  );


const styleSheet = Style.createSheet
  ( { base:
      { position: "absolute"
      , pointerEvents: "none"
      , background: "#fff"
      , opacity: 0
      , height: "100%"
      , width: "100%"
      , transitionDuration: "50ms"
      // @TODO: Enable once this works properly on servo.
      // , transitionProperty: "opacity"
      , transitionTimingFunction: "ease"
      , textAlign: "center"
      , lineHeight: "100vh"
      }
    , flash:
      { opacity: 0.9
      }
    , noflash: null
    }
  );
