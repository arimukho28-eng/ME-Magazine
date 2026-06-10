/* ═══════════════════════════════════════════════════
   IMPULSE — Preloader + Scroll Reveal + Hover Effects
   ═══════════════════════════════════════════════════ */

// ── Preloader canvas spark engine ──────────────────
(function initPreloader() {
  const overlay = document.getElementById('preloader');
  const canvas  = document.getElementById('preloader-canvas');
  const ctx     = canvas.getContext('2d');
  const titleEl = document.getElementById('preloader-title');
  const subEl   = document.getElementById('preloader-sub');
  const progBar = document.getElementById('preloader-bar');

  let W, H, particles = [], sparks = [], rafId;
  let phase = 'spark'; // spark → reveal → exit
  let revealProgress = 0;
  let phaseTimer = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Particle class ──
  class Particle {
    constructor(x, y, vx, vy, life, size, color) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.life = life; this.maxLife = life;
      this.size = size; this.color = color;
      this.gravity = 0.12;
      this.alpha = 1;
    }
    update() {
      this.x  += this.vx;
      this.y  += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.97;
      this.life--;
      this.alpha = Math.pow(this.life / this.maxLife, 0.6);
      this.size *= 0.985;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Spark class (bright thin streaks) ──
  class Spark {
    constructor(x, y) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 2 + Math.random() * 8;
      this.x  = x; this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - Math.random() * 3;
      this.life = 20 + Math.random() * 30;
      this.maxLife = this.life;
      this.len = 4 + Math.random() * 14;
    }
    update() {
      this.x  += this.vx;
      this.y  += this.vy;
      this.vy += 0.15;
      this.vx *= 0.96;
      this.life--;
    }
    draw() {
      const alpha = this.life / this.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = `hsl(${30 + Math.random()*30}, 100%, ${70 + Math.random()*25}%)`;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur  = 6;
      ctx.lineWidth   = 0.8 + alpha;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * this.len * 0.3, this.y - this.vy * this.len * 0.3);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Letter spark burst positions ──
  // We burst sparks from letter center positions of "IMPULSE"
  const LETTER_OFFSETS = [
    { x: -0.355, label: 'I' },
    { x: -0.255, label: 'M' },
    { x: -0.13,  label: 'P' },
    { x: -0.015, label: 'U' },
    { x:  0.09,  label: 'L' },
    { x:  0.195, label: 'S' },
    { x:  0.305, label: 'E' },
  ];

  let burstQueue = [...LETTER_OFFSETS];
  let burstInterval = null;
  let burstIndex = 0;

  function burstLetter(offsetX) {
    const cx = W * (0.5 + offsetX);
    const cy = H * 0.46;
    const count = 40 + Math.floor(Math.random() * 30);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      particles.push(new Particle(
        cx + (Math.random() - 0.5) * 20,
        cy + (Math.random() - 0.5) * 10,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1,
        25 + Math.random() * 30,
        1.5 + Math.random() * 3,
        `hsl(${20 + Math.random()*40}, 100%, ${55 + Math.random()*35}%)`
      ));
      sparks.push(new Spark(cx, cy));
    }
    // Big flash particle
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle(cx, cy,
        (Math.random()-0.5)*3, (Math.random()-0.5)*3,
        15, 8 + Math.random()*6, '#fff5cc'));
    }
  }

  // Gear drawing
  function drawGear(cx, cy, r, teeth, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(201,168,76,0.4)';
    ctx.lineWidth   = 1;
    const toothH = r * 0.28;
    const toothW = (2 * Math.PI / teeth) * 0.4;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = a0 + toothW * 0.5;
      const a2 = a0 + toothW;
      const a3 = a0 + (2 * Math.PI / teeth) - toothW * 0.3;
      ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      ctx.lineTo(cx + Math.cos(a1) * (r + toothH), cy + Math.sin(a1) * (r + toothH));
      ctx.lineTo(cx + Math.cos(a2) * (r + toothH), cy + Math.sin(a2) * (r + toothH));
      ctx.lineTo(cx + Math.cos(a3) * r, cy + Math.sin(a3) * r);
    }
    ctx.closePath();
    ctx.stroke();
    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  let gearAngle = 0;
  let startTime = performance.now();

  // ── Main loop ──
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const elapsed = ts - startTime;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#07070f';
    ctx.fillRect(0, 0, W, H);

    // Animated gears (decorative)
    gearAngle += 0.005;
    drawGear(W * 0.12, H * 0.5,  80, 12, 0.15 + Math.sin(elapsed * 0.001) * 0.05);
    drawGear(W * 0.88, H * 0.5,  65, 10, 0.12 + Math.cos(elapsed * 0.001) * 0.05);
    drawGear(W * 0.5,  H * 0.85, 50,  8, 0.1);

    // Burst letters one by one during spark phase
    if (phase === 'spark') {
      const letterDelay = 120; // ms between each letter burst
      const newIndex = Math.floor(elapsed / letterDelay);
      if (newIndex > burstIndex && burstIndex < LETTER_OFFSETS.length) {
        burstLetter(LETTER_OFFSETS[burstIndex].x);
        burstIndex++;
      }

      // After all letters burst, start reveal
      if (burstIndex >= LETTER_OFFSETS.length && elapsed > LETTER_OFFSETS.length * letterDelay + 400) {
        phase = 'reveal';
      }

      // Progress bar
      const prog = Math.min(elapsed / (LETTER_OFFSETS.length * letterDelay + 400), 1);
      progBar.style.width = (prog * 60) + '%';
    }

    // Reveal phase — fade in title text
    if (phase === 'reveal') {
      revealProgress = Math.min(revealProgress + 0.025, 1);
      titleEl.style.opacity  = revealProgress;
      titleEl.style.transform = `translateY(${(1 - revealProgress) * 30}px)`;
      subEl.style.opacity    = Math.max(0, revealProgress - 0.4) / 0.6;
      progBar.style.width    = (60 + revealProgress * 35) + '%';

      if (revealProgress >= 1) {
        setTimeout(() => { phase = 'exit'; progBar.style.width = '100%'; }, 600);
      }
    }

    // Exit phase
    if (phase === 'exit') {
      overlay.style.transition = 'opacity 0.7s ease';
      overlay.style.opacity    = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        document.body.classList.remove('preloading');
        cancelAnimationFrame(rafId);
        initScrollReveal();
        initCounters();
      }, 720);
      phase = 'done';
    }

    // Update + draw particles
    particles = particles.filter(p => p.life > 0);
    sparks    = sparks.filter(s => s.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    sparks.forEach(s    => { s.update(); s.draw(); });
  }

  requestAnimationFrame(loop);
})();


// ── Scroll Reveal (IntersectionObserver) ───────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.spirit-card, .message-card, .section-title, .section-label, ' +
    '.hero-eyebrow, .hero-title, .hero-tagline, .hero-desc, .hero-actions, ' +
    '.flipbook-upload-zone, .flipbook-viewer, .footer-brand'
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


// ── Animated counters (if any stat elements exist) ─
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


// ── Custom cursor spark trail ───────────────────────
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
  let mx = -999, my = -999;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (Math.random() < 0.35) {
      dots.push({
        x: mx, y: my,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        life: 18 + Math.random() * 14,
        maxLife: 32,
        size: 1.5 + Math.random() * 2.5,
        hue: 20 + Math.random() * 30
      });
    }
  });

  function trailLoop() {
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
  }
  trailLoop();
})();
