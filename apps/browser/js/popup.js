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
  
    let html = `<div class="popup"><h1 flex="1"></h1><div class="content" flex="1"></div><button class="close" flex="1"></button></div>`;
  let body = document.body;
  let placeholder = document.createElement('div');
  let outervbox = document.querySelector("#outervbox");
  body.insertBefore(placeholder, outervbox);
  placeholder.outerHTML = html;

  let el = document.querySelector(".popup");
  let elheading = document.querySelector(".popup > h1");
  let elcontent = document.querySelector(".popup > .content");
  let elbutton = document.querySelector(".popup > button");

  const Popup = {
    openPopup: function(options) {
      elheading.innerHTML = options.title;
      elcontent.innerHTML = options.content;
      
      if(options.buttontext) {
      elbutton.innerHTML = options.buttontext;
        }
      else {
      elbutton.innerHTML = "Okay";
      }
      
      el.style.display = "flex";
    },
  closePopup: function() {
    el.style.display = "none";
    },
  }
  
  elbutton.addEventListener("click", Popup.closePopup);
  return Popup;
});
