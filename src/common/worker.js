define(function () {
  return {
    version: "1.0.1",
    load: function(name, req, onLoad, config) {
      onLoad(new Worker(req.toUrl(`${name}.js`)));
    }
  };
});
