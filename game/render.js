// render.js — draws the dusk estuary: dark teal water, dark mud, bright cones.
// One job: every frame must read as dusk stealth at a glance.
(function () {
  'use strict';

  function speckle(ctx, seed, n, w, h, y0, y1, color) {
    var s = seed;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    ctx.fillStyle = color;
    for (var i = 0; i < n; i++) {
      var x = rnd() * w, y = y0 + rnd() * (y1 - y0);
      ctx.globalAlpha = 0.10 + rnd() * 0.16;
      ctx.beginPath(); ctx.arc(x, y, 1 + rnd() * 2.4, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function label(ctx, text, x, y, color, size) {
    ctx.font = 'bold ' + (size || 12) + 'px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || '#ffe9a8';
    ctx.fillText(text, x, y);
  }

  function drawCone(ctx, g) {
    var G = window.LowTideGuard;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, G.CONE_LEN, g.facing - G.CONE_HALF, g.facing + G.CONE_HALF);
    ctx.closePath();
    ctx.fillStyle = G.coneColor(g);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,74,0.75)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function drawHeron(ctx, g) {
    // Dark silhouette heron: body, S-neck, long beak, thin legs.
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = g.kind === 'heron' ? '#0d1116' : '#232a30';
    ctx.strokeStyle = '#0d1116'; ctx.lineWidth = 3;
    // Legs
    ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(-6, 26); ctx.moveTo(5, 8); ctx.lineTo(6, 26); ctx.stroke();
    // Body
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 11, 0, 0, 6.283); ctx.fill();
    // Neck + head, leaning toward facing
    var hx = Math.cos(g.facing) * 16, hy = Math.sin(g.facing) * 16 - 12;
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(10, -16, hx, hy); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 6.283); ctx.fill();
    // Beak
    ctx.beginPath(); ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(g.facing) * 18, hy + Math.sin(g.facing) * 18 + 2);
    ctx.lineTo(hx, hy + 4); ctx.closePath(); ctx.fillStyle = '#e8a33d'; ctx.fill();
    // Eye glint
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(hx + 2, hy - 2, 1.8, 0, 6.283); ctx.fill();
    ctx.restore();
    // Name tag + state mark
    label(ctx, g.name.toUpperCase(), g.x, g.y - 30, '#ffd94a', 12);
    if (g.mark) {
      ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.strokeText(g.mark, g.x + 40, g.y - 52);
      ctx.fillStyle = g.mark === '!' ? '#ff5a4a' : '#ffb347';
      ctx.fillText(g.mark, g.x + 40, g.y - 52);
    }
  }

  function drawOtter(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // Tail
    ctx.fillStyle = '#7a4f27';
    ctx.beginPath(); ctx.ellipse(-Math.cos(p.facing) * 16, -Math.sin(p.facing) * 16, 12, 5, p.facing, 0, 6.283); ctx.fill();
    // Body
    ctx.fillStyle = '#a86f3a';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 11, p.facing, 0, 6.283); ctx.fill();
    // Belly
    ctx.fillStyle = '#d9b078';
    ctx.beginPath(); ctx.ellipse(3, 3, 9, 6, p.facing, 0, 6.283); ctx.fill();
    // Head + ears + nose
    var hx = Math.cos(p.facing) * 13, hy = Math.sin(p.facing) * 13;
    ctx.fillStyle = '#a86f3a';
    ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - 4, hy - 7, 3, 0, 6.283); ctx.arc(hx + 4, hy - 7, 3, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#1a120c';
    ctx.beginPath(); ctx.arc(hx + Math.cos(p.facing) * 7, hy + Math.sin(p.facing) * 7, 2.4, 0, 6.283); ctx.fill();
    ctx.restore();
    label(ctx, 'OTTER PUP', p.x, p.y + 30, '#ffe9a8', 11);
  }

  function drawWorld(ctx, state) {
    var L = window.LowTideLevel.LEVEL;
    var clouds = state.clouds, guards = state.guards, player = state.player;
    // Sky-dusk gradient over the whole mudflat
    var g = ctx.createLinearGradient(0, 58, 0, 720);
    g.addColorStop(0, '#241a12'); g.addColorStop(0.5, '#2b2118'); g.addColorStop(1, '#1d150e');
    ctx.fillStyle = g; ctx.fillRect(0, 58, 1280, 662);
    speckle(ctx, 12345, 420, 1280, 720, 160, 710, '#c9a86a');
    // Dark teal water (top channel) with a dusk glint
    ctx.fillStyle = '#0a2e33'; ctx.fillRect(L.waterTop.x, L.waterTop.y, L.waterTop.w, L.waterTop.h);
    ctx.fillStyle = 'rgba(255,170,80,0.20)';
    ctx.fillRect(0, 58, 1280, 5);
    ctx.fillStyle = 'rgba(140,220,220,0.10)';
    for (var i = 0; i < 8; i++) ctx.fillRect(60 + i * 160, 96 + (i % 3) * 18, 90, 3);
    label(ctx, 'TIDE WATER — RISING', 640, 116, '#9fd8d2', 13);
    // Tidal pool
    ctx.fillStyle = '#0d3a40';
    ctx.beginPath(); ctx.roundRect(L.pool.x, L.pool.y, L.pool.w, L.pool.h, L.pool.r); ctx.fill();
    // Boardwalk planks
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(L.boardwalk.x, L.boardwalk.y, L.boardwalk.w, L.boardwalk.h);
    ctx.strokeStyle = '#241a10'; ctx.lineWidth = 2;
    for (var bx = L.boardwalk.x; bx < L.boardwalk.x + L.boardwalk.w; bx += 28) {
      ctx.beginPath(); ctx.moveTo(bx, L.boardwalk.y); ctx.lineTo(bx, L.boardwalk.y + L.boardwalk.h); ctx.stroke();
    }
    label(ctx, 'BOARDWALK — PATROL ROUTE', 250, L.boardwalk.y + 52, '#cbb98a', 11);
    // Reeds (cover)
    for (var r = 0; r < L.reeds.length; r++) {
      var rd = L.reeds[r];
      ctx.fillStyle = 'rgba(20,52,26,0.95)';
      ctx.beginPath(); ctx.arc(rd.x, rd.y, rd.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#3f7a44'; ctx.lineWidth = 3;
      for (var k = 0; k < 14; k++) {
        var a = (k / 14) * 6.283, rx = rd.x + Math.cos(a) * rd.r * 0.7, ry = rd.y + Math.sin(a) * rd.r * 0.7;
        ctx.beginPath(); ctx.moveTo(rx, ry + 12); ctx.lineTo(rx + (k % 3 - 1) * 4, ry - 26 - (k % 5) * 4); ctx.stroke();
      }
    }
    // Shells (uncollected glow pink)
    for (var s = 0; s < L.shells.length; s++) {
      var sh = L.shells[s];
      if (sh.taken) continue;
      ctx.fillStyle = 'rgba(255,158,207,0.25)';
      ctx.beginPath(); ctx.arc(sh.x, sh.y, 20, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ff9ecf';
      ctx.beginPath(); ctx.arc(sh.x, sh.y, 9, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#7a2b4d';
      ctx.beginPath(); ctx.arc(sh.x - 3, sh.y - 2, 3, 0, 6.283); ctx.fill();
      label(ctx, 'SHELL', sh.x, sh.y - 26, '#ff9ecf', 11);
    }
    // Burrow exit: green mound + ring + label
    var b = L.burrow;
    ctx.fillStyle = 'rgba(88,214,84,0.30)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 12, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2c4a22';
    ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.62, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#0c1408';
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, 20, 12, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#58d654'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 12, 0, 6.283); ctx.stroke();
    label(ctx, b.label, b.x, b.y - b.r - 22, '#8fe388', 13);
    // Cloud shadows (signature mechanic) with labels
    for (var c = 0; c < clouds.length; c++) {
      var cl = clouds[c];
      ctx.fillStyle = 'rgba(125,142,163,0.34)';
      ctx.beginPath(); ctx.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(200,215,230,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, 6.283); ctx.stroke();
      label(ctx, cl.label, cl.x, cl.y - cl.ry - 8, '#dfe9f2', 12);
    }
    // Cones under the guards, then the guards, then the player
    for (var gi = 0; gi < guards.length; gi++) drawCone(ctx, guards[gi]);
    for (var gj = 0; gj < guards.length; gj++) drawHeron(ctx, guards[gj]);
    // Footstep puffs
    for (var f = 0; f < player.steps.length; f++) {
      var st = player.steps[f];
      ctx.fillStyle = st.big ? 'rgba(255,220,150,' + (st.life * 0.7) + ')' : 'rgba(220,200,160,' + (st.life * 0.5) + ')';
      ctx.beginPath(); ctx.arc(st.x, st.y, st.big ? 7 : 4, 0, 6.283); ctx.fill();
    }
    drawOtter(ctx, player);
    // "WHAT WAS THAT?" shout when a guard is suspicious
    for (var q = 0; q < guards.length; q++) {
      if (guards[q].state === 'SUSPICIOUS' || guards[q].state === 'HUNTED') {
        label(ctx, guards[q].state === 'HUNTED' ? 'THERE IT IS!' : 'WHAT WAS THAT?', guards[q].x, guards[q].y - 58, '#ffb347', 15);
        break;
      }
    }
    // Exit direction arrow when the player is far from the burrow
    if (Math.hypot(player.x - b.x, player.y - b.y) > 260) {
      var ang = Math.atan2(b.y - player.y, b.x - player.x);
      var ax = player.x + Math.cos(ang) * 52, ay = player.y + Math.sin(ang) * 52;
      ctx.fillStyle = '#8fe388';
      ctx.beginPath(); ctx.moveTo(ax + Math.cos(ang) * 12, ay + Math.sin(ang) * 12);
      ctx.lineTo(ax + Math.cos(ang + 2.5) * 10, ay + Math.sin(ang + 2.5) * 10);
      ctx.lineTo(ax + Math.cos(ang - 2.5) * 10, ay + Math.sin(ang - 2.5) * 10);
      ctx.closePath(); ctx.fill();
    }
  }

  window.LowTideRender = { drawWorld: drawWorld, label: label };
})();
