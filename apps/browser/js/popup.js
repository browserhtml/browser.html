/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * popup.js
 *
 * This provides popups for error handling throughout browser.html
 *
 */

define([],
       function() {

  'use strict';

  let link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/popup.css';
  let defaultStyleSheet = document.querySelector('link[title=default]');
  document.head.insertBefore(link, defaultStyleSheet.nextSibling);

  let html = `<div class="popup"><h1 flex="1">headerinsert</h1><div class="content" flex="1">contentinsert</div><button class="close" flex="1">btinsert</button></div>`;

  const Popup = {
    openPopup: function(options) {

      var generatedhtml = html;
      generatedhtml = generatedhtml.replace('headerinsert', options.title).replace('contentinsert', options.content);
      if (options.buttontext) {
        generatedhtml = generatedhtml.replace('btinsert', options.buttontext);
      } else {
        generatedhtml = generatedhtml.replace('btinsert', 'Okay');
      }

      if (options.page) {
        var currentTabFrame = options.tabiframetarget;
        currentTabFrame.insertAdjacentHTML('BeforeEnd', generatedhtml);
      } else {
        var body = document.body;
        var placeholder = document.createElement('div');
        var outervbox = document.querySelector('#outervbox');
        body.insertBefore(placeholder, outervbox);
        placeholder.outerHTML = generatedhtml;
      }

      document.querySelector('.popup > button').onclick = null;
      document.querySelector('.popup > button').addEventListener('click', Popup.closePopup);
    },

  closePopup: function() {
    var el = document.querySelector('.popup');
    el.parentNode.removeChild(el);
    document.querySelector('.popup > button').onclick = null;
    document.querySelector('.popup > button').addEventListener('click', Popup.closePopup);
  },
  }

  return Popup;
});
