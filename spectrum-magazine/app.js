// ═══════════════════════════════════════════
//  IMPULSE — app.js
//  Flipbook engine + mouse-parallax cover card
// ═══════════════════════════════════════════

if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// ─── PDF.js setup ───
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ─── State ───
let pdfDoc        = null;
let currentSpread = 1;
let totalPages    = 0;
let scale         = 1.0;
let isMobile      = window.innerWidth <= 700;

const THUMB_HEIGHT = 80;

// ─── Element refs ───
const pdfInput       = document.getElementById('pdfInput');
const uploadZone     = document.getElementById('uploadZone');
const flipbookViewer = document.getElementById('flipbookViewer');
const leftCanvas     = document.getElementById('leftCanvas');
const rightCanvas    = document.getElementById('rightCanvas');
const singleCanvas   = document.getElementById('singleCanvas');
const leftPageNum    = document.getElementById('leftPageNum');
const rightPageNum   = document.getElementById('rightPageNum');
const singlePageNum  = document.getElementById('singlePageNum');
const prevBtn        = document.getElementById('prevBtn');
const nextBtn        = document.getElementById('nextBtn');
const currentPageEl  = document.getElementById('currentPage');
const totalPagesEl   = document.getElementById('totalPages');
const thumbnailStrip = document.getElementById('thumbnailStrip');
const zoomIn         = document.getElementById('zoomIn');
const zoomOut        = document.getElementById('zoomOut');
const fullscreenBtn  = document.getElementById('fullscreenBtn');
const flipbookStage  = document.getElementById('flipbookStage');

// ═══════════════════════════════════════════
//  AUTO-LOAD: Try to fetch ME-MAGAZINE.pdf
//  sitting next to index.html in the repo.
// ═══════════════════════════════════════════
(async function autoLoad() {
  try {
    const res = await fetch('ME-MAGAZINE.pdf', { method: 'HEAD' });
    if (res.ok) {
      uploadZone.querySelector('h3').textContent = 'Loading IMPULSE…';
      const pdfRes  = await fetch('ME-MAGAZINE.pdf');
      const buffer  = await pdfRes.arrayBuffer();
      await loadPDFFromBuffer(buffer);
    } else {
      // PDF not present yet — show manual upload UI
      showUploadUI();
    }
  } catch (_) {
    showUploadUI();
  }
})();

function showUploadUI() {
  uploadZone.querySelector('h3').textContent = 'Upload Magazine PDF';
  uploadZone.querySelector('p').textContent  = 'Drag & drop the PDF here, or click to browse';
}

// ─── Manual upload ───
pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    const buf = await file.arrayBuffer();
    loadPDFFromBuffer(buf);
  }
});

uploadZone.addEventListener('click', () => pdfInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    const buf = await file.arrayBuffer();
    loadPDFFromBuffer(buf);
  }
});

// ─── Core load ───
async function loadPDFFromBuffer(arrayBuffer) {
  pdfDoc        = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  totalPages    = pdfDoc.numPages;
  currentSpread = 1;
  totalPagesEl.textContent = totalPages;

  uploadZone.style.display    = 'none';
  flipbookViewer.style.display = 'flex';

  await buildThumbnails();
  await renderSpread(currentSpread);
}

// ─── Render spread ───
let pageFlipInstance = null;

async function loadPDFFromBuffer(arrayBuffer) {
  pdfDoc     = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  totalPages = pdfDoc.numPages;
  totalPagesEl.textContent = totalPages;

  uploadZone.style.display     = 'none';
  flipbookViewer.style.display = 'flex';

  await render3DMagazine();
}

async function render3DMagazine() {
  const container = document.getElementById('magazine-3d-book');
  container.innerHTML = ''; 

  const stageWidth = flipbookStage.clientWidth - 40;
  const isSinglePageMode = window.innerWidth <= 700;

  const basePage = await pdfDoc.getPage(1);
  const baseViewport = basePage.getViewport({ scale: 1 });
  const pageAspect = baseViewport.height / baseViewport.width;

  let targetPageWidth = isSinglePageMode ? Math.min(stageWidth, 420) : Math.min(stageWidth / 2, 460);
  let targetPageHeight = targetPageWidth * pageAspect;

  for (let i = 1; i <= totalPages; i++) {
    const pageContainer = document.createElement('div');
    pageContainer.className = 'page-3d-wrap';

    if (i === 1 || i === totalPages) {
      pageContainer.setAttribute('data-density', 'hard');
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    pageContainer.appendChild(canvas);
    container.appendChild(pageContainer);

    const page = await pdfDoc.getPage(i);
    const renderViewport = page.getViewport({ scale: (targetPageWidth / baseViewport.width) * 2 });
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;

    await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;
  }

  container.style.opacity = '1';

  pageFlipInstance = new St.PageFlip(container, {
    width: targetPageWidth,
    height: targetPageHeight,
    size: "fixed",
    minWidth: 260,
    maxWidth: 600,
    minHeight: 350,
    maxHeight: 900,
    drawShadow: true,
    showCover: true,
    useMouseEvents: true, 
    useTouchEvents: true  
  });

  pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-3d-wrap'));
  currentPageEl.textContent = 1;

  pageFlipInstance.on('flip', (e) => {
    currentPageEl.textContent = e.data + 1;
    prevBtn.disabled = e.data === 0;
    nextBtn.disabled = e.data >= totalPages - 2;
  });
}

prevBtn.addEventListener('click', () => { pageFlipInstance?.flipPrev(); });
nextBtn.addEventListener('click', () => { pageFlipInstance?.flipNext(); });

zoomIn.addEventListener('click', () => { scale = Math.min(scale + 0.1, 1.5); render3DMagazine(); });
zoomOut.addEventListener('click', () => { scale = Math.max(scale - 0.1, 0.8); render3DMagazine(); });

fullscreenBtn.addEventListener('click', () => {
  const el = document.getElementById('flipbook');
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
});

document.addEventListener('keydown', (e) => {
  if (!pageFlipInstance) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') pageFlipInstance.flipNext();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') pageFlipInstance.flipPrev();
});

// ─── Resize ───
window.addEventListener('resize', () => { if (pdfDoc) renderSpread(currentSpread); });

// ─── Navbar scroll ───
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 30) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ─── Mobile hamburger ───
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

// ─── Faculty overlay ───
function openFacultyTab() {
  const overlay = document.getElementById('facultyOverlayTab');
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);
  document.getElementById('mobileMenu').classList.remove('open');
}
function closeFacultyTab() {
  const overlay = document.getElementById('facultyOverlayTab');
  overlay.classList.remove('open');
  setTimeout(() => overlay.style.display = 'none', 300);
}

// ═══════════════════════════════════════════
//  MOUSE-PARALLAX TILT for hero cover card
//  3D tilt + depth layers follow the cursor
// ═══════════════════════════════════════════
(function initCoverParallax() {
  const coverCard = document.getElementById('coverCard');
  const coverArt  = document.getElementById('coverArt');
  if (!coverCard || !coverArt) return;

  // Only run on non-touch devices
  if ('ontouchstart' in window) return;

  const MAX_TILT   = 18;   // degrees
  const MAX_MOVE   = 22;   // px for art container drift
  const LERP_SPEED = 0.10; // smoothing factor (lower = smoother)

  let targetRX = 0, targetRY = 0;
  let targetMX = 0, targetMY = 0;
  let curRX = 0, curRY = 0;
  let curMX = 0, curMY = 0;
  let raf = null;
  let inside = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    curRX = lerp(curRX, targetRX, LERP_SPEED);
    curRY = lerp(curRY, targetRY, LERP_SPEED);
    curMX = lerp(curMX, targetMX, LERP_SPEED);
    curMY = lerp(curMY, targetMY, LERP_SPEED);

    // 3D tilt on the card
    coverCard.style.transform =
      `perspective(700px) rotateX(${curRX}deg) rotateY(${curRY}deg) scale3d(1.04,1.04,1.04)`;

    // Subtle drift of the whole art container
    coverArt.style.transform =
      `translateY(-50%) translate(${curMX * 0.3}px, ${curMY * 0.3}px)`;

    raf = requestAnimationFrame(animate);
  }

  document.addEventListener('mousemove', (e) => {
    const hw = window.innerWidth  / 2;
    const hh = window.innerHeight / 2;
    // Normalized -1…+1
    const nx = (e.clientX - hw) / hw;
    const ny = (e.clientY - hh) / hh;

    targetRY =  nx * MAX_TILT;   // left–right tilt
    targetRX = -ny * MAX_TILT;   // up–down tilt
    targetMX =  nx * MAX_MOVE;
    targetMY =  ny * MAX_MOVE;
  });

  // Reset on mouse leave (whole document)
  document.addEventListener('mouseleave', () => {
    targetRX = targetRY = targetMX = targetMY = 0;
  });

  // Start loop
  animate();

  // Shine effect on hover
  coverCard.addEventListener('mousemove', (e) => {
    const rect = coverCard.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    coverCard.style.setProperty('--shine-x', `${x}%`);
    coverCard.style.setProperty('--shine-y', `${y}%`);
  });
})();
