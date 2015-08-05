/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record} = require('../common/typed');

  const GoBack = Record({
    id: '@selected'
  },'WebView.Navigation.GoBack');
  exports.GoBack = GoBack;

  const GoForward = Record({
    id: '@selected'
  }, 'WebView.Navigation.GoForward');
  exports.GoForward = GoForward;

  const Stop = Record({
    id: '@selected'
  }, 'WebView.Navigation.Stop');
  exports.Stop = Stop;

  const Reload = Record({
    id: '@selected'
  }, 'WebView.Navigation.Reload');
  exports.Reload = Reload;


  const webViewByID = id =>
    id === '@selected' ? document.querySelector('.web-view.selected') :
    document.querySelector(`#view-view-${id}]`);


  const service = address => action => {
    if (action instanceof GoBack) {
      const webView = webViewByID(action.id);
      webView && webView.goBack && webView.goBack();
    }

    if (action instanceof GoForward) {
      const webView = webViewByID(action.id);
      webView && webView.goForward && webView.goForward();
    }

    if (action instanceof Stop) {
      const webView = webViewByID(action.id);
      webView && webView.stop && webView.stop();
    }

    if (action instanceof Reload) {
      const webView = webViewByID(action.id);
      webView && webView.reload && webView.reload();
    }
  }
  exports.service = service;
