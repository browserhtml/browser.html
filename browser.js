require.config({
  scriptType: 'text/javascript;version=1.8',
  baseUrl: '/',
  nodeIdCompat: true,
  paths: {
    // http://facebook.github.io/react/
    react: 'node_modules/react/dist/react',
    // http://facebook.github.io/immutable-js/
    // Because of the bug https://github.com/facebook/immutable-js/pull/297
    // we use forked version until it's uplifted.
    immutable: 'node_modules/immutable/dist/immutable',
    'immutable/cursor': 'node_modules/immutable/contrib/cursor/index',
    // http://omniscientjs.github.io
    omniscient: 'node_modules/omniscient/dist/omniscient',
    // https://github.com/broofa/node-uuid
    uuid: 'node_modules/node-uuid/uuid'
  },
  shim: {
    'immutable/cursor': {
      exports: 'Cursor',
      deps: ['js/shims/immutable-cursor', 'immutable']
    },
    omniscient: {
      deps: ['js/shims/omniscient']
    },
    pouchdb: {
      exports: 'PouchDB'
    }
  }
});


require(['js/browser/index']);
