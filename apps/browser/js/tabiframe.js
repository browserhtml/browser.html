/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * tabiframe.js
 *
 * tabiframe implements the <tab-iframe> tab. It's a wrapper
 * around a <iframe mozbrowser>.
 *
 */

define(['js/eventemitter', 'js/popup'], function(EventEmitter, Popup) {

  'use strict';

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;

  const IFRAME_EVENTS = [
    'mozbrowserasyncscroll', 'mozbrowserclose', 'mozbrowsercontextmenu',
    'mozbrowsererror', 'mozbrowsericonchange', 'mozbrowserloadend',
    'mozbrowserloadstart', 'mozbrowserlocationchange', 'mozbrowseropenwindow',
    'mozbrowsersecuritychange', 'mozbrowsershowmodalprompt', 'mozbrowsertitlechange',
    'mozbrowserusernameandpasswordrequired'
  ];

  let tabIframeProto = Object.create(HTMLElement.prototype);

  tabIframeProto.setLocation = function(url) {
    if (!this._innerIframe) {
      this._createInnerIframe();
    }
    if (window.IS_PRIVILEGED) {
      this._innerIframe.src = url;
    } else {
      this._innerIframe.src = 'data:,' + url;
    }
  };

  tabIframeProto.willBeVisibleSoon = function() {
    if (window.IS_PRIVILEGED && this._innerIframe) {
      this._innerIframe.setVisible(true);
    }
  };

  tabIframeProto.show = function() {
    this.removeAttribute('hidden');
    if (window.IS_PRIVILEGED && this._innerIframe) {
      this._innerIframe.setVisible(true);
    }
    this.emit('visible');
  };

  tabIframeProto.hide = function() {
    this.setAttribute('hidden', 'true');
    if (window.IS_PRIVILEGED && this._innerIframe) {
      this._innerIframe.setVisible(false);
    }
    this.emit('hidden');
  };

  tabIframeProto.createdCallback = function() {
    this._zoom = 1;
    this._clearTabData();
    EventEmitter.decorate(this);
  };

  tabIframeProto._createInnerIframe = function() {
    let iframe = document.createElement('iframe');
    iframe.setAttribute('mozbrowser', 'true');
    iframe.setAttribute('flex', '1');
    iframe.setAttribute('remote', 'true');
    iframe.setAttribute('mozallowfullscreen', 'true');
    this.appendChild(iframe);
    for (let eventName of IFRAME_EVENTS) {
      iframe.addEventListener(eventName, this);
    }
    this._innerIframe = iframe;
    this._applyZoom();
  };

  tabIframeProto.attachedCallback = function() {
  };

  tabIframeProto.detachedCallback = function() {
    if (this._innerIframe) {
      for (let eventName of IFRAME_EVENTS) {
        this._innerIframe.removeEventListener(eventName, this);
      }
    }
  };

  tabIframeProto.zoomIn = function() {
    this._zoom += 0.1;
    this._zoom = Math.min(MAX_ZOOM, this._zoom);
    this._applyZoom();
  };

  tabIframeProto.zoomOut = function() {
    this._zoom -= 0.1;
    this._zoom = Math.max(MIN_ZOOM, this._zoom);
    this._applyZoom();
  };

  tabIframeProto.resetZoom = function() {
    this._zoom = 1;
    this._applyZoom();
  };

  tabIframeProto._applyZoom = function() {
    if (this._innerIframe && window.IS_PRIVILEGED) {
      this._innerIframe.zoom(this._zoom);
    }
  };

  tabIframeProto.reload = function() {
    if (this._innerIframe) this._innerIframe.reload();
  };

  tabIframeProto.stop = function() {
    if (this._innerIframe) this._innerIframe.stop();
  };

  tabIframeProto.goBack = function() {
    if (this._innerIframe) this._innerIframe.goBack();
  };

  tabIframeProto.goForward = function() {
    if (this._innerIframe) this._innerIframe.goForward();
  };

  tabIframeProto._clearTabData = function() {
    this._loading = false;
    this._title = '';
    this._location = '';
    this._favicon = '';
    this._securityState = 'insecure';
    this._securityExtendedValidation = false;
  };

  Object.defineProperty(tabIframeProto, 'loading', {
    get: function() {
      return this._loading;
    }
  });

  Object.defineProperty(tabIframeProto, 'title', {
    get: function() {
      return this._title;
    }
  });

  Object.defineProperty(tabIframeProto, 'location', {
    get: function() {
      return this._location;
    }
  });

  Object.defineProperty(tabIframeProto, 'favicon', {
    get: function() {
      return this._favicon;
    }
  });

  Object.defineProperty(tabIframeProto, 'securityState', {
    get: function() {
      return this._securityState;
    }
  });

  Object.defineProperty(tabIframeProto, 'securityExtendedValidation', {
    get: function() {
      return this._securityExtendedValidation;
    }
  });

  tabIframeProto.canGoBack = function() {
    return new Promise((resolve, reject) => {
      if (!this._innerIframe) {
        return resolve(false);
      }
      this._innerIframe.getCanGoBack().onsuccess = r => {
        return resolve(r.target.result);
      };
    });
  };

  tabIframeProto.canGoForward = function() {
    return new Promise((resolve, reject) => {
      if (!this._innerIframe) {
        return resolve(false);
      }
      this._innerIframe.getCanGoForward().onsuccess = r => {
        return resolve(r.target.result);
      };
    });
  };

  tabIframeProto.focus = function() {
    if (this._innerIframe) {
      this._innerIframe.focus();
    }
  };

  tabIframeProto.userInput = '';

  tabIframeProto.handleEvent = function(e) {
    let somethingChanged = true;

    switch (e.type) {
      case 'mozbrowserloadstart':
        this._clearTabData();
        this._loading = true;
        break;
      case 'mozbrowserloadend':
        this._loading = false;
        break;
      case 'mozbrowsertitlechange':
        this._title = e.detail;
        break;
      case 'mozbrowserlocationchange':
        this.userInput = '';
        this._location = e.detail;
        break;
      case 'mozbrowsericonchange':
        this._favicon = e.detail.href;
        break;
      case 'mozbrowsererror':
        if (e.detail.type == 'offline' || e.detail.type == 'dnsNotFound') {
          Popup.openPopup({title:'You are offline', content:'Please reconnect to the internet and try again.'});
        } else if (e.detail.type == 'redirectLoop') {
          Popup.openPopup({title:'Too many redirects', content:'This page is trying to redirect you in a way that will never complete.', page: true, insertiontarget: e.target.parentNode});
        } else if (e.detail.type == 'corruptedContentError') {
          Popup.openPopup({title:'Content is corrupted', content:'There is something wrong with this content that prevents it from being displayed.', page: true, insertiontarget: e.target.parentNode});
        } else if (e.detail.type == 'remoteXUL') {
          Popup.openPopup({title:'Remote XUL', content:'This capability is disabled and cannot be used.', page: true, insertiontarget: e.target.parentNode});
        } else if (e.detail.type == 'other') {
          Popup.openPopup({title:'This Connection is Untrusted', content:'You have asked Firefox to connect securely to this page, but we can\'t confirm that your connection is secure. Normally, when you try to connect securely, sites will present trusted identification to prove that you are going to the right place. However, this site\'s identity can\'t be verified. If you usually connect to this site without problems, this error could mean that someone is trying to impersonate the site, and you shouldn\'t continue.', buttontext:'Get me out of here!', page: true, insertiontarget: e.target.parentNode});
        } else {
          Popup.openPopup({title:'Error', content:'Something went wrong here. Try reloading.', page: true, insertiontarget: e.target.parentNode});
        }
        this._loading = false;
        break;
      case 'mozbrowsersecuritychange':
        this._securityState = e.detail.state;
        this._securityExtendedValidation = e.detail.extendedValidation;
        break;
      default:
        somethingChanged = false;
    }

    // Forward event
    this.emit(e.type, e, this);
  };

  let TabIframe = document.registerElement('tab-iframe', {prototype: tabIframeProto});
  return TabIframe;
});
