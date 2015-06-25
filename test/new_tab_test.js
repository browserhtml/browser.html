var assert = require('assert');

marionette('new tab test', function() {
  var client = marionette.client({
    'browser.shell.checkDefaultBrowser': false
  });

  test('opens a new tab', function() {
    var tiles = client.findElements('.tile-thumbnail');
    assert.ok(tiles.length, 12);

    var src = tiles[0].getAttribute('href');
    tiles[0].tap();

    client.waitFor(function() {
      return client.findElement('iframe[src="https://facebook.com"]').displayed();
    });
  });
});
