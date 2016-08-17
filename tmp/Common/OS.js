/* @flow */

/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */


// Subset of `os` module from node.js and io.js:
// https://iojs.org/api/os.html
const PLATFORM = navigator.platform.startsWith('Win') ? 'win32' :
                 navigator.platform.startsWith('Mac') ? 'darwin' :
                 navigator.platform.startsWith('Linux') ? 'linux' :
                 navigator.platform.startsWith('FreeBSD') ? 'freebsd' :
                 navigator.platform;

// https://iojs.org/api/os.html#os_os_platform
export const platform =
  ():string =>
  PLATFORM;
