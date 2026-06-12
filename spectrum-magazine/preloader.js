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

  let progress    = 0;
  let textRevealed = false;

  // Reveal progress bar after short delay
  setTimeout(() => { if (progWrap) progWrap.classList.add('revealed'); }, 200);

  function revealText() {
    if (textRevealed) return;
    textRevealed = true;
    if (zapFlash) {
      zapFlash.classList.add('active');
      setTimeout(() => {
        zapFlash.classList.remove('active');
        titleEl.classList.add('revealed');
        subEl.classList.add('revealed');
      }, 80);
    } else {
      titleEl.classList.add('revealed');
      subEl.classList.add('revealed');
    }
  }

  const interval = setInterval(() => {
    progress += Math.random() * 9 + 4;
    if (progress > 100) progress = 100;
    progBar.style.width = progress + '%';

    // Reveal text early at 55%
    if (progress >= 55) revealText();

    if (progress >= 100) {
      clearInterval(interval);
      // Stay visible for 1.4s after full so text can be read
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          document.body.classList.remove('preloading');
          initScrollReveal();
          initCounters();
          initSectionEffects();
        }, 700);
      }, 1400);
    }
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
    const target = parseInt(el.dataset.count);
    let current  = 0;
    const step   = Math.ceil(target / 40);
    const timer  = setInterval(() => {
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
  document.addEventListener('mousemove', e => {
    if (Math.random() < 0.35) {
      dots.push({
        x: e.clientX, y: e.clientY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        life: 18 + Math.random() * 14, maxLife: 32,
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
      tc.shadowColor = tc.fillStyle;
      tc.shadowBlur  = 6;
      tc.beginPath();
      tc.arc(d.x, d.y, d.size * a, 0, Math.PI * 2);
      tc.fill();
      tc.restore();
    });
  })();
})();

// ══════════════════════════════════════════════════
//  SECTION EFFECTS — called after preloader exits
// ══════════════════════════════════════════════════
function initSectionEffects() {

  // Track global mouse position (page coords)
  let gMouseX = window.innerWidth / 2;
  let gMouseY = window.innerHeight / 2;
  window.addEventListener('mousemove', e => {
    gMouseX = e.clientX;
    gMouseY = e.clientY;
  });

  // ── Helper: create canvas overlaid on a section ──
  function createSectionCanvas(section) {
    const cv = document.createElement('canvas');
    cv.style.cssText = `
      position:absolute; inset:0; width:100%; height:100%;
      pointer-events:none; z-index:0;
    `;
    section.style.position = 'relative';
    section.insertBefore(cv, section.firstChild);
    function resize() {
      cv.width  = section.offsetWidth;
      cv.height = section.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    return cv;
  }

  // ════════════════════════════════════════════════
  //  HERO + MESSAGES — Blue dot cluster (like screenshot)
  //  Dots orbit/collect around mouse center
  // ════════════════════════════════════════════════
  function initDotCloud(section) {
    const cv  = createSectionCanvas(section);
    const ctx = cv.getContext('2d');

    const COUNT = 220;
    const dots  = [];

    for (let i = 0; i < COUNT; i++) {
      // Spawn in a soft elliptical cloud pattern
      const angle  = Math.random() * Math.PI * 2;
      const radius = 80 + Math.random() * 300;
      dots.push({
        // home position relative to mouse — will update dynamically
        angle,
        radius,
        // current screen pos
        x: cv.width  / 2 + Math.cos(angle) * radius,
        y: cv.height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1.5 + Math.random() * 2.8,   // small oval-ish dots
        // soft blue palette — matching screenshot
        blue: 170 + Math.floor(Math.random() * 60),  // hue 210-240
        alpha: 0.35 + Math.random() * 0.5,
        baseAlpha: 0,
        // Individual drift phase
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.003 + Math.random() * 0.006,
      });
    }
    dots.forEach(d => d.baseAlpha = d.alpha);

    let t = 0;
    function loop() {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, cv.width, cv.height);

      // Mouse pos relative to section
      const rect = section.getBoundingClientRect();
      const localMX = gMouseX - rect.left;
      const localMY = gMouseY - rect.top;

      t += 0.016;

      dots.forEach(d => {
        // Drift angle slowly
        d.phase += d.driftSpeed;

        // Target: offset from mouse in elliptical cloud
        const tx = localMX + Math.cos(d.angle + d.phase * 0.4) * d.radius;
        const ty = localMY + Math.sin(d.angle + d.phase * 0.4) * d.radius * 0.65; // flatten vertically

        // Spring toward target
        const dx = tx - d.x;
        const dy = ty - d.y;
        d.vx += dx * 0.018;
        d.vy += dy * 0.018;
        d.vx *= 0.88;
        d.vy *= 0.88;
        d.x  += d.vx;
        d.y  += d.vy;

        // Fade out dots near edges
        const edgeFade = Math.min(
          d.x / 40, (cv.width  - d.x) / 40,
          d.y / 40, (cv.height - d.y) / 40,
          1
        );
        const alpha = Math.max(0, d.baseAlpha * edgeFade);

        ctx.save();
        ctx.globalAlpha = alpha;
        // Blue-purple dots with soft glow — matching screenshot aesthetic
        const hue = 215 + (d.blue - 170) / 60 * 25; // 215–240
        ctx.fillStyle = `hsl(${hue}, 80%, 72%)`;
        ctx.shadowColor = `hsl(${hue}, 90%, 75%)`;
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        // Slight oval to match screenshot dots
        ctx.ellipse(d.x, d.y, d.size, d.size * 1.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
    loop();
  }

  const heroSection     = document.getElementById('home');
  const messagesSection = document.getElementById('messages');
  if (heroSection)     initDotCloud(heroSection);
  if (messagesSection) initDotCloud(messagesSection);

  // ════════════════════════════════════════════════
  //  SPIRIT SECTION — Floating micro-gear particles
  //  Tiny spinning gear icons drift upward slowly
  // ════════════════════════════════════════════════
  function initGearParticles(section) {
    const cv  = createSectionCanvas(section);
    const ctx = cv.getContext('2d');

    const COUNT = 18;
    const gears = [];

    function makeGear() {
      return {
        x:     Math.random() * cv.width,
        y:     cv.height + 20,
        size:  6 + Math.random() * 14,
        speed: 0.3 + Math.random() * 0.5,
        rot:   Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        alpha: 0.07 + Math.random() * 0.13,
        teeth: Math.random() < 0.5 ? 6 : 8,
        drift: (Math.random() - 0.5) * 0.3,
      };
    }
    for (let i = 0; i < COUNT; i++) {
      const g = makeGear();
      g.y = Math.random() * cv.height; // scatter initially
      gears.push(g);
    }

    function drawGearShape(ctx, teeth, r, toothH) {
      ctx.beginPath();
      const step = (Math.PI * 2) / teeth;
      for (let i = 0; i < teeth; i++) {
        const a = i * step;
        const a1 = a - step * 0.22;
        const a2 = a - step * 0.1;
        const a3 = a + step * 0.1;
        const a4 = a + step * 0.22;
        ctx.lineTo(Math.cos(a1) * r,       Math.sin(a1) * r);
        ctx.lineTo(Math.cos(a2) * (r+toothH), Math.sin(a2) * (r+toothH));
        ctx.lineTo(Math.cos(a3) * (r+toothH), Math.sin(a3) * (r+toothH));
        ctx.lineTo(Math.cos(a4) * r,       Math.sin(a4) * r);
      }
      ctx.closePath();
    }

    function loop() {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, cv.width, cv.height);
      gears.forEach(g => {
        g.y     -= g.speed;
        g.x     += g.drift;
        g.rot   += g.rotSpeed;
        if (g.y < -30) { Object.assign(g, makeGear()); }

        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rot);
        ctx.globalAlpha = g.alpha;
        ctx.strokeStyle = 'rgba(201,168,76,1)';
        ctx.lineWidth   = 1;
        drawGearShape(ctx, g.teeth, g.size, g.size * 0.28);
        ctx.stroke();
        // hub dot
        ctx.beginPath();
        ctx.arc(0, 0, g.size * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }
    loop();
  }

  // ════════════════════════════════════════════════
  //  FLIPBOOK SECTION — Subtle floating page-turn dust
  //  Soft rectangle motes drifting like paper dust
  // ════════════════════════════════════════════════
  function initPageDust(section) {
    const cv  = createSectionCanvas(section);
    const ctx = cv.getContext('2d');

    const COUNT = 30;
    const motes = [];

    function makeMote() {
      return {
        x:     Math.random() * cv.width,
        y:     Math.random() * cv.height,
        w:     2 + Math.random() * 5,
        h:     1 + Math.random() * 2.5,
        rot:   Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        vx:   (Math.random() - 0.5) * 0.18,
        vy:   -0.15 - Math.random() * 0.25,
        alpha: 0.04 + Math.random() * 0.09,
        life:  1,
      };
    }
    for (let i = 0; i < COUNT; i++) motes.push(makeMote());

    function loop() {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, cv.width, cv.height);
      // Occasionally spawn new motes
      if (Math.random() < 0.15) motes.push(makeMote());
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.x   += m.vx;
        m.y   += m.vy;
        m.rot += m.rotSpeed;
        if (m.y < -10 || m.x < -10 || m.x > cv.width + 10) {
          motes.splice(i, 1); continue;
        }
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rot);
        ctx.globalAlpha = m.alpha;
        ctx.fillStyle = 'rgba(255,230,150,1)';
        ctx.fillRect(-m.w/2, -m.h/2, m.w, m.h);
        ctx.restore();
      }
    }
    loop();
  }

  const spiritSection   = document.getElementById('spirit');
  const flipbookSection = document.getElementById('flipbook');
  if (spiritSection)   initGearParticles(spiritSection);
  if (flipbookSection) initPageDust(flipbookSection);
}
