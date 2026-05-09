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

    // Loading state
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    const btnText = generateBtn.querySelector('.btn-text');
    const origText = btnText.textContent;
    btnText.textContent = 'Generating…';

    try {
      const croppedImageSrc = cropper.getCroppedCanvas().toDataURL();
      await window.executeCoreLogic(croppedImageSrc, userText);
      showToast('Art generated successfully! 🎨', 'success', 4000);
    } catch (err) {
      console.error('[Portrait Gen] executeCoreLogic threw:', err);
      showToast('Something went wrong during generation. Check the console.', 'error');
    } finally {
      generateBtn.disabled  = false;
      generateBtn.classList.remove('loading');
      btnText.textContent = origText;
    }
  });

})();
