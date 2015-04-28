// Subset of `os` module from node.js and io.js:
// https://iojs.org/api/os.html
define((require, exports, module) => {
  const platform = navigator.platform.startsWith('Win') ? 'win32' :
                   navigator.platform.startsWith('Mac') ? 'darwin' :
                   navigator.platform.startsWith('Linux') ? 'linux' :
                   navigator.platform.startsWith('FreeBSD') ? 'freebsd' :
                   navigator.platform;

  // https://iojs.org/api/os.html#os_os_platform
  exports.platform = () => platform;
});
