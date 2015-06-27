/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {getDomainName} = require('common/url-helper');
  const {Record, Maybe} = require('typed-immutable/index');

  const Color = String;

  const Model = Record({
    isDark: false,
    glyphsShowing: false,

    // reload, stop, back button color.
    controlButton: Color('rgba(0,0,0,0.5)'),

    closeButton: Color('#FC5753'),
    minButton: Color('#FDBC40'),
    maxButton: Color('#33C748'),

    inputText: Color('rgba(0,0,0,0.65)'),
    locationText: Color('rgba(0,0,0, 0.65)'),
    titleText: Color('rgba(0,0,0,0.5)'),
    locationBar: Color('#E1E9F0'),

    shell: Color('#fff'),
    shellText: Color('rgba(0,0,0, 0.65)'),

    progressBar: Color('#82D3FD')
  }, 'Theme');

  exports.Model = Model;


  exports.read = (pallet={}) => {
    const foreground = pallet.foreground || void(0);
    const background = pallet.background || void(0);
    return Model({
      isDark: pallet.isDark,

      closeButton: foreground,
      minButton: foreground,
      maxButton: foreground,

      controlButton: foreground,

      inputText: foreground,
      locationText: foreground,
      titleText: foreground,
      locationBar: pallet.isDark ? 'rgba(255,255,255,0.15)' :
                   'rgba(0,0,0,0.07)',

      shell: background,
      shellText: foreground,

      progressBar: foreground
    });
  };
});
