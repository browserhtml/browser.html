/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward} from 'reflex';
import {asByID} from './web-views';
import * as WebView from './web-view';
import {Style, StyleSheet} from '../common/style';
import {readTitle, readFaviconURI} from './web-view';

const sidebarToolbarHeight = '50px';

const styles = StyleSheet.create({
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

  scrollbox: {
    width: '100%',
    height: `calc(100% - ${sidebarToolbarHeight})`,
    paddingTop: '35px',
    overflowY: 'scroll',
  },

  tab: {
    MozWindowDragging: 'no-drag',
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
    backgroundColor: '#3D5166',
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
      styles.tab,
      model.isSelected && styles.tabSelected
    ),
    onClick: () => address(WebView.Activate)
  }, [
    thunk('favicon',
          viewImage,
          readFaviconURI(model),
          styles.favicon),
    html.div({
      className: 'sidebar-tab-title',
      style: styles.title
    }, [
      // @TODO localize this string
      readTitle(model, 'Untitled')
    ])
  ]);

export const view = ({entries}, address, style) =>
  html.div({
    className: 'sidebar',
    style: Style(styles.sidebar, style),
  }, [
    html.div({
      className: 'sidebar-tabs-scrollbox',
      style: styles.scrollbox
    }, entries.map(entry =>
        thunk(entry.id, viewTab, entry, forward(address, asByID(entry.id))))),
    html.div({
      className: 'sidebar-toolbar'
    })
  ]);
