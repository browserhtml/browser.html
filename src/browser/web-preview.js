/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const {html, render} = require('reflex');
  const ClassSet = require('common/class-set');
  const Preview = require('./preview-box');
  const WebViews = require('./web-view-deck');
  const Shell = require('./web-shell');
  const Input = require('./web-input');

  // Model

  const {PreviewByID, SelectByID} = WebViews.Action;
  const Close = (context, event) => {
    if (event.button === 1) {
      event.stopPropagation();
      return WebView.Close(context);
    }
    // We should probably just allow retuning null
    return {}
  }

  // View

  const DashboardIcon = '\uf067';

  const viewControls = (theme, address) => html.div({
    style: {
      position: 'absolute',
      right: '6px',
      top: '6px'
    }
  }, [
    html.button({
      key: 'dashboard-button',
      style: {
        color: 'inherit',
        lineHeight: '16px',
        fontFamily: 'FontAwesome',
        textAlign: 'center',
        fontSize: 16,
        verticalAlign: 'middle',
        cursor: 'default'
      },
      onClick: address.send(Input.Action.Focus({id: 'about:dashboard'}))
    }, DashboardIcon)
  ]);
  exports.viewControls = viewControls;

  const viewPreview = (id, uri, page, address) => {
    const context = {id};
    const image = page.hero.get(0) || page.thumbnail;
    const title = page.label || page.title;
    const name = page.name || uri;

    return html.div({
      key: id,
      className: 'card',
      style: {
        margin: '6px',
        borderRadius: '4px',
        height: '300px',
        width: '240px',
        backgroundColor: '#fff',
        color: '#555',
        display: 'inline-block',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden'
      },
      onClick: address.pass(Shell.Action.Focus, context),
      onMouseUp: address.pass(Close, context)
    }, [
      html.header({
        key: 'header',
        style: {
          textAlign: 'left',
          height: '24px',
          padding: '0 10px',
          position: 'relative'
        }
      }, [
        html.span({
          key: 'name',
          style: {
            display: 'block',
            fontSize: '12px',
            lineHeight: '24px',
            width: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }, name),
        html.span({
          key: 'icon',
          alt: '',
          style: {
            position: 'absolute',
            right: '5px',
            top: '5px',
            width: '16px',
            height: '16px',
            MozForceBrokenImageIcon: 0,
            backgroundImage: `url(${page.icon})`
          }
        })
      ]),
      html.div({
        style: {
          position: 'relative',
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          width: '240px',
          height: '150px',
        }
      }, [
        html.img({
          key: 'image',
          src: image,
          alt: '',
          style: {
            position: 'absolute',
            left: 0,
            zIndex: -1,
            width: 'inherit',
            height: 'inherit'
          },
          onLoad: event => URL.revokeObjectURL(event.target.src)
        })
      ]),
      html.div({
        key: 'title'
      }, title),
      html.p({
        key: 'description',
        style: {
          padding: '8px',
          textAlign: 'left',
          whiteSpace: 'normal'
        }
      }, page.description)
    ]);
  };
  exports.viewPreview = viewPreview;

  const view = (webViews, input, webView, theme, address) => html.div({
    style: {
      width: '100vw',
      height: '100vh',
      textAlign: 'center',
      paddingTop: 'calc(100vh / 2 - 150px)',
      backgroundColor: '#273340',
      overflowX: 'auto',
      position: 'absolute',
      top: 0,
      zIndex: 0,
      MozWindowDragging: "drag"
    }
  }, webViews
      .entries
      .map(({view}, index) =>
        render(`Card@${view.id}`, viewPreview,
               view.id, view.uri, view.page, address)));
  exports.view = view;

});
