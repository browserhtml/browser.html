/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const {Application, Address} = require('reflex');
  const Browser = require('./browser');
  const Thumbnail = require('service/thumbnail');
  const Keyboard = require('common/keyboard');
  const Navigation = require('service/navigation');
  const Session = require('./session');
  const Runtime = require('common/runtime');
  const Settings = require('service/settings');
  const Pallet = require('service/pallet');
  const Suggestion = require('service/suggestion');

  // Set up a address (message bus if you like) that will be used
  // as an address for all application components / services. This
  // address is going to receive action and then pass it on to each
  // application component for it handle it.
  const address = new Address({
    receive(action) {
      application.receive(action);
      thumbnail(action);
      runtime(action);
      keyboard(action);
      navigation(action);
      settings(action);
      pallet(action);
      suggestion(action);
    }
  });
  window.address = address;

  const application = new Application({
    target: document.body,
    state: Browser.Model(),
    update: Browser.update,
    view: Browser.view,
    address: address
  });
  window.application = application;

  const thumbnail = Thumbnail.service(address);
  const runtime = Runtime.service(address);
  const keyboard = Keyboard.service(address);
  const navigation = Navigation.service(address);
  const settings = Settings.service(address);
  const pallet = Pallet.service(address);
  const suggestion = Suggestion.service(address);

  // See src/prerendering.js
  document.body.innerHTML = '';
  application.render();
  window.localStorage.setItem('prerender', document.body.innerHTML);

  /*
  // I use this to fill prerendering in prerendering.js
  const div = document.createElement('div');
  div.innerHTML = document.body.innerHTML;
  Array.forEach(div.querySelectorAll('*'), elt => elt.removeAttribute('data-reactid'));
  console.log(div.innerHTML);
  */

  address.receive(Session.ResetSession());

  application.render();
});
