// guard.js — the herons: learnable patrols, vision cones, suspicion.
// One job: guards a player can read, predict, and slip past.
// Rhythm (learnable, fixed): walk 4s -> freeze 3s -> head sweep 2s -> walk.
(function () {
  'use strict';
  var CONE_LEN = 260, CONE_HALF = 0.42; // radians, half-angle

  function makeGuard(name, kind, x, y, ax, ay, bx, by, speed) {
    return {
      name: name, kind: kind, x: x, y: y, r: 17,
      ax: ax, ay: ay, bx: bx, by: by, speed: speed,
      dir: 1, phase: 'walk', phaseT: 0, facing: Math.PI / 2,
      sweepBase: Math.PI / 2, suspicion: 0, state: 'PATROL', mark: ''
    };
  }

  function makeGuards() {
    return [
      // Grey Warden loops the boardwalk, staring down at the mudflat.
      makeGuard('Grey Warden', 'heron', 300, 309, 300, 309, 1000, 309, 46),
      // Pip the Egret paces the reeds on the right.
      makeGuard('Pip the Egret', 'egret', 640, 400, 640, 380, 640, 590, 38)
    ];
  }

  function stepPhase(g, dt) {
    g.phaseT += dt;
    if (g.phase === 'walk' && g.phaseT >= 4) { g.phase = 'freeze'; g.phaseT = 0; }
    else if (g.phase === 'freeze' && g.phaseT >= 3) { g.phase = 'sweep'; g.phaseT = 0; }
    else if (g.phase === 'sweep' && g.phaseT >= 2) { g.phase = 'walk'; g.phaseT = 0; }
  }

  function updateGuard(g, dt, player, level) {
    stepPhase(g, dt);
    if (g.phase === 'walk') {
      var tx = g.dir > 0 ? g.bx : g.ax, ty = g.dir > 0 ? g.by : g.ay;
      var dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
      if (d < 4) { g.dir *= -1; }
      else {
        g.x += dx / d * g.speed * dt;
        g.y += dy / d * g.speed * dt;
        g.facing = Math.atan2(dy, dx);
      }
      g.sweepBase = g.facing;
    } else if (g.phase === 'sweep') {
      // Head sweep: the cone swings left-right while the body stays frozen.
      g.facing = g.sweepBase + Math.sin((g.phaseT / 2) * Math.PI * 2) * 0.85;
    }
    // else freeze: body and head hold still — the safe moment to cross.

    // Vision: player inside the cone, in range, and not hidden.
    var pdx = player.x - g.x, pdy = player.y - g.y;
    var dist = Math.hypot(pdx, pdy);
    var ang = Math.atan2(pdy, pdx);
    var diff = Math.atan2(Math.sin(ang - g.facing), Math.cos(ang - g.facing));
    var seen = dist < CONE_LEN && Math.abs(diff) < CONE_HALF && !player.hidden;
    // Running close by is heard even outside the cone.
    var heard = player.running && dist < 130;
    if (seen) g.suspicion = Math.min(100, g.suspicion + dt * 55);
    else if (heard) g.suspicion = Math.min(100, g.suspicion + dt * 30);
    else g.suspicion = Math.max(0, g.suspicion - dt * 22);

    if (g.suspicion >= 100) { g.state = 'HUNTED'; g.mark = '!'; }
    else if (g.suspicion >= 45) { g.state = 'SUSPICIOUS'; g.mark = '?'; }
    else if (g.suspicion > 5) { g.state = 'UNEASY'; g.mark = '?'; }
    else { g.state = 'PATROL'; g.mark = ''; }
    return g;
  }

  function coneColor(g) {
    if (g.state === 'HUNTED') return 'rgba(255,74,58,0.55)';
    if (g.state === 'SUSPICIOUS' || g.state === 'UNEASY') return 'rgba(255,166,40,0.55)';
    return 'rgba(255,217,74,0.42)';
  }

  window.LowTideGuard = {
    makeGuards: makeGuards, updateGuard: updateGuard,
    coneColor: coneColor, CONE_LEN: CONE_LEN, CONE_HALF: CONE_HALF
  };
})();
