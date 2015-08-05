/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {getDomainName} = require('../common/url-helper');
  const {Record, Maybe} = require('typed-immutable');

  const Color = String;

  const Model = Record({
    isDark: false,

    inputText: Color('rgba(0,0,0,0.65)'),
    locationText: Color('rgba(0,0,0,0.65)'),
    titleText: Color('rgba(0,0,0,0.5)'),
    locationBar: Color('rgba(0,0,0,0.07)'),

    shell: Color('#fff'),
    shellText: Color('rgba(0,0,0,0.65)'),

    progressBar: Color('#4A90E2')
  }, 'Theme');
  exports.Model = Model;

  exports.dashboard = Model({
    isDark: true,

    inputText: Color('rgba(255,255,255,0.65)'),
    locationText: Color('rgba(255,255,255,0.65)'),
    titleText: Color('rgba(255,255,255,0.5)'),
    locationBar: 'rgba(255,255,255,0.15)',

    shell: Color('#273340'),
    shellText: Color('rgba(255,255,255,0.65)'),

    progressBar: Color('#4A90E2')
  });

  exports.default = Model();

  exports.read = (pallet) => {
    const foreground = pallet && pallet.foreground || void(0);
    const background = pallet && pallet.background || void(0);
    return !pallet ? Model() : Model({
      isDark: pallet.isDark,

      inputText: foreground,
      locationText: foreground,
      titleText: foreground,
      locationBar: pallet.isDark ? 'rgba(255,255,255,0.15)' :
                   'rgba(0,0,0,0.07)',

      shell: background,
      shellText: foreground,

      progressBar: foreground
    });
  }
