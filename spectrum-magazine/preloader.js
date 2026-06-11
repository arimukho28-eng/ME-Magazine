/* ═══════════════════════════════════════════════════
   IMPULSE — Preloader + Scroll Reveal + Hover Effects
   ═══════════════════════════════════════════════════ */

// ── Preloader canvas spark engine ──────────────────
(function initPreloader() {
  const overlay = document.getElementById('preloader');
  const titleEl = document.getElementById('preloader-title');
  const subEl   = document.getElementById('preloader-sub');
  const progBar = document.getElementById('preloader-bar');

  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 12;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      titleEl.style.opacity = '1';
      titleEl.style.transform = 'translateY(0)';
      subEl.style.opacity = '1';

      setTimeout(() => {
        overlay.style.transition = 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          document.body.classList.remove('preloading');
          initScrollReveal();
          initCounters();
        }, 610);
      }, 800);
    }
    progBar.style.width = progress + '%';
  }, 100);
})();

// ── Scroll Reveal (IntersectionObserver) ───────────
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
