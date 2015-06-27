/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, moudle) => {

  'use strict';

  const {html, render} = require('reflex');
  const {Record, Union, List} = require('common/typed');
  const ClassSet = require('common/class-set');
  const WebViews = require('./web-view-deck');
  const WebView = require('./web-view');

  // Model

  const Model = Record({
    isActive: false
  }, 'Previews');
  exports.Model = Model;


  // Action

  const Activate = Record({
    isActive: true
  }, 'Preview.Activate');

  const Deactivate = Record({
    isActive: false
  }, 'Preview.Deactivate');

  const Action = Union({Activate, Deactivate});
  exports.Action = Action;

  const {PreviewByID, SelectByID} = WebViews.Action;

  // Update

  const update = (state, action) =>
    action instanceof Activate ? state.set('isActive', true) :
    action instanceof Deactivate ? state.set('isActive', false) :
    state;
  exports.update = update;

  // View

  const Close = (context, event) => {
    if (event.button === 1) {
      event.stopPropagation();
      return WebView.Close(context);
    }
    // We should probably just allow retuning null
    return {}
  }


  const viewPreview = (id, order, isPreviewed, thumbnail, address) => {
    const isDashboard = id === 'about:dashboard';
    const context = {id};

    return html.div({
      key: id,
      className: ClassSet({
        tab: true,
        selected: isPreviewed,
        'tab-dashboard': id === 'about:dashboard'
      }),
      style: {order},
      onMouseOver: address.pass(PreviewByID, context),
      onClick: address.pass(SelectByID, context),
      onMouseUp: address.pass(Close, context)
    }, [
      html.div({
        key: 'thumbnail',
        className: 'tab-thumbnail',
      }, [
        html.img({
          key: 'image',
          src: thumbnail,
          alt: '',
          onLoad: event => URL.revokeObjectURL(event.target.src)
        })
      ]),
      isDashboard ? null : html.div({
        key: 'close-button',
        onClick: address.pass(WebView.Close, context),
        className: 'tab-close-button fa fa-times',
      })
    ]);
  };
  exports.viewPreview = viewPreview;


  const selected = entry => entry.selected;

  const view = (webViews, theme, address) => {
    const {size} = webViews.entries
    const previewed = webViews.entries.get(webViews.previewed).view;

    return html.div({
      style: {
        backgroundColor: theme.shell,
        transition: 'background-color 300ms ease, color 300ms ease'
      },
      className: ClassSet({
        tabstripcontainer: true,
        isdark: theme.isDark
      }),
    }, [
      html.div({
        key: 'tabstrip',
        className: 'tabstrip',
      }, WebViews.order(webViews.entries).map(({view, selected}, index) =>
          render(view.id,
                 viewPreview,
                 view.id,
                 index,
                 view === previewed,
                 view.page.thumbnail,
                 address))),
      html.div({
        key: 'tabstrip-kill-zone',
        className: ClassSet({
          tabstripkillzone: true
        }),
        onMouseEnter: address.pass(Deactivate)
      })
    ]);
  };
  exports.view = view;

});
