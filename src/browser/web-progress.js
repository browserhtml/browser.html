/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union} = require('typed-immutable');
  const {StyleSheet, Style} = require('../common/style');
  const {html, thunk:render} = require('reflex');
  const Loader = require('./web-loader');

  // Model
  const Model = Record({
    loading: false
  });
  exports.Model = Model;

  // Action

  const LoadStarted = Record({
    uri: String,
    timeStamp: Number
  }, 'Progress.LoadStarted');
  exports.LoadStarted = LoadStarted;

  const LoadEnded = Record({
    uri: String,
    timeStamp: Number
  }, 'Progress.LoadEnded');
  exports.LoadEnded = LoadEnded;

  const Action = Union(Loader.Load, LoadStarted, LoadEnded);
  exports.Action = Action;

  // Update

  const update = (state, action) =>
    action instanceof Loader.Load ?
      state.clear() :
    action instanceof LoadStarted ?
      Model({loading: true}) :
    action instanceof LoadEnded ?
      Model({loading: false}) :
    state;
  exports.update = update;

  // View

  const style = StyleSheet.create({

    container: {
      width: '100%',
      height: '4px',
      minHeight: '4px',
      marginBottom: '-4px',
      position: 'relative',
      overflowX: 'hidden',
      pointerEvents: 'none',
      zIndex: 1,
    },

    bar: {
      position: 'absolute',
      top: 0,
      height: '4px',
      width: '100%',
      transitionProperty: 'transform, opacity',
      transitionDuration: '300ms, 200ms',
      transitionTimingFunction: 'ease-out',
      transitionDelay: '0s, 300ms',

      animationDuration: '10s',
      animationTimingFunction: 'cubic-bezier(0, 0.5, 0, 0.5)',

      transform: 'translateX(-100%)',
      opacity: 0,
    },
    hidden: {
      visibility: 'hidden'
    },
    visible: {
      visibility: 'visible'
    },
    loading: {
      animationName: 'progressBarLoading'
    },
    loaded: {
      transform: 'translateX(0px)',
      opacity: 0
    },

    arrow: {
      width: '4px',
      height: '4px',
      float: 'right',
      marginRight: '-4px',
    },

  });

  const progressbarView = (id, progress, isSelected, theme) => {
    return html.div({
      key: `progressbar-${id}`,
      className: `progressbar-${id}`,
      style: Style(style.bar,
                   !isSelected ? style.hidden : style.visible,
                   !progress.loading ? style.loaded : style.loading, {
                     backgroundColor: theme.progressBar
                   }),
    }, [html.div({
      key: `progressbar-arrow-${id}`,
      style: Style(style.arrow, {
        backgroundImage: `linear-gradient(135deg, ${theme.progressBar} 50%, transparent 50%)`,
      })
    })]);
  };

  const view = (mode, loaders, progress, selected, theme) => {
    return html.div({
      key: 'progressbars',
      className: 'web-progress',
      style: style.container
    }, [...loaders.map((loader, index) =>
      render(`progressbar@${loader.id}`, progressbarView,
             loader.id,
             progress.get(index),
             // If not in show-web-view pass -1 to hide all progressbars.
             mode === 'show-web-view' && index === selected,
             theme))]);
  };

  exports.view = view;
