/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const {html, render} = require('reflex');
  const WebView = require('./web-view');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const {Style, StyleSheet} = require('common/style');

  // Model

  const {PreviewByID, SelectByID} = WebView.Action;
  const Close = (context, event) => {
    if (event.button === 1) {
      event.stopPropagation();
      return WebView.Close(context);
    }
    // We should probably just allow retuning null
    return {}
  }


  // View


  const styleControls = StyleSheet.create({
    panel: {
      position: 'absolute',
      right: '6px',
      top: '6px'
    },
    button: {
      color: 'inherit',
      lineHeight: '16px',
      fontFamily: 'FontAwesome',
      textAlign: 'center',
      fontSize: 16,
      verticalAlign: 'middle',
      cursor: 'default'
    }
  });

  const DashboardIcon = '\uf067';

  const viewControls = (theme, address) => html.div({
    style: styleControls.panel
  }, [
    html.button({
      key: 'dashboard-button',
      style: styleControls.button,
      onClick: address.send(Input.Action.Focus({id: 'about:dashboard'}))
    }, DashboardIcon)
  ]);
  exports.viewControls = viewControls;

  const stylePreview = StyleSheet.create({
    card: {
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
    selected: {
      boxShadow: '0 0 0 6px rgb(73, 135, 205)'
    },
    header: {
      textAlign: 'left',
      height: '24px',
      padding: '0 10px',
      position: 'relative'
    },
    title: {
      display: 'block',
      fontSize: '12px',
      lineHeight: '24px',
      width: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    icon: {
      position: 'absolute',
      right: '5px',
      top: '5px',
      width: '16px',
      height: '16px',
      MozForceBrokenImageIcon: 0
    },
    image: {
      position: 'relative',
      backgroundImage: null,
      backgroundSize: 'cover',
      width: '240px',
      height: '150px',
    },
    imageLoader: {
      position: 'absolute',
      left: 0,
      zIndex: -1,
      width: 'inherit',
      height: 'inherit'
    },
    description: {
      padding: '8px',
      textAlign: 'left',
      whiteSpace: 'normal'
    }
  });

  const viewPreview = (loader, page, isSelected, address) => {
    const image = page.hero.get(0) || page.thumbnail;
    const title = page.label || page.title;
    const name = page.name || loader.uri;

    return html.div({
      className: 'card',
      style: Style(stylePreview.card,
                   isSelected && stylePreview.selected),
      onClick: address.pass(Shell.Action.Focus, loader),
      onMouseUp: address.pass(Close, loader)
    }, [
      html.header({
        key: 'header',
        style: stylePreview.header,
      }, [
        html.span({
          key: 'name',
          style: stylePreview.title,
        }, name),
        html.span({
          key: 'icon',
          alt: '',
          style: Style(stylePreview.icon, {
            backgroundImage: `url(${page.icon})`
          })
        })
      ]),
      html.div({
        style: Style(stylePreview.image, {
          backgroundImage: `url(${image})`
        })
      }, [
        html.img({
          key: 'image',
          src: image,
          alt: '',
          style: stylePreview.imageLoader,
          onLoad: event => URL.revokeObjectURL(event.target.src)
        })
      ]),
      html.div({
        key: 'title'
      }, title),
      html.p({
        key: 'description',
        style: stylePreview.description
      }, page.description)
    ]);
  };
  exports.viewPreview = viewPreview;

  const style = StyleSheet.create({
    preview: {
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
  });

  const view = (loaders, pages, input, selected, theme, address) =>
    html.div({style: style.preview},
      loaders
        .map((loader, index) =>
          render(`Preview@${loader.id}`, viewPreview,
                 loader, pages.get(index),
                 index === selected, address)));
  exports.view = view;

});
