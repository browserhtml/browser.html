require.config({
  scriptType: 'text/javascript;version=1.8',
  baseUrl: 'node_modules/',
  nodeIdCompat: true,
  paths: {
    browser: '../src/browser',
    shims: '../src/shims',
    lang: '../src/lang',
    os: '../src/os',
    // http://facebook.github.io/react/
    react: 'react/dist/react',
    // http://facebook.github.io/immutable-js/
    // Because of the bug https://github.com/facebook/immutable-js/pull/297
    // we use forked version until it's uplifted.
    immutable: 'immutable/dist/immutable',
    // http://omniscientjs.github.io
    omniscient: 'omniscient/dist/omniscient',
    // https://github.com/broofa/node-uuid
    uuid: 'node-uuid/uuid'
  },
  shim: {
    omniscient: {
      deps: ['shims/omniscient']
    },
    pouchdb: {
      exports: 'PouchDB'
    }
  }
});


require(['browser/index']);
require(['browser/embedding']);
