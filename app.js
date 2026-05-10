/**
 * Portrait to Text Generator — UI Handler
 * Handles: file upload, drag-&-drop, Cropper.js init (A4 fixed ratio),
 *          textarea counter, and generate action.
 * Core canvas / PDF logic lives in window.executeCoreLogic().
 */

(function () {
  'use strict';

  // ── DOM References ────────────────────────────────────────
  const fileInput      = document.getElementById('file-input');
  const uploadZone     = document.getElementById('upload-zone');
  const cropperSection = document.getElementById('cropper-section');
  const cropImage      = document.getElementById('crop-image');
  const userTextArea   = document.getElementById('user-text');
  const charCounter    = document.getElementById('char-counter');
  const generateBtn    = document.getElementById('generate-btn');
  const imgChip        = document.getElementById('img-chip');
  const chipThumb      = document.getElementById('chip-thumb');
  const chipName       = document.getElementById('chip-name');
  const chipSize       = document.getElementById('chip-size');
  const chipRemove     = document.getElementById('chip-remove');
  const toastContainer = document.getElementById('toast-container');

  // ── Constants ─────────────────────────────────────────────
  const A4_RATIO  = 210 / 297;   // A4 portrait — fixed, never changes
  const MAX_CHARS = 2000;

  // ── State ─────────────────────────────────────────────────
  let cropper = null;

  // ── Toast Utility ─────────────────────────────────────────
  function showToast(message, type = 'info', duration = 3500) {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  // ── Format Bytes ──────────────────────────────────────────
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // ── Initialise / Destroy Cropper ──────────────────────────
  // aspectRatio is always A4 portrait (210/297). The user cannot change it.
  function initCropper() {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropper = new Cropper(cropImage, {
      aspectRatio: A4_RATIO,
      viewMode: 1,
      autoCropArea: 0.85,
      movable: true,
      zoomable: true,
      rotatable: false,
      scalable: false,
      responsive: true,
      checkOrientation: true,
      background: false,
      guides: true,
      center: true,
      highlight: true,
    });
  }

  // ── Load Image into Cropper ───────────────────────────────
  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP…)', 'error');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      showToast('Image too large. Please use a file under 30 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;

      // Update chip
      chipThumb.src    = src;
      chipName.textContent = file.name;
      chipSize.textContent = formatBytes(file.size);
      imgChip.classList.add('visible');

      // Show cropper section
      cropperSection.classList.add('visible');
      uploadZone.style.display = 'none';

      // Replace image src and init cropper locked to A4 ratio
      cropImage.src = src;
      initCropper();

      showToast('Image loaded — adjust the crop area below.', 'success');
    };

    reader.onerror = () => showToast('Failed to read file. Try again.', 'error');
    reader.readAsDataURL(file);
  }

  // ── Upload Zone — Click ───────────────────────────────────
  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) loadImageFile(fileInput.files[0]);
    fileInput.value = ''; // reset so same file can be re-uploaded
  });

  // ── Upload Zone — Drag & Drop ─────────────────────────────
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  ['dragleave', 'dragend'].forEach((evt) =>
    uploadZone.addEventListener(evt, () => uploadZone.classList.remove('drag-over'))
  );

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    loadImageFile(file);
  });

  // ── Remove / Reset Image ──────────────────────────────────
  chipRemove.addEventListener('click', () => {
    if (cropper) { cropper.destroy(); cropper = null; }
    cropImage.src = '';
    imgChip.classList.remove('visible');
    cropperSection.classList.remove('visible');
    uploadZone.style.display = '';
    showToast('Image removed.', 'info', 2000);
  });

  // ── Character Counter ─────────────────────────────────────
  function updateCharCount() {
    const len = userTextArea.value.length;
    charCounter.textContent = `${len} / ${MAX_CHARS}`;
    charCounter.className   = 'char-counter';
    if (len >= MAX_CHARS) charCounter.classList.add('limit');
    else if (len >= MAX_CHARS * 0.85) charCounter.classList.add('warn');
  }

  userTextArea.addEventListener('input', updateCharCount);
  updateCharCount();

  userTextArea.addEventListener('keydown', (e) => {
    if (userTextArea.value.length >= MAX_CHARS && e.key !== 'Backspace' && e.key !== 'Delete') {
      if (!e.ctrlKey && !e.metaKey && e.key.length === 1) e.preventDefault();
    }
  });

  // ── Loading screen DOM refs ────────────────────────────────
  const loadingScreen    = document.getElementById('loading-screen');
  const lsStatus         = document.getElementById('ls-status');
  const lsPercent        = document.getElementById('ls-percent');
  const lsFill           = document.getElementById('ls-fill');
  const lsTrack          = document.getElementById('ls-track');
  const resultsSection   = document.getElementById('results-section');
  const generateWrap     = document.getElementById('generate-wrap');
  const downloadPdfBtn   = document.getElementById('download-pdf-btn');
  const startOverBtn     = document.getElementById('start-over-btn');

  // ── Status message map ─────────────────────────────────────
  const STAGES = [
    { until: 30,  label: 'Analyzing pixels...' },
    { until: 70,  label: 'Mapping characters...' },
    { until: 99,  label: 'Generating your PDF masterpiece...' },
  ];

  // ── Fake progress (≈6 s) — returns a Promise ──────────────
  function runFakeProgress() {
    return new Promise((resolve) => {
      const TOTAL_MS   = 6000;
      const TICK_MS    = 40;       // update every 40 ms
      const steps      = TOTAL_MS / TICK_MS;
      let   tick       = 0;

      const id = setInterval(() => {
        tick++;
        // Ease-out curve so it slows near 99%
        const raw     = tick / steps;
        const eased   = 1 - Math.pow(1 - raw, 2.5);
        const pct     = Math.min(Math.floor(eased * 99), 99);

        // Update fill & aria
        lsFill.style.width          = pct + '%';
        lsTrack.setAttribute('aria-valuenow', pct);
        lsPercent.textContent       = pct + '%';

        // Update status label on threshold crossings
        const stage = STAGES.find(s => pct < s.until) || STAGES[STAGES.length - 1];
        if (lsStatus.textContent !== stage.label) {
          lsStatus.classList.add('changing');
          setTimeout(() => {
            lsStatus.textContent = stage.label;
            lsStatus.classList.remove('changing');
          }, 200);
        }

        if (tick >= steps) {
          clearInterval(id);
          // Snap to 100%
          lsFill.style.width    = '100%';
          lsPercent.textContent = '100%';
          lsTrack.setAttribute('aria-valuenow', 100);
          setTimeout(resolve, 350);   // brief pause at 100%
        }
      }, TICK_MS);
    });
  }

  // ── Show / hide helpers ────────────────────────────────────
  function showLoadingScreen() {
    document.getElementById('step-upload').hidden = true;
    document.getElementById('step-text').hidden   = true;
    generateWrap.hidden                           = true;
    lsFill.style.width    = '0%';
    lsPercent.textContent = '0%';
    lsStatus.textContent  = STAGES[0].label;
    loadingScreen.hidden  = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showResultsScreen() {
    loadingScreen.hidden = true;
    // Reset download button to default state
    downloadPdfBtn.disabled    = false;
    downloadPdfBtn.textContent = '⬇ Download PDF';
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetToForm() {
    resultsSection.hidden                         = true;
    loadingScreen.hidden                          = true;
    document.getElementById('step-upload').hidden = false;
    document.getElementById('step-text').hidden   = false;
    generateWrap.hidden                           = false;
    // Clear the typographic art preview
    const pc = document.getElementById('portrait-container');
    if (pc) pc.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Core generate flow ─────────────────────────────────────
  let _lastCroppedSrc = null;
  let _lastUserText   = null;

  async function runGeneration(croppedSrc, userText) {
    showLoadingScreen();
    try {
      // 1. Wait for the bar to finish (≈6 s) — download does NOT start yet
      await runFakeProgress();

      // 2. Bar is at 100% — NOW trigger the real generation + download
      await window.executeCoreLogic(croppedSrc, userText);

      showResultsScreen();
    } catch (err) {
      console.error('[Portrait Gen] executeCoreLogic threw:', err);
      resetToForm();
      showToast('Something went wrong during generation. Check the console.', 'error');
    }
  }

  // ── Generate Button ───────────────────────────────────────
  generateBtn.addEventListener('click', async () => {
    // Validation: image
    if (!cropper) {
      showToast('Please upload and crop an image first.', 'error');
      return;
    }

    // Validation: text
    const userText = userTextArea.value.trim();
    if (!userText) {
      showToast('Please enter some text to generate art from.', 'error');
      userTextArea.focus();
      return;
    }

    // Check executeCoreLogic exists
    if (typeof window.executeCoreLogic !== 'function') {
      showToast('Core generation logic is not loaded yet. Please wait.', 'warning');
      return;
    }

    _lastCroppedSrc = cropper.getCroppedCanvas().toDataURL();
    _lastUserText   = userText;

    await runGeneration(_lastCroppedSrc, _lastUserText);
  });

  // ── Download PDF button ──────────────────────────────────
  // The Adsterra popunder script (already in index.html) fires
  // automatically when the user clicks this button.
  downloadPdfBtn.addEventListener('click', async () => {
    if (downloadPdfBtn.disabled) return;

    // Step 1: disable and show 3-second countdown text
    downloadPdfBtn.disabled    = true;
    downloadPdfBtn.textContent = 'Preparing file (3s)...';

    // Step 2: wait 3 seconds (ad impression window)
    await new Promise(res => setTimeout(res, 3000));

    // Step 3: trigger download from the stored blob URL
    if (window._pdfBlobUrl) {
      const a    = document.createElement('a');
      a.href     = window._pdfBlobUrl;
      a.download = 'Portrait.pdf';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showToast('PDF not ready. Please try again.', 'error');
      downloadPdfBtn.disabled    = false;
      downloadPdfBtn.textContent = '⬇ Download PDF';
      return;
    }

    // Step 4: update button text to allow re-download
    downloadPdfBtn.disabled    = false;
    downloadPdfBtn.textContent = '✓ Download Again';
  });

  // ── Start Over button ──────────────────────────────────────
  startOverBtn.addEventListener('click', () => {
    if (cropper) { cropper.destroy(); cropper = null; }
    cropImage.src = '';
    imgChip.classList.remove('visible');
    cropperSection.classList.remove('visible');
    uploadZone.style.display = '';
    userTextArea.value = '';
    updateCharCount();
    _lastCroppedSrc = null;
    _lastUserText   = null;
    // Free the stored PDF blob
    if (window._pdfBlobUrl) {
      URL.revokeObjectURL(window._pdfBlobUrl);
      window._pdfBlobUrl = null;
    }
    resetToForm();
    showToast('Ready for a new portrait!', 'info', 2500);
  });

})();

