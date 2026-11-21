// player.js — the otter pup: movement, noise, footsteps, shell pickups.
// One job: turn keys into a small animal sneaking home.
(function () {
  'use strict';
  var WALK = 115, RUN = 205;

  function makePlayer(x, y) {
    return {
      x: x, y: y, r: 15, vx: 0, vy: 0,
      facing: 0, running: false, moving: false,
      stepTimer: 0, steps: [], // fading footstep puffs
      shells: 0, hidden: true
    };
  }

  function updatePlayer(p, keys, dt, level) {
    var ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    var len = Math.hypot(ix, iy) || 1;
    p.moving = (ix !== 0 || iy !== 0);
    p.running = !!keys.run && p.moving;
    var speed = p.running ? RUN : WALK;
    p.vx = ix / len * speed;
    p.vy = iy / len * speed;
    if (p.moving) p.facing = Math.atan2(p.vy, p.vx);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Stay inside the mudflat (below the HUD, above the bottom edge).
    p.x = Math.max(24, Math.min(1256, p.x));
    p.y = Math.max(168, Math.min(700, p.y));
    // Water slows the pup and is never cover.
    if (level.inWater(p.x, p.y)) { p.x -= p.vx * dt * 0.55; p.y -= p.vy * dt * 0.55; }
    // Footstep puffs: loud and frequent when running, soft when walking.
    if (p.moving) {
      p.stepTimer -= dt;
      if (p.stepTimer <= 0) {
        p.stepTimer = p.running ? 0.16 : 0.30;
        p.steps.push({ x: p.x, y: p.y + 10, life: 0.7, big: p.running });
      }
    }
    for (var i = p.steps.length - 1; i >= 0; i--) {
      p.steps[i].life -= dt;
      if (p.steps[i].life <= 0) p.steps.splice(i, 1);
    }
    // Shell pickup: swim close, it is yours.
    for (var s = 0; s < level.LEVEL.shells.length; s++) {
      var sh = level.LEVEL.shells[s];
      if (!sh.taken && Math.hypot(p.x - sh.x, p.y - sh.y) < 34) {
        sh.taken = true;
        p.shells++;
      }
    }
    // Hidden when tucked in reeds or under a cloud shadow.
    p.hidden = !!(level.inReeds(p.x, p.y) || level.inCloud(level.clouds, p.x, p.y));
    return p;
  }

  function noiseWord(p) {
    if (!p.moving) return 'SILENT';
    return p.running ? 'LOUD — RUNNING' : 'SOFT STEPS';
  }

  window.LowTidePlayer = { makePlayer: makePlayer, updatePlayer: updatePlayer, noiseWord: noiseWord };
})();
