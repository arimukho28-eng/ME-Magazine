// ─── PDF.js setup ───
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ─── State ───
let pdfDoc        = null;
let currentSpread = 1;   // left page number of the current spread
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

// ─── Upload handling ───
pdfInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') loadPDF(file);
});

uploadZone.addEventListener('click', () => pdfInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') loadPDF(file);
});

async function loadPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  totalPages = pdfDoc.numPages;
  totalPagesEl.textContent = totalPages;
  currentSpread = 1;

  uploadZone.style.display = 'none';
  flipbookViewer.style.display = 'flex';

  await buildThumbnails();
  await renderSpread(currentSpread);
}

// ─── Render functions ───
async function renderSpread(leftPageNo) {
  isMobile = window.innerWidth <= 700;

  if (isMobile) {
    await renderSinglePage(leftPageNo);
  } else {
    await renderTwoPageSpread(leftPageNo);
  }

  // Update toolbar
  currentPageEl.textContent = leftPageNo;
  prevBtn.disabled = leftPageNo <= 1;
  nextBtn.disabled = isMobile ? leftPageNo >= totalPages : leftPageNo + 1 >= totalPages;

  // Highlight active thumbnail
  document.querySelectorAll('.thumb-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.page) === leftPageNo);
  });

  // Scroll thumbnail into view
  const activeThumb = document.querySelector(`.thumb-item[data-page="${leftPageNo}"]`);
  if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

async function renderTwoPageSpread(leftPageNo) {
  const stageWidth = flipbookStage.clientWidth - 80;
  const stageHeight = flipbookStage.clientHeight - 64;

  const page = await pdfDoc.getPage(leftPageNo);
  const viewport = page.getViewport({ scale: 1 });
  const pageAspect = viewport.height / viewport.width;

  let pageW = Math.min((stageWidth / 2) - 20, 500) * scale;
  let pageH = pageW * pageAspect;
  if (pageH > stageHeight) { pageH = stageHeight; pageW = pageH / pageAspect; }

  await drawPage(leftCanvas, leftPageNo, pageW, pageH);

  const rightPageNo = leftPageNo + 1;
  if (rightPageNo <= totalPages) {
    document.getElementById('rightPageWrapper').style.display = 'block';
    document.querySelector('.book-spine').style.display = 'block';
    await drawPage(rightCanvas, rightPageNo, pageW, pageH);
    rightPageNum.textContent = rightPageNo;
  } else {
    // Only one page left — show blank right page
    rightCanvas.width = pageW;
    rightCanvas.height = pageH;
    const ctx = rightCanvas.getContext('2d');
    ctx.fillStyle = '#f9f7f2';
    ctx.fillRect(0, 0, pageW, pageH);
    rightPageNum.textContent = '';
  }

  leftPageNum.textContent = leftPageNo;
}

async function renderSinglePage(pageNo) {
  const stageWidth  = flipbookStage.clientWidth - 32;
  const stageHeight = flipbookStage.clientHeight - 40;

  const page = await pdfDoc.getPage(pageNo);
  const viewport = page.getViewport({ scale: 1 });
  const aspect = viewport.height / viewport.width;

  let w = Math.min(stageWidth, 480) * scale;
  let h = w * aspect;
  if (h > stageHeight) { h = stageHeight; w = h / aspect; }

  await drawPage(singleCanvas, pageNo, w, h);
  singlePageNum.textContent = `Page ${pageNo} of ${totalPages}`;
}

async function drawPage(canvas, pageNo, w, h) {
  const page     = await pdfDoc.getPage(pageNo);
  const viewport = page.getViewport({ scale: w / page.getViewport({ scale: 1 }).width });
  canvas.width  = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
}

// ─── Thumbnail strip ───
async function buildThumbnails() {
  thumbnailStrip.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const page     = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const w = Math.round((THUMB_HEIGHT / viewport.height) * viewport.width);
    const thumbVP  = page.getViewport({ scale: THUMB_HEIGHT / viewport.height });

    const canvas   = document.createElement('canvas');
    canvas.width   = Math.floor(thumbVP.width);
    canvas.height  = Math.floor(thumbVP.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: thumbVP }).promise;

    const item = document.createElement('div');
    item.className = 'thumb-item';
    item.dataset.page = i;
    item.appendChild(canvas);
    item.addEventListener('click', () => {
      currentSpread = i;
      renderSpread(currentSpread);
    });
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
  if (!document.fullscreenElement) {
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

// ─── Keyboard nav ───
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
window.addEventListener('resize', () => {
  if (pdfDoc) renderSpread(currentSpread);
});

// ─── Mobile nav hamburger ───
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

// ─── Navbar scroll effect ───
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.borderBottomColor =
    window.scrollY > 20 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)';
});
