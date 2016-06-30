'use strict';

var containerEl = byId('container');
var fpsEl = byId('fps');

var COLORS = {
  magenta: '#f27',
  green: '#ad3',
  blue: '#6de'
};

// I guess we don't have window.innerWidth?
var WIDTH = 1000;
var HEIGHT = 1000;
if (typeof NUM_PARTICLES === 'undefined') {
    var NUM_PARTICLES = 250;
}
var FRAMESKIP = 2;
var RADIUS_SCALE = 0.75;

// Create a physics instance which uses the Verlet integration method
var physics = new Physics();
physics.integrator = new Verlet();

var mouseRepulsion = new Attraction();
mouseRepulsion.setRadius(100 * RADIUS_SCALE);
mouseRepulsion.strength = -500 * RADIUS_SCALE;

var mouseAttraction = new Attraction();
mouseAttraction.strength = 100 * RADIUS_SCALE;

function updateForce(x, y) {
  mouseAttraction.target.x = x;
  mouseAttraction.target.y = y;
  mouseRepulsion.target.x = x;
  mouseRepulsion.target.y = y;
};

// Create new particle element and particle object.
function createParticle(x, y) {
  var particle = new Particle(0.1);
  particle.setRadius(random(1, 5));

  var position = new Vector(x, y);
  particle.moveTo(position);

  particle.behaviours.push(mouseAttraction, mouseRepulsion);

  append(containerEl, el('div', {
    id: particle.id,
    className: 'particle',
    style: {
      background: getRandomValue(COLORS),
      left: x + 'px',
      top: y + 'px',
      width: (particle.radius * 2) + 'px',
      height: (particle.radius * 2) + 'px'
    }
  }));

  return particle;
};

// Create a bunch of particles
for (var i = 0; i < NUM_PARTICLES; i++) {
  physics.particles.push(createParticle(
    random(0, WIDTH - 10),
    random(0, HEIGHT - 10)
  ));
};

// Set force to random location to begin with.
updateForce(random(0, WIDTH - 10), random(0, HEIGHT - 10));

on(containerEl, 'touchstart', function (event) {
  // Prevent mouse events
  event.preventDefault();
  if (event.touches.length > 1) mouseRepulsion.setRadius(133 * RADIUS_SCALE);
});

on(containerEl, 'touchend', function (event) {
  if (event.touches.length <= 1) mouseRepulsion.setRadius(100 * RADIUS_SCALE);
});

on(containerEl, 'touchmove', function (event) {
  var touch = event.changedTouches[0];
  if (touch) {
    updateForce(touch.clientX, touch.clientY);
  };
});

// @note Servo does not bubble events or dispatch to `window` or `document` yet.
// Set listeners directly on element (in this case, `containerEl`).
on(containerEl, 'mousemove', function (event) {
  updateForce(event.clientX, event.clientY);
});

on(containerEl, 'mousedown', function (event) {
  mouseRepulsion.setRadius(133 * RADIUS_SCALE);
});

on(containerEl, 'mouseup', function (event) {
  mouseRepulsion.setRadius(100 * RADIUS_SCALE);
});

loop(function (frames, currFrameT, prevFrameT, fps, averageFPS) {
  // Skip every other frame and let CSS transitions do the tweening.
  if (frames % FRAMESKIP == 0) {
    // Advance physics simulation.
    physics.step();

    physics.particles.forEach(function (particle) {
      edit(byId(particle.id), {
        style: {
          left: particle.pos.x + 'px',
          top: particle.pos.y + 'px'
        }
      });
    });
  };

  // Calc delta between last and current frame start
  // + delta between frame start and frame end.
  text(fpsEl, 'AVG FPS: ' + averageFPS + ' FPS: ' + fps);
});
