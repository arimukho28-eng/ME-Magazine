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

  // Track global mouse position
  let gMouseX = window.innerWidth / 2;
  let gMouseY = window.innerHeight / 2;
  window.addEventListener('mousemove', e => {
    gMouseX = e.clientX;
    gMouseY = e.clientY;
  });

  // ── Helper: create canvas overlaid on a section ──
  function createSectionCanvas(section) {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    section.style.position = 'relative';
    section.insertBefore(cv, section.firstChild);
    function resize() { cv.width = section.offsetWidth; cv.height = section.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    return cv;
  }

  // ════════════════════════════════════════════════
  //  HERO + MESSAGES — tiny sharp scattered star-points
  //  Spread evenly across the whole section.
  //  Mouse proximity causes a subtle local glow.
  // ════════════════════════════════════════════════
  function initStarfield(section) {
    const cv  = createSectionCanvas(section);
    const ctx = cv.getContext('2d');
    const GLOW_RADIUS = 130; // px — how close mouse must be to light a dot

    // Seed once, then only update on resize
    let stars = [];
    function seed() {
      stars = [];
      // ~1 star per 4000px² — dense enough to feel present, sparse enough to feel fine
      const count = Math.floor((cv.width * cv.height) / 3800);
      for (let i = 0; i < count; i++) {
        stars.push({
          x:    Math.random() * cv.width,
          y:    Math.random() * cv.height,
          r:    0.35 + Math.random() * 0.65,   // 0.35–1px — very small
          baseAlpha: 0.08 + Math.random() * 0.18, // nearly invisible at rest
          // slow drift
          vx:   (Math.random() - 0.5) * 0.06,
          vy:   (Math.random() - 0.5) * 0.06,
          // hue: mostly cool white/blue, occasional warm
          hue:  Math.random() < 0.7
                  ? 210 + Math.random() * 40    // blue-white
                  : 38  + Math.random() * 20,   // warm gold
        });
      }
    }
    seed();
    window.addEventListener('resize', () => { seed(); });

    function loop() {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, cv.width, cv.height);

      const rect  = section.getBoundingClientRect();
      const lx    = gMouseX - rect.left;
      const ly    = gMouseY - rect.top;

      stars.forEach(s => {
        // Gentle drift
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0)        s.x = cv.width;
        if (s.x > cv.width) s.x = 0;
        if (s.y < 0)        s.y = cv.height;
        if (s.y > cv.height) s.y = 0;

        // Mouse proximity — smooth falloff
        const dx   = s.x - lx;
        const dy   = s.y - ly;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const prox = dist < GLOW_RADIUS
                       ? 1 - (dist / GLOW_RADIUS)   // 0→1 as mouse approaches
                       : 0;

        // Boost alpha subtly — max glow still only ~0.65
        const alpha = s.baseAlpha + prox * 0.47;
        const glow  = prox * 5;     // shadowBlur 0→5px max — barely visible
        const radius = s.r + prox * 0.8;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = `hsl(${s.hue}, 70%, 82%)`;
        if (prox > 0.05) {
          ctx.shadowColor = `hsl(${s.hue}, 90%, 88%)`;
          ctx.shadowBlur  = glow;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
    loop();
  }

  const heroSection     = document.getElementById('home');
  const messagesSection = document.getElementById('messages');
  if (heroSection)     initStarfield(heroSection);
  if (messagesSection) initStarfield(messagesSection);

  // ── Canvas heartbeat shimmer on IMPULSE title ──
  // Draws a small glowing pulse that blooms near the end
  // of the word and fades — no CSS line artifacts
  (function initHeartbeatCanvas() {
    const wrap = document.querySelector('.hero-title-wrap');
    const title = document.querySelector('.hero-title');
    if (!wrap || !title) return;

    const cv  = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    wrap.appendChild(cv);

    function resize() {
      cv.width  = wrap.offsetWidth;
      cv.height = wrap.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const ctx = cv.getContext('2d');
    let t = 0;

    // Heartbeat: one clean QRS pulse every ~3 seconds
    // Phase 0–1 over 3s.  Pulse fires at phase ~0.05, fully gone by 0.25.
    function loop() {
      requestAnimationFrame(loop);
      t += 0.038; // ~0.5 cycles/sec at 60fps
      if (t > 1) t -= 1;

      ctx.clearRect(0, 0, cv.width, cv.height);

      // Pulse envelope — sharp rise, fast decay, silence the rest
      let env = 0;
      if (t < 0.08) {
        // Rise: 0→peak
        env = t / 0.08;
      } else if (t < 0.18) {
        // Decay: peak→0
        env = 1 - (t - 0.08) / 0.10;
      }
      // env is 0 for the other 82% of the cycle — pure silence

      if (env < 0.005) return; // nothing to draw

      // Position: right ~15% of the title width (near the 'E')
      const cx = cv.width  * 0.80;
      const cy = cv.height * 0.50;

      ctx.save();
ctx.globalCompositeOperation = 'screen';

const waveWidth = 55;
const waveHeight = 12;

ctx.strokeStyle = `rgba(255,210,90,${0.9 * env})`;
ctx.lineWidth = 2.2;
ctx.shadowColor = 'rgba(255,180,50,0.9)';
ctx.shadowBlur = 10;

ctx.beginPath();

const startX = cx - waveWidth / 2;

ctx.moveTo(startX, cy);

ctx.lineTo(startX + 12, cy);
ctx.lineTo(startX + 18, cy - 4);
ctx.lineTo(startX + 24, cy + 8);
ctx.lineTo(startX + 30, cy - 12);
ctx.lineTo(startX + 36, cy + 6);
ctx.lineTo(startX + 44, cy);
ctx.lineTo(startX + waveWidth, cy);

ctx.stroke();
ctx.restore();

   } // end loop()

    loop();
  })();
    
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
