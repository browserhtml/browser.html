require.config({
  scriptType: 'text/javascript;version=1.8',
  baseUrl: '../../../node_modules/',
  nodeIdCompat: true,
  paths: {
    common: '../src/common',
    lang: '../src/lang',
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

require(['../src/about/settings/index']);
