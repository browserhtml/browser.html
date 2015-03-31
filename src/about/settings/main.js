require.config({
  scriptType: 'text/javascript;version=1.8',
  baseUrl: '../../../node_modules/',
  nodeIdCompat: true,
  paths: {
    settings: '../src/about/settings',
    browser: '../src/browser',
    shims: '../src/shims',
    react: 'react/dist/react',
    immutable: 'immutable/dist/immutable',
    omniscient: 'omniscient/dist/omniscient',
  },
  shim: {
    omniscient: {
      deps: ['shims/omniscient']
    }
  }
});

require(['settings/index']);
