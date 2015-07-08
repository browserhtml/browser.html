require.config({
  baseUrl: '../../../node_modules/',
  nodeIdCompat: true,
  paths: {
    common: '../src/common',
    lang: '../src/lang',
    service: '../src/service',
    react: 'react/dist/react',
    immutable: 'immutable/dist/immutable',
    'typed-immutable': 'typed-immutable/lib/',
    reflex: 'reflex/lib/index'
  }
});

require(['../src/about/settings/index']);
