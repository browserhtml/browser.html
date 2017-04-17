define((require, exports, module) => {
  const {Record, Union, Maybe} = require('common/typed');

  // Define mode actions

  const ShowWebView = Record({
    // An annotation to describe how we activated the transition between
    // `curr` mode and `prev` mode. Used to determine appropriate transition.
    via: String,
    description: 'Show the selected webview'
  }, 'Mode.ShowWebView');
  exports.ShowWebView = ShowWebView

  const EditWebView = Record({
    via: String,
    description: 'Show edit mode for the selected webview'
  }, 'Mode.EditWebView');
  exports.EditWebView = EditWebView;

  const CreateWebView = Record({
    via: String,
    description: 'Show create webview mode'
  }, 'Mode.CreateWebView');
  exports.CreateWebView = CreateWebView;

  const Mode = Union({ShowWebView, EditWebView, CreateWebView});
  exports.Mode = Mode;

  // The mode model stores the current mode and previous mode.
  const Model = Record({
    curr: Mode,
    prev: Mode
  });
  exports.Model = Model;

  const switchMode = (state, curr) =>
    state.merge({prev: state.get('curr'), curr});

  const update = (state, action) =>
    Mode.isTypeOf(action) ?
      switchMode(state, action) :
    state;
  exports.update = update;

});