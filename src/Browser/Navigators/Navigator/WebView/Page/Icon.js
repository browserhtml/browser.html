/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Image from '../../../../../common/image';
import * as Style from '../../../../../common/style';

export const view = Image.view('favicon', Style.createSheet({
  base: {
    borderRadius: '3px',
    left: '8px',
    position: 'absolute',
    top: '8px',
    width: '16px',
    height: '16px'
  }
}));

export type Action = Image.Message

export const Model = Image.Model
export const update = Image.update
