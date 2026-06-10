// ═══════════════════════════════════════════
//  SPECTRUM — app.js
//  Flipbook engine + mouse-parallax cover card
// ═══════════════════════════════════════════

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
      uploadZone.querySelector('h3').textContent = 'Loading SPECTRUM…';
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
async function renderSpread(leftPageNo) {
  isMobile = window.innerWidth <= 700;

  const bookSpreadEl  = document.querySelector('.book-spread');
  const singlePageEl  = document.getElementById('singlePageView');

  if (isMobile) {
    bookSpreadEl.style.display  = 'none';
    singlePageEl.style.display  = 'block';
    await renderSinglePage(leftPageNo);
  } else {
    bookSpreadEl.style.display  = 'flex';
    singlePageEl.style.display  = 'none';
    await renderTwoPageSpread(leftPageNo);
  }

  currentPageEl.textContent = leftPageNo;
  prevBtn.disabled = leftPageNo <= 1;
  nextBtn.disabled = isMobile ? leftPageNo >= totalPages : leftPageNo + 1 >= totalPages;

  document.querySelectorAll('.thumb-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.page) === leftPageNo);
  });
  const activeThumb = document.querySelector(`.thumb-item[data-page="${leftPageNo}"]`);
  if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

async function renderTwoPageSpread(leftPageNo) {
  const stageWidth  = flipbookStage.clientWidth  - 80;
  const stageHeight = flipbookStage.clientHeight - 64;

  const page    = await pdfDoc.getPage(leftPageNo);
  const viewport = page.getViewport({ scale: 1 });
  const aspect  = viewport.height / viewport.width;

  let pageW = Math.min((stageWidth / 2) - 20, 500) * scale;
  let pageH = pageW * aspect;
  if (pageH > stageHeight) { pageH = stageHeight; pageW = pageH / aspect; }

  await drawPage(leftCanvas, leftPageNo, pageW, pageH);
  leftPageNum.textContent = leftPageNo;

  const rightPageNo = leftPageNo + 1;
  const rightWrapper = document.getElementById('rightPageWrapper');
  const spineEl      = document.querySelector('.book-spine');

  if (rightPageNo <= totalPages) {
    rightWrapper.style.display = 'block';
    spineEl.style.display      = 'block';
    await drawPage(rightCanvas, rightPageNo, pageW, pageH);
    rightPageNum.textContent = rightPageNo;
  } else {
    rightCanvas.width  = pageW;
    rightCanvas.height = pageH;
    const ctx = rightCanvas.getContext('2d');
    ctx.fillStyle = '#f9f7f2';
    ctx.fillRect(0, 0, pageW, pageH);
    rightPageNum.textContent = '';
  }
}

async function renderSinglePage(pageNo) {
  const stageWidth  = flipbookStage.clientWidth  - 32;
  const stageHeight = flipbookStage.clientHeight - 40;

  const page    = await pdfDoc.getPage(pageNo);
  const viewport = page.getViewport({ scale: 1 });
  const aspect  = viewport.height / viewport.width;

  let w = Math.min(stageWidth, 480) * scale;
  let h = w * aspect;
  if (h > stageHeight) { h = stageHeight; w = h / aspect; }

  await drawPage(singleCanvas, pageNo, w, h);
  singlePageNum.textContent = `Page ${pageNo} of ${totalPages}`;
}

async function drawPage(canvas, pageNo, w, h) {
  const page     = await pdfDoc.getPage(pageNo);
  const vp       = page.getViewport({ scale: w / page.getViewport({ scale: 1 }).width });
  canvas.width   = Math.floor(vp.width);
  canvas.height  = Math.floor(vp.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
}

// ─── Thumbnails ───
async function buildThumbnails() {
  thumbnailStrip.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const page    = await pdfDoc.getPage(i);
    const vp      = page.getViewport({ scale: 1 });
    const thumbVP = page.getViewport({ scale: THUMB_HEIGHT / vp.height });

    const canvas   = document.createElement('canvas');
    canvas.width   = Math.floor(thumbVP.width);
    canvas.height  = Math.floor(thumbVP.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: thumbVP }).promise;

    const item = document.createElement('div');
    item.className   = 'thumb-item';
    item.dataset.page = i;
    item.appendChild(canvas);
    item.addEventListener('click', () => { currentSpread = i; renderSpread(currentSpread); });
    thumbnailStrip.appendChild(item);
  }
}

// ─── Controls ───
prevBtn.addEventListener('click', () => {
  if (isMobile) {
    if (currentSpread > 1) { currentSpread--; renderSpread(currentSpread); }
  } else {
    if (currentSpread > 1) { currentSpread = Math.max(1, currentSpread - 2); renderSpread(currentSpread); }
  }
});
nextBtn.addEventListener('click', () => {
  if (isMobile) {
    if (currentSpread < totalPages) { currentSpread++; renderSpread(currentSpread); }
  } else {
    if (currentSpread + 1 < totalPages) { currentSpread += 2; renderSpread(currentSpread); }
  }
});
zoomIn.addEventListener('click',  () => { scale = Math.min(scale + 0.2, 2.5); renderSpread(currentSpread); });
zoomOut.addEventListener('click', () => { scale = Math.max(scale - 0.2, 0.4); renderSpread(currentSpread); });
fullscreenBtn.addEventListener('click', () => {
  const el = document.getElementById('flipbook');
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// ─── Keyboard ───
document.addEventListener('keydown', (e) => {
  if (!pdfDoc) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextBtn.click();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevBtn.click();
});

// ─── Touch swipe ───
let touchStartX = 0;
flipbookStage.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
flipbookStage.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) { dx < 0 ? nextBtn.click() : prevBtn.click(); }
}, { passive: true });

// ─── Resize ───
window.addEventListener('resize', () => { if (pdfDoc) renderSpread(currentSpread); });

// ─── Navbar scroll ───
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.borderBottomColor =
    window.scrollY > 20 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)';
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
