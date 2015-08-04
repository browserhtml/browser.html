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

  exports.isVertical = false;
  exports.height = 29.5;

  // Action

  const style = StyleSheet.create({
    container: {
      display: 'flex',
      background: '#F5F5F5',
      flexDirection: 'row',
      flexShrink: '0',
      borderTop: '0.5px solid #CBCBCB',
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
      fontSize: '12px',
      lineHeight: '14px',
      fontWeight: 'lighter',
      padding: '6px',
      display: 'flex',
      MozUserSelect: 'none',
      cursor: 'default',
      borderRight: '0.5px solid #CBCBCB',
      width: 120,
    },
    selected: {
      color: '#333',
      backgroundColor: '#DDD'
    },
    favicon: {
      imageRendering: '-moz-crisp-edges',
      width: 16,
      height: 16,
      flexShrink: 0,
    },
    title: {
      fontSize: '10px',
      flexGrow: 1,
      margin: '0 6px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: '16px',
    },
    close: {
      fontFamily: 'FontIon',
      textAlign: 'center',
      verticalAlign: 'middle',
      flexShrink: 0,
      width: 16,
      lineHeight: '16px',
    },
    spinner: {
      flexShrink: 0,
      fontFamily: 'FontIon',
      width: 16,
      height: 16,
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
    const title = page.title || loader.uri || 'New Tab';
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
    }, [
      icon,
      html.div({
        style: style.title,
        onClick: address.pass(Focusable.Focus),
      }, title),
      html.div({
        style: style.close,
        onClick: address.pass(WebView.Close)
      }, '\uf404'),
    ])
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
      style: style.container
    }, [
      ...viewTabs(pages, loaders, progress, selected, address).reverse(),
      html.div({
        style: style.button,
        onClick: address.send(WebView.Action({action: WebView.Open()})),
      }, '\uf489'),
      html.div({style: style.spacer}),
      html.div({style: style.button, onClick: address.pass(ToggleDevtoolsHUD)}, '\uf2AD'),
      render('TabSwitcher', TabMode.tabSwitcherView, tabMode, address),
    ]);

  exports.view = view;

});

