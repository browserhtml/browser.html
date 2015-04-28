/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

define((require, exports, module) => {

  'use strict';

  const hasScheme = input => !!(rscheme.exec(input) || [])[0];
  const getOrigin = url => new URL(url).origin;
  const getBaseURI = () => new URL('./', location);
  const getHostname = url => new URL(url).hostname;
  const getDomainName = url => getHostname(url).replace(/^www\./, '');
  const getProtocol = url => new URL(url).protocol;
  const getManifestURL = () => new URL('./manifest.webapp', getBaseURI());

  const isAboutURL = url => {
    try {
      return new URL(url).protocol == 'about:';
    } catch (e) {
      return false;
    }
  };

  const isPrivileged = uri => {
    // FIXME: not safe. White list?
    return uri && uri.startsWith(new URL('./src/about/', getBaseURI()));
  };

  const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::|:\/\/)/i;
  const isNotURL = input => {
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
    if (!hasScheme(input)) {
      str = 'http://' + str;
    }
    try {
      new URL(str);
      return false;
    } catch (e) {
      return true;
    }
  }

  exports.hasScheme = hasScheme;
  exports.getOrigin = getOrigin;
  exports.getBaseURI = getBaseURI;
  exports.getHostname = getHostname;
  exports.getDomainName = getDomainName;
  exports.getProtocol = getProtocol;
  exports.getManifestURL = getManifestURL;
  exports.isAboutURL = isAboutURL;
  exports.isPrivileged = isPrivileged;
  exports.isNotURL = isNotURL;
});
