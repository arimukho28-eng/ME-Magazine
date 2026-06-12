/* ═══════════════════════════════════════════════════
   IMPULSE — Preloader + Scroll Reveal + Hover Effects
   ═══════════════════════════════════════════════════ */

// ── Preloader with ZAP reveal ───────────────────────
(function initPreloader() {
  const overlay  = document.getElementById('preloader');
  const titleEl  = document.getElementById('preloader-title');
  const subEl    = document.getElementById('preloader-sub');
  const progBar  = document.getElementById('preloader-bar');
  const progWrap = document.querySelector('.preloader-progress');
  const zapFlash = document.getElementById('zapFlash');

  let progress = 0;

  // Reveal progress bar immediately
  setTimeout(() => { if (progWrap) progWrap.classList.add('revealed'); }, 300);

  const interval = setInterval(() => {
    progress += Math.random() * 10 + 3;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      progBar.style.width = '100%';

      // 200ms after fill → ZAP flash → text reveals
      setTimeout(() => {
        // Zap flash: rapid white-gold burst
        if (zapFlash) {
          zapFlash.classList.add('active');
          setTimeout(() => {
            zapFlash.classList.remove('active');
            // Immediately show title+sub with smooth entrance
            titleEl.classList.add('revealed');
            subEl.classList.add('revealed');
          }, 90);
        } else {
          titleEl.classList.add('revealed');
          subEl.classList.add('revealed');
        }

        // Exit preloader after text sits for 900ms
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.style.display = 'none';
            document.body.classList.remove('preloading');
            initScrollReveal();
            initCounters();
          }, 700);
        }, 900);
      }, 200);
    }
    progBar.style.width = progress + '%';
  }, 80);
})();

// ── Scroll Reveal ───────────────────────────────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.spirit-card, .message-card, .directory-row, .hero-actions'
  );
  revealEls.forEach((el, i) => {
    el.classList.add('sr-hidden');
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
  });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('sr-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => obs.observe(el));
}

// ── Counters ────────────────────────────────────────
function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target  = parseInt(el.dataset.count);
    let current   = 0;
    const step    = Math.ceil(target / 40);
    const timer   = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ── Cursor spark trail ──────────────────────────────
(function initCursorTrail() {
  if ('ontouchstart' in window) return;
  const trailCanvas = document.getElementById('cursor-trail');
  if (!trailCanvas) return;
  const tc = trailCanvas.getContext('2d');
  let tw = trailCanvas.width  = window.innerWidth;
  let th = trailCanvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    tw = trailCanvas.width  = window.innerWidth;
    th = trailCanvas.height = window.innerHeight;
  });
  let dots = [];
  document.addEventListener('mousemove', (e) => {
    if (Math.random() < 0.35) {
      dots.push({
        x: e.clientX, y: e.clientY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        life: 18 + Math.random() * 14,
        maxLife: 32,
        size: 1.5 + Math.random() * 2.5,
        hue: 20 + Math.random() * 30
      });
    }
  });
  (function trailLoop() {
    requestAnimationFrame(trailLoop);
    tc.clearRect(0, 0, tw, th);
    dots = dots.filter(d => d.life > 0);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy; d.vy += 0.05; d.life--;
      const a = d.life / d.maxLife;
      tc.save();
      tc.globalAlpha = a * 0.7;
      tc.fillStyle   = `hsl(${d.hue}, 100%, 65%)`;
      tc.shadowColor = `hsl(${d.hue}, 100%, 65%)`;
      tc.shadowBlur  = 6;
      tc.beginPath();
      tc.arc(d.x, d.y, d.size * a, 0, Math.PI * 2);
      tc.fill();
      tc.restore();
    });
  })();
})();

// ── Background: Particle + Grid + Mouse Ripple/Magnetic ──
(function initBgCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  let mx = W / 2, my = H / 2;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    rebuildParticles();
  });
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  // ── Grid config ──
  const CELL = 55; // grid spacing px

  // ── Particle config ──
  const PARTICLE_COUNT = 90;

  function rebuildParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(makeParticle());
    }
  }

  function makeParticle() {
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.25,
      vy:   (Math.random() - 0.5) * 0.25,
      r:    0.8 + Math.random() * 1.6,
      // gold, orange, white variants
      hue:  Math.random() < 0.55
              ? 35 + Math.random() * 20   // gold-orange
              : (Math.random() < 0.5 ? 200 + Math.random() * 30 : 0),  // blue-white or red
      alpha: 0.25 + Math.random() * 0.35,
      baseAlpha: 0,
    };
  }

  let particles = [];
  rebuildParticles();
  particles.forEach(p => p.baseAlpha = p.alpha);

  // Ripple rings from mouse clicks
  let ripples = [];
  window.addEventListener('click', e => {
    ripples.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 180, alpha: 0.5 });
  });

  // Slow scroll offset for parallax grid
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  function drawGrid() {
    const MAGNETIC_RADIUS = 160;
    const MAGNETIC_STRENGTH = 0.38; // max warp in px (normalized)
    const cols = Math.ceil(W / CELL) + 2;
    const rows = Math.ceil(H / CELL) + 2;
    const offX = (scrollY * 0.04) % CELL;
    const offY = (scrollY * 0.04) % CELL;

    ctx.save();
    ctx.strokeStyle = 'rgba(201,168,76,0.07)';
    ctx.lineWidth   = 0.6;

    // Vertical lines
    for (let c = -1; c < cols; c++) {
      const baseX = c * CELL - offX;
      ctx.beginPath();
      for (let r = -1; r <= rows; r++) {
        const baseY = r * CELL - offY;
        // Magnetic warp toward mouse
        const dx  = baseX - mx;
        const dy  = baseY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.max(0, 1 - dist / MAGNETIC_RADIUS);
        const warpX = -dx * pull * MAGNETIC_STRENGTH * 0.3;
        const warpY = -dy * pull * MAGNETIC_STRENGTH * 0.3;
        const px = baseX + warpX;
        const py = baseY + warpY;
        if (r === -1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = -1; r < rows; r++) {
      const baseY = r * CELL - offY;
      ctx.beginPath();
      for (let c = -1; c <= cols; c++) {
        const baseX = c * CELL - offX;
        const dx  = baseX - mx;
        const dy  = baseY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.max(0, 1 - dist / MAGNETIC_RADIUS);
        const warpX = -dx * pull * MAGNETIC_STRENGTH * 0.3;
        const warpY = -dy * pull * MAGNETIC_STRENGTH * 0.3;
        ctx.lineTo(baseX + warpX, baseY + warpY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    const MAG_R = 200;
    particles.forEach(p => {
      // Magnetic pull toward mouse
      const dx   = mx - p.x;
      const dy   = my - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAG_R) {
        const force = (1 - dist / MAG_R) * 0.012;
        p.vx += dx * force;
        p.vy += dy * force;
      }
      // Dampen velocity
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x  += p.vx;
      p.y  += p.vy;

      // Wrap edges
      if (p.x < -10)  p.x = W + 10;
      if (p.x > W+10) p.x = -10;
      if (p.y < -10)  p.y = H + 10;
      if (p.y > H+10) p.y = -10;

      // Glow near mouse
      const glow = dist < 120 ? (1 - dist / 120) * 0.5 : 0;
      const alpha = Math.min(1, p.baseAlpha + glow);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.hue === 0 ? `rgba(255,80,80,1)` : `hsl(${p.hue}, 90%, 65%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur  = 6 + glow * 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + glow * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawRipples() {
    ripples = ripples.filter(rp => rp.alpha > 0.01);
    ripples.forEach(rp => {
      rp.r     += 3.5;
      rp.alpha *= 0.93;
      ctx.save();
      ctx.strokeStyle = `rgba(201,168,76,${rp.alpha})`;
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = 'rgba(201,168,76,0.6)';
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Second ring offset
      if (rp.r > 30) {
        ctx.save();
        ctx.strokeStyle = `rgba(255,100,30,${rp.alpha * 0.5})`;
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r - 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // Mouse-move ripple wave (subtle continuous)
  let lastMx = mx, lastMy = my;
  let waveRipples = [];
  setInterval(() => {
    const d = Math.hypot(mx - lastMx, my - lastMy);
    if (d > 8) {
      waveRipples.push({ x: mx, y: my, r: 0, maxR: 80, alpha: 0.2 });
      lastMx = mx; lastMy = my;
    }
  }, 60);

  function drawWaveRipples() {
    waveRipples = waveRipples.filter(rp => rp.alpha > 0.005);
    waveRipples.forEach(rp => {
      rp.r     += 2.2;
      rp.alpha *= 0.90;
      ctx.save();
      ctx.strokeStyle = `rgba(255,170,30,${rp.alpha})`;
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  (function bgLoop() {
    requestAnimationFrame(bgLoop);
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawWaveRipples();
    drawRipples();
    drawParticles();
  })();
})();
