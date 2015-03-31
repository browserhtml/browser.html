/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

/**
 * urlhelper.js
 */

define(function() {

  'use strict';

  var rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::|:\/\/)/i;

  var UrlHelper = {

    // Placeholder anchor tag to format URLs.
    a: null,

    getUrlFromInput: function urlHelper_getUrlFromInput(input) {
      this.a = this.a || document.createElement('a');
      this.a.href = input;
      return this.a.href;
    },

    hasScheme: function(input) {
      return !!(rscheme.exec(input) || [])[0];
    },

    isURL: function urlHelper_isURL(input) {
      return !UrlHelper.isNotURL(input);
    },

    getOrigin: function urlHelper_getOrigin(url) {
      this.a = this.a || document.createElement('a');
      this.a.href = url;
      return this.a.origin;
    },

    getBaseURI: function urlHelper_getBaseURI() {
      // http://example.com/foo/index.html -> http://example.com/foo/
      // http://example.com/foo/ -> http://example.com/foo/
      return location.href.replace(/\/[^/]*$/, '/');
    },

    getHostname: function urlHelper_getHostname(url) {
      this.a = this.a || document.createElement('a');
      this.a.href = url;
      return this.a.hostname;
    },
    getDomainName(url) {
      return this.getHostname(url).replace(/^www\./, '');
    },

    getProtocol: function urlHelper_getProtocol(url) {
      this.a = this.a || document.createElement('a');
      this.a.href = url;
      return this.a.protocol;
    },

    isNotURL: function urlHelper_isNotURL(input) {
      var schemeReg = /^\w+\:\/\//;

      // in bug 904731, we use <input type='url' value=''> to
      // validate url. However, there're still some cases
      // need extra validation. We'll remove it til bug fixed
      // for native form validation.
      //
      // for cases, ?abc and 'a? b' which should searching query
      var case1Reg = /^(\?)|(\?.+\s)/;
      // for cases, pure string
      var case2Reg = /[\?\.\s\:]/;
      // for cases, data:uri
      var case3Reg = /^(data\:)/;
      // for cases, only scheme but no domain provided
      var case4Reg = /^\w+\:\/*$/;
      var str = input.trim();
      if (case1Reg.test(str) || !case2Reg.test(str) || case4Reg.test(str)) {
        return true;
      }
      if (case3Reg.test(str)) {
        return false;
      }
      // require basic scheme before form validation
      if (!schemeReg.test(str)) {
        str = 'http://' + str;
      }
      if (!this.urlValidate) {
        this.urlValidate = document.createElement('input');
        this.urlValidate.setAttribute('type', 'url');
      }
      this.urlValidate.setAttribute('value', str);
      return !this.urlValidate.validity.valid;
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
      return uri && uri.startsWith(this.getBaseURI() + 'src/about/');
    },

    getManifestURL: function urlHelper_getManifestURL() {
      return this.getBaseURI() + 'manifest.webapp';
    },

    trim: function(input) {
      // remove single trailing slash for http/https/ftp URLs
      let url = input.replace(/^((?:http|https|ftp):\/\/[^/]+)\/$/, '$1');

      // remove http://
      if (!url.startsWith('http://')) {
        return url;
      }

      return url.substring(7);
    }
  };

  return UrlHelper;
});
