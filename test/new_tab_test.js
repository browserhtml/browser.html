var assert = require('assert');

marionette('new tab test', function() {
  var client = marionette.client({
    'browser.shell.checkDefaultBrowser': false
  });

  test('opens a new tab', function() {
    var locationBar = client.findElement('.location-bar');
    locationBar.tap();

    var input = client.findElement('.location-bar .location-bar-input');
    input.sendKeys('facebook.com');
    input.sendKeys('\ue006');
    client.waitFor(function() {
      return client.findElement('iframe[src*="facebook."]').displayed();
    });
  });
});
