/* @noflow */

import {compose} from '../../../lang/functional';
import * as Driver from '@driver';
import * as Page from '../page';
import * as Security from '../security';

/*::
import type {Time, URI, Options, Action} from "../../web-view"
*/

export const Blur/*:Action*/ = { type: "Blur" };
export const Focus/*:Action*/ = { type: "Focus" };
export const Close/*:Action*/ = { type: "Close" };


export const LoadStart =
  (time/*:Time*/)/*:Action*/ =>
  ({type: 'LoadStart', time});

export const LoadEnd =
  (time/*:Time*/)/*:Action*/ =>
  ({type: 'LoadEnd', time});

export const Closed/*:Action*/ =
  { type: "Closed"
  };

export const Edit/*:Action*/ =
  { type: "Edit"
  };

export const ShowTabs/*:Action*/ =
  { type: 'ShowTabs'
  };

export const Create/*:Action*/ =
  { type: 'Create'
  };

export const Load =
  (uri/*:URI*/)/*:Action*/ =>
  ( { type: 'Load'
    , uri
    }
  );

export const OpenSyncWithMyIFrame =
  ({frameElement, uri, name, features}/*:Options*/)/*:Action*/ => {
    Driver.element.use(frameElement);
    return {
      type: "Open!WithMyIFrameAndInTheCurrentTick"
    , isForced: true
    , options: {uri, name, features, inBackground: false, frameElement: null}
    };
  };

export const ModalPrompt =
  (detail/*:any*/)/*:Action*/ =>
  ({type: "ModalPrompt", detail});

export const Authentificate =
  (detail/*:any*/)/*:Action*/ =>
  ({type: "Authentificate", detail});

export const ReportError =
  (detail/*:any*/)/*:Action*/ =>
  ({type: "Error", detail});

export const LocationChanged =
  (uri/*:URI*/, canGoBack/*:?boolean*/, canGoForward/*:?boolean*/, time/*:Time*/)/*:Action*/ =>
  ({type: 'LocationChanged', uri, canGoBack, canGoForward, time});

export const ContextMenu =
  (detail/*:any*/)/*:Action*/ =>
  ({type: "ContextMenu", detail});

const SecurityAction = action =>
  ({type: 'Security', action});

export const SecurityChanged =
  compose
  ( SecurityAction
  , Security.Changed
  );

const PageAction = action =>
  ({type: "Page", action});


export const FirstPaint = PageAction(Page.FirstPaint);
export const DocumentFirstPaint = PageAction(Page.DocumentFirstPaint);
export const TitleChanged =
  compose
  ( PageAction
  , Page.TitleChanged
  );
export const IconChanged =
  compose
  ( PageAction
  , Page.IconChanged
  );
export const MetaChanged =
  compose
  ( PageAction
  , Page.MetaChanged
  );
export const Scrolled =
  compose
  ( PageAction
  , Page.Scrolled
  );
export const OverflowChanged =
  compose
  ( PageAction
  , Page.OverflowChanged
  );
