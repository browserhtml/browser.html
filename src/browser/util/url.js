/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

/**
 * urlhelper.js
 */

define(function() {

  'use strict';

  const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::|:\/\/)/i;

  const UrlHelper = {

    hasScheme: function(input) {
      return !!(rscheme.exec(input) || [])[0];
    },

    getOrigin: function urlHelper_getOrigin(url) {
      return new URL(url).origin;
    },

    getBaseURI: function urlHelper_getBaseURI() {
      return new URL('./', location);
    },

    getHostname: function urlHelper_getHostname(url) {
      return new URL(url).hostname;
    },

    getDomainName(url) {
      return this.getHostname(url).replace(/^www\./, '');
    },

    getProtocol: function urlHelper_getProtocol(url) {
      return new URL(url).protocol;
    },


    isNotURL: function urlHelper_isNotURL(input) {
      let str = input.trim();

      // for cases, ?abc and 'a? b' which should searching query
      const case1Reg = /^(\?)|(\?.+\s)/;
      // for cases, pure string
      const case2Reg = /[\?\.\s\:]/;
      // for cases, data:uri
      const case3Reg = /^\w+\:\/*$/;
      if (str == 'localhost') {
        return false;
      }
      if (case1Reg.test(str) || !case2Reg.test(str) || case3Reg.test(str)) {
        return true;
      }
      if (!this.hasScheme(input)) {
        str = 'http://' + str;
      }
      try {
        new URL(str);
        return false;
      } catch(e) {
        return true;
      }
    },

    isAboutURL: function(url) {
      try {
        return new URL(url).protocol == 'about:';
      } catch(e) {
        return false;
      }
    },

    isPrivileged: function urlHelper_isPrivilegedURI(uri) {
      // FIXME: not safe. White list?
      return uri && uri.startsWith(new URL('./src/about/', this.getBaseURI()));
    },

    getManifestURL: function urlHelper_getManifestURL() {
      return new URL('./manifest.webapp', this.getBaseURI());
    },

  };

  return UrlHelper;
});
