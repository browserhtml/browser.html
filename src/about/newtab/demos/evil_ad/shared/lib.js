'use strict';

function now() {
  return 'performance' in window ? window.performance.now() : Date.now();
};

function smooth(avg, curr, discount) {
  return avg ? curr * discount + avg * (1.0 - discount) : curr;
};

function loop(callback) {
  var next = true;

  var frames = 0;
  // The sum of all frames per second.
  var fpsSum = 0;
  var prevT = now();

  function tick() {
    var currT = now();
    var fps = 1000 / (currT - prevT);
    fpsSum = fpsSum + fps;
    avgFps = smooth(avgFps, fps, 0.03);
    frames = frames + 1;
    var avgFps = fpsSum / frames;
    callback(frames, currT, prevT, Math.round(fps), Math.round(avgFps));
    prevT = currT;
    if (next) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  return function () {
    return next = false;
  };
};

// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function getRandomKey(o) {
  var keys = Object.keys(o);
  var i = Math.floor(Math.random() * keys.length);
  return keys[i];
};

function getRandomValue(o) {
  return o[getRandomKey(o)];
};
