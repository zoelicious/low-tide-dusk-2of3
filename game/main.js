// main.js — boot, game loop, HUD, win/lose, and staged screenshot shots.
// One job: run the game and keep the HUD honest.
(function () {
  'use strict';
  var L = window.LowTideLevel;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  var params = new URLSearchParams(location.search);
  var shot = params.get('shot') || '';

  var state = {
    clouds: L.makeClouds(),
    guards: window.LowTideGuard.makeGuards(),
    player: null,
    elapsed: 0, over: false, won: false, spotted: 0,
    caughtTimer: 0, bannerShown: false
  };
  var levelApi = {
    LEVEL: L.LEVEL, clouds: state.clouds,
    inWater: L.inWater, inReeds: L.inReeds, inCloud: L.inCloud
  };

  function reset() {
    L.LEVEL.shells.forEach(function (s) { s.taken = false; });
    state.clouds = L.makeClouds();
    levelApi.clouds = state.clouds;
    state.guards = window.LowTideGuard.makeGuards();
    state.player = window.LowTidePlayer.makePlayer(L.LEVEL.playerStart.x, L.LEVEL.playerStart.y);
    state.elapsed = 0; state.over = false; state.won = false; state.spotted = 0;
    state.caughtTimer = 0; state.bannerShown = false;
    hideBanner();
  }

  function stageShot(name) {
    reset();
    var p = state.player, warden = state.guards[0], egret = state.guards[1];
    if (name === 'cover') {
      // Near-miss at dusk: pup at the reed edge, cone on it, "?" up, 1 shell in.
      state.elapsed = 72; // 01:12 — the clock is running
      L.LEVEL.shells[0].taken = true; p.shells = 1;
      p.x = 700; p.y = 478; p.facing = -Math.PI / 2;
      warden.x = 760; warden.y = 309; warden.phase = 'freeze'; warden.phaseT = 1.2;
      warden.facing = Math.PI / 2; warden.sweepBase = Math.PI / 2; warden.suspicion = 62;
      warden.state = 'SUSPICIOUS'; warden.mark = '?';
      egret.x = 600; egret.y = 610; egret.facing = Math.PI / 2;
      state.clouds[0].x = 660; state.clouds[0].y = 478;
    } else if (name === 'cloud') {
      // The signature mechanic: pup rides a cloud shadow across open mud.
      state.elapsed = 47; // 00:47
      L.LEVEL.shells[0].taken = true; p.shells = 1;
      p.x = 500; p.y = 500; p.facing = Math.PI / 4;
      warden.x = 340; warden.y = 309; warden.phase = 'walk'; warden.facing = 0;
      egret.x = 640; egret.y = 400; egret.facing = Math.PI / 2;
      state.clouds[0].x = 500; state.clouds[0].y = 500;
      state.clouds[1].x = 980; state.clouds[1].y = 560;
    } else if (name === 'alarm') {
      // Full alarm: "!" up, red cone, pup running for the reeds, 2 shells in.
      state.elapsed = 125; // 02:05
      L.LEVEL.shells[0].taken = true; L.LEVEL.shells[1].taken = true; p.shells = 2;
      p.x = 900; p.y = 560; p.facing = Math.PI; p.running = true; p.moving = true;
      p.steps.push({ x: 930, y: 566, life: 0.7, big: true }, { x: 915, y: 562, life: 0.5, big: true });
      warden.x = 830; warden.y = 309; warden.phase = 'walk'; warden.facing = Math.PI / 2;
      warden.suspicion = 100; warden.state = 'HUNTED'; warden.mark = '!';
      egret.x = 640; egret.y = 480; egret.facing = Math.PI / 2; egret.suspicion = 55;
      egret.state = 'SUSPICIOUS'; egret.mark = '?';
      state.spotted = 1;
      state.clouds[0].x = 300; state.clouds[0].y = 470;
      state.clouds[1].x = 1120; state.clouds[1].y = 450;
    } else if (name === 'victory') {
      // Home before the tide: pup at the burrow, 3 shells, clock stopped at 02:41.
      state.elapsed = 161; // 02:41
      L.LEVEL.shells.forEach(function (s) { s.taken = true; }); p.shells = 3;
      p.x = 1150; p.y = 640; p.facing = -Math.PI / 2;
      warden.x = 1020; warden.y = 309; warden.phase = 'walk'; warden.facing = 0;
      egret.x = 640; egret.y = 590; egret.facing = -Math.PI / 2;
      state.clouds[0].x = 420; state.clouds[0].y = 470;
      state.won = true; state.over = true;
      showBanner(false, 'SAFE HOME!', '3 shells in 2:41 — the pup slipped past the Grey Warden before the tide came back.');
    }
    // Recompute hidden + status words for the staged frame.
    p.hidden = !!(L.inReeds(p.x, p.y) || L.inCloud(state.clouds, p.x, p.y));
    updateHud();
  }

  var keys = { up: false, down: false, left: false, right: false, run: false };
  window.addEventListener('keydown', function (e) {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'Shift') keys.run = true;
    if (e.key === 'r' || e.key === 'R') { reset(); if (shot) stageShot(shot); }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'Shift') keys.run = false;
  });

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function maxSuspicion() {
    var m = 0;
    for (var i = 0; i < state.guards.length; i++) m = Math.max(m, state.guards[i].suspicion);
    return m;
  }

  function alarmWord(s) {
    if (s >= 100) return 'HUNTED';
    if (s >= 45) return 'SUSPICIOUS';
    if (s > 5) return 'UNEASY';
    return 'CALM';
  }

  function showBanner(bad, title, text) {
    var b = document.getElementById('banner');
    b.className = bad ? 'bad' : '';
    b.innerHTML = '<h1>' + title + '</h1><p>' + text + '</p><p>Press R to play again.</p>';
    state.bannerShown = true;
  }
  function hideBanner() {
    var b = document.getElementById('banner');
    b.className = 'hidden'; b.innerHTML = '';
  }

  function updateHud() {
    var p = state.player, s = maxSuspicion();
    document.getElementById('hud-time').textContent = fmt(state.elapsed);
    document.getElementById('hud-shells').textContent = p.shells + '/3';
    var need = 3 - p.shells;
    document.getElementById('hud-goal').textContent =
      need > 0 ? 'Collect shells, reach burrow (' + need + ' more)' : 'Reach the burrow — now!';
    var status = document.getElementById('hud-status');
    var word, cls;
    if (s >= 100) { word = 'HUNTED'; cls = 'hunted'; }
    else if (s >= 45) { word = 'SUSPICIOUS'; cls = 'suspicious'; }
    else if (p.hidden) { word = 'HIDDEN'; cls = 'is-hidden'; }
    else { word = 'EXPOSED'; cls = 'suspicious'; }
    status.textContent = word;
    status.className = 'status ' + cls;
    document.getElementById('hud-alarm-fill').style.width = s + '%';
    document.getElementById('hud-alarm-word').textContent = alarmWord(s);
    document.getElementById('hud-vis').textContent = p.hidden ? 'IN SHADOW' : 'EXPOSED';
    document.getElementById('hud-noise').textContent = window.LowTidePlayer.noiseWord(p);
    document.getElementById('hud-spotted').textContent = String(state.spotted);
    document.getElementById('hud-tide').textContent =
      'RISING — ' + fmt(Math.max(0, L.LEVEL.tideLimitSec - state.elapsed));
    var warden = state.guards[0], egret = state.guards[1];
    document.getElementById('hud-warden').textContent =
      warden.state + ' · ' + Math.round(Math.hypot(p.x - warden.x, p.y - warden.y) / 14) + 'm';
    document.getElementById('hud-egret').textContent =
      egret.state + ' · ' + Math.round(Math.hypot(p.x - egret.x, p.y - egret.y) / 14) + 'm';
  }

  function tick(dt) {
    if (state.over) { updateHud(); return; }
    state.elapsed += dt;
    L.updateClouds(state.clouds, dt);
    window.LowTidePlayer.updatePlayer(state.player, keys, dt, levelApi);
    var prevHunted = state.guards.some(function (g) { return g.state === 'HUNTED'; });
    for (var i = 0; i < state.guards.length; i++) {
      window.LowTideGuard.updateGuard(state.guards[i], dt, state.player, levelApi);
    }
    var nowHunted = state.guards.some(function (g) { return g.state === 'HUNTED'; });
    if (nowHunted && !prevHunted) state.spotted++;
    // Caught: a hunting guard keeps you in its cone.
    var seenNow = false;
    for (var j = 0; j < state.guards.length; j++) {
      var g = state.guards[j];
      if (g.state !== 'HUNTED') continue;
      var dx = state.player.x - g.x, dy = state.player.y - g.y;
      var d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      var diff = Math.atan2(Math.sin(ang - g.facing), Math.cos(ang - g.facing));
      if (d < window.LowTideGuard.CONE_LEN && Math.abs(diff) < window.LowTideGuard.CONE_HALF && !state.player.hidden) seenNow = true;
    }
    if (seenNow) {
      state.caughtTimer += dt;
      if (state.caughtTimer > 1.5) {
        state.over = true;
        showBanner(true, 'CAUGHT!', 'The Grey Warden spotted the pup in the open. Slip through reeds and cloud shadows — never cross a cone in the light.');
      }
    } else state.caughtTimer = 0;
    // Win: all 3 shells, home in the burrow.
    var b = L.LEVEL.burrow;
    if (Math.hypot(state.player.x - b.x, state.player.y - b.y) < 52) {
      if (state.player.shells >= 3) {
        state.over = true; state.won = true;
        showBanner(false, 'SAFE HOME!', state.player.shells + ' shells in ' + fmt(state.elapsed) + ' — the pup slipped past the Grey Warden before the tide came back.');
      }
    }
    // Lose: the tide returns at 4:00.
    if (state.elapsed >= L.LEVEL.tideLimitSec) {
      state.over = true;
      showBanner(true, 'THE TIDE RETURNED', 'The water swallowed the mudflat at 4:00. Be quicker — and bolder in the shadows.');
    }
    updateHud();
  }

  // In shot mode the staged frame is frozen except the clock and the clouds,
  // so the screenshot shows a live moment, not a title card.
  function shotTick(dt) {
    state.elapsed += dt;
    L.updateClouds(state.clouds, dt);
    state.player.hidden = !!(L.inReeds(state.player.x, state.player.y) || L.inCloud(state.clouds, state.player.x, state.player.y));
    updateHud();
  }

  reset();
  if (shot) stageShot(shot);
  window.LowTideRender.drawWorld(ctx, state);
  updateHud();

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (shot) shotTick(dt); else tick(dt);
    window.LowTideRender.drawWorld(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
