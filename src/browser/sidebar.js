/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk} from 'reflex';
import * as PerspectiveUI from './perspective-ui';
import {Style, StyleSheet} from '../common/style';
import {readTitle} from './web-view';

const sidebarToolbarHeight = '50px';

const style = StyleSheet.create({
  sidebar: {
    // WARNING: will slow down animations! (gecko)
    xBoxShadow: 'rgba(0, 0, 0, 0.5) -80px 0 100px',
    backgroundColor: '#2E3D4D',
    height: '100vh',
    position: 'absolute',
    right: 0,
    top: 0,
    width: '380px',
  },

  sidebarHidden: {
    transform: 'translateX(380px)',
  },

  scrollbox: {
    width: '100%',
    height: `calc(100% - ${sidebarToolbarHeight})`,
    paddingTop: '35px',
    overflowY: 'scroll',
  },

  tab: {
    borderRadius: '5px',
    padding: '0 15px',
    lineHeight: '35px',
    color: '#fff',
    fontSize: '14px',
    margin: '0 35px',
    overflow: 'hidden',
    padding: '0 10px 0 33px',
    position: 'relative',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  tabSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  title: {
    display: 'inline'
  },

  favicon: {
    borderRadius: '3px',
    left: '9px',
    position: 'absolute',
    top: '10px',
    width: '16px',
    height: '16px',
  }
});

const viewImage = (uri, style) =>
  html.img({
    style: Style({
      backgroundImage: `url(${uri})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      border: 'none'
    }, style)
  });

const viewTab = (model, address) =>
  html.div({
    className: 'sidebar-tab',
    style: Style(
      style.tab,
      model.isSelected && style.tabSelected
    )
  }, [
    thunk('favicon',
          viewImage,
          model.page && model.page.faviconURI,
          style.favicon),
    html.div({
      className: 'sidebar-tab-title',
      style: style.title
    }, [readTitle(model)])
  ]);

const ViewMode = (modeStyle) => ({entries}, address) =>
  html.div({
    className: 'sidebar',
    style: modeStyle
  }, [
    html.div({
      className: 'sidebar-tabs-scrollbox',
      style: style.scrollbox
    }, entries.map(entry => thunk(entry.id, viewTab, entry, address))),
    html.div({
      className: 'sidebar-toolbar'
    })
  ]);

const viewAsActive = ViewMode(style.sidebar);
const viewAsInactive = ViewMode(Style(style.sidebar, style.sidebarHidden));

// Export modal views
export const viewAsEditWebView = viewAsInactive;
export const viewAsCreateWebView = viewAsInactive;
export const viewAsShowWebView = viewAsInactive;
export const viewAsSelectWebView = viewAsInactive;
export const viewAsShowTabs = viewAsActive;
