/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/*::
import type {Address, DOM} from "reflex"
import type {Model, Action} from './devtools'
import type {Result} from "./result"
*/

import {Effects, html, forward} from 'reflex';
import {Style, StyleSheet} from '../common/style';
import * as Unknown from "../common/unknown";
import {always, merge} from '../common/prelude';

export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  [
    { reports: [] }
    , Effects.none
  ];

export const DismissReport/*:() => Action*/ = always({type: "DismissReport"});
export const FileReport/*:() => Action*/ = always({type: "FileReport"});
  
export const update = 
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
  if (action.type === "ReportWebviewCrash") {
    var report = {
      title: action.source.description,
      url: action.source.url,
      backtrace: action.source.backtrace,
    };
    return [merge(model, {reports: [...model.reports, report]}), Effects.none]
  } else if (action.type === "DismissReport") {
    return [merge(model, {reports: model.reports.slice(1)}), Effects.none];
  } else if (action.type === "FileReport") {
    var report = model.reports.shift();
    var body = encodeURIComponent(`
${report.title}
### URL:
${report.url}
### Backtrace:
\`\`\`
${report.backtrace}
\`\`\`
`);
    var url = `https://github.com/servo/servo/issues/new?title=${encodeURIComponent(report.title)}&body=${body}`;
    console.log("OPEN:" + url);
    window.openURLInDefaultBrowser(url);
    return [merge(model, {reports: [...model.reports]}), Effects.none];
  } else {
    return Unknown.update(model, action);
  }
}

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ => {

  var report_available = model.reports.length > 0;
  if (!report_available) {
    return html.div();
  }
  
  console.log("PAUL: " + model.reports.length + " reports available");

  var report = model.reports[0];

  return html.div({
    style: {
      position: "absolute",
      bottom: "0px",
      left: "0px",
      padding: "0 10px",
      width: "100vw",
      height: "50vh",
      backgroundColor: "#FAFAFA",
      borderTop: "1px solid #CCC",
    }
  }, [
    html.strong({
      style: {
        display: "inline-block",
        height: "20px",
        margin: "10px 0",
      }
    }, [`Servo has encountered a problem: ${report.title} (${report.url})`]),
    html.div({
      style: {
        fontSize: "16px",
        position: "absolute",
        top: 0,
        right: "30px",
        cursor: "pointer",
      },
      onClick: forward(address, DismissReport)
    }, ["✕"]),
    html.pre({
      style: {
        height: "calc(50vh - 114px)",
        width: "calc(100vw - 40px)",
        padding: "10px",
        overflow: "scroll",
        backgroundColor: "white",
        border: "1px solid #EEE",
      },
    }, [report.backtrace]),
    html.div({
      style: {
        display: "inline-block",
        cursor: "pointer",
        margin: "10px 0",
        padding: "0 10px",
        textAlign: "center",
        lineHeight: "30px",
        borderRadius: "3px",
        backgroundImage: "linear-gradient(#fcfcfc, #eee)",
        border: "1px solid #d5d5d5",
      },
      onClick: forward(address, FileReport)
    }, ["Click to report problem to github"]),
    html.em({
      style: {
        display: "inline-block",
        margin: "10px 0",
        padding: "0 10px",
        lineHeight: "30px",
        color: "grey",
      }
    }, ["// github.com will open in your default browser, with a prefilled issue"]),
  ])
}
