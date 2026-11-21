// level.js — the dusk estuary map: water, mudflat, boardwalk, reeds, shells, burrow.
// One job: hold the static level layout and the drifting cloud shadows.
(function () {
  'use strict';
  var W = 1280, H = 720;

  // Water: dark teal channel across the top + a tidal pool at the right.
  // The rest is dark mudflat so the bright yellow cones dominate the frame.
  var LEVEL = {
    width: W, height: H,
    waterTop: { x: 0, y: 58, w: 1280, h: 96 },
    pool: { x: 1060, y: 300, w: 220, h: 130, r: 26 },
    // Boardwalk planks the Grey Warden loops on.
    boardwalk: { x: 150, y: 292, w: 980, h: 34 },
    // Reeds = cover. Otter inside a reed bed is HIDDEN.
    reeds: [
      { x: 180, y: 430, r: 72, label: 'REEDS — COVER' },
      { x: 430, y: 540, r: 62, label: 'REEDS — COVER' },
      { x: 700, y: 440, r: 76, label: 'REEDS — COVER' },
      { x: 980, y: 550, r: 62, label: 'REEDS — COVER' },
      { x: 90,  y: 620, r: 52, label: 'REEDS — COVER' }
    ],
    // Shells to collect (3). One sits half-buried by the reeds.
    shells: [
      { x: 250, y: 480, taken: false },
      { x: 760, y: 500, taken: false },
      { x: 1060, y: 330, taken: false }
    ],
    // The burrow: the exit, bottom-right, labelled green.
    burrow: { x: 1150, y: 640, r: 46, label: 'BURROW — EXIT' },
    playerStart: { x: 300, y: 620 }, // clear of the legend panel (x 10-190)
    // The tide returns at 4:00 — the run's hard clock.
    tideLimitSec: 240
  };

  // Two cloud shadows drift at a fixed speed across the mudflat.
  // Standing inside one counts as HIDDEN — the level's signature mechanic.
  function makeClouds() {
    return [
      { x: 300, y: 470, rx: 150, ry: 46, speed: 26, label: 'CLOUD SHADOW — SAFE' },
      { x: 950, y: 560, rx: 170, ry: 50, speed: 18, label: 'CLOUD SHADOW — SAFE' }
    ];
  }

  function updateClouds(clouds, dt) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.speed * dt;
      if (c.x - c.rx > W + 40) c.x = -c.rx - 40;
    }
  }

  function inCloud(clouds, x, y) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i], dx = (x - c.x) / c.rx, dy = (y - c.y) / c.ry;
      if (dx * dx + dy * dy <= 1) return c;
    }
    return null;
  }

  function inReeds(x, y) {
    for (var i = 0; i < LEVEL.reeds.length; i++) {
      var r = LEVEL.reeds[i], dx = x - r.x, dy = y - r.y;
      if (dx * dx + dy * dy <= r.r * r.r) return r;
    }
    return null;
  }

  function inWater(x, y) {
    var t = LEVEL.waterTop;
    if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) return true;
    var p = LEVEL.pool;
    return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
  }

  window.LowTideLevel = {
    LEVEL: LEVEL, makeClouds: makeClouds, updateClouds: updateClouds,
    inCloud: inCloud, inReeds: inReeds, inWater: inWater
  };
})();
