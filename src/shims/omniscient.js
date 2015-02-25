define((require, exports, module) => {

  'use strict';
  // We need to set React to global to resolve dependency issue with omniscient.
  // For details see https://github.com/omniscientjs/omniscient/issues/45

  window.React = require('react');
});
