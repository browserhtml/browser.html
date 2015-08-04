/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, render} = require('reflex');
  const WebView = require('browser/web-view');
  const {Style, StyleSheet} = require('common/style');
  const Favicon = require('common/favicon');
  const {ToggleDevtoolsHUD} = require('browser/devtools-hud');
  const Focusable = require('common/focusable');
  const TabMode = require('browser2/tabmode');

  exports.isVertical = true;
  exports.height = 0;

  // Action

  const style = StyleSheet.create({
    container: {
      display: 'flex',
      background: '#F5F5F5',
      flexDirection: 'column',
      flexShrink: '0',
      borderLeft: '0.5px solid #CBCBCB',
      padding: '0 0 12px 0', // room for native window resizer
    },
    spacer: {
      flexGrow: 1,
      MozWindowDragging: 'drag',
    },
    button: {
      fontFamily: 'FontIon',
      width: 16,
      margin: 6,
      lineHeight: '16px',
      textAlign: 'center',
      alignSelf: 'center',
      border: '0.5px solid #CBCBCB',
      borderRadius: '100px',
      backgroundColor: '#DDD',
      MozUserSelect: 'none',
    },
    tab: {
      color: '#777',
      padding: '6px',
      display: 'flex',
      MozUserSelect: 'none',
      cursor: 'default',
      borderBottom: '0.5px solid #CBCBCB'
    },
    selected: {
      backgroundColor: '#98C0EA',
    },
    favicon: {
      imageRendering: '-moz-crisp-edges',
      width: 16,
      height: 16,
      flexShrink: 0,
    },
    spinner: {
      flexShrink: 0,
      fontFamily: 'FontIon',
      width: 16,
      lineHeight: '16px',
      textAlign: 'center',
      color: '#4A90E2',
      animationName: 'spinner',
      animationDuration: '500ms',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
    },
  });

  // View

  const viewOneTab = (loader, page, progress, isSelected, address) => {
    const faviconURL = page.faviconURL || Favicon.getFallback(loader.uri);

    const icon = progress.loading ?
      html.div({
        style: style.spinner,
        onClick: address.pass(Focusable.Focus),
      }, '\uf29C') :
      html.img({
        style: style.favicon,
        alt: '',
        src: faviconURL,
        onClick: address.pass(Focusable.Focus),
      });

    return html.div({
      style: Style(style.tab, isSelected && style.selected),
    }, icon)
  }

  const viewTabs = (pages, loaders, progress, selected, address) =>
    loaders.map((loader, index) =>
        render(`Tab@${loader.id}`, viewOneTab,
               loader, pages.get(index),
               progress.get(index),
               index === selected,
               address.forward(action => WebView.Action({id: loader.id, action}))));

  const view = (tabMode, pages, loaders, progress, selected, address) =>
    html.div({
      style: style.container,
    }, [
      (selected != null) && html.div({
        style: style.button,
        onClick: address.send(WebView.Action({action: WebView.Close()})),
      }, '\uf404'),
      ...viewTabs(pages, loaders, progress, selected, address).reverse(),
      html.div({
        style: style.button,
        onClick: address.send(WebView.Action({action: WebView.Open()})),
      }, '\uf489'),
      html.div({style: style.spacer}),
      html.div({
        style: style.button,
        onClick: address.pass(ToggleDevtoolsHUD),
      }, '\uf2AD'),
      render('TabSwitcher', TabMode.tabSwitcherView, tabMode, address),
    ]);

  exports.view = view;

});

