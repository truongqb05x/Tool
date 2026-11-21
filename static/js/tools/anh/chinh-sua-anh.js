/* =========================================================
   CÔNG CỤ TRÌNH CHỈNH SỬA ẢNH - CHINH-SUA-ANH.JS
   Logic chuyên biệt: Bộ lọc màu nghệ thuật, thanh trượt ánh sáng
   ========================================================= */

currentToolSlug = 'chinh-sua-anh';
let currentFilterPreset = 'normal';

function applyFilterPreset(btn, preset) {
  currentFilterPreset = preset;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const img = document.getElementById('imagePreview');
  if (!img) return;
  if (preset === 'bw') img.style.filter = 'grayscale(100%)';
  else if (preset === 'vintage') img.style.filter = 'sepia(60%) contrast(110%)';
  else if (preset === 'vibrant') img.style.filter = 'saturate(150%) contrast(110%)';
  else if (preset === 'warm') img.style.filter = 'sepia(30%) saturate(120%)';
  else if (preset === 'cool') img.style.filter = 'hue-rotate(180deg) saturate(90%)';
  else img.style.filter = 'none';
}

function updatePhotoAdjust(type, val) {
  const img = document.getElementById('imagePreview');
  if (!img) return;
  if (type === 'brightness') {
    const el = document.getElementById('valBrightness');
    if (el) el.textContent = val + '%';
    img.style.filter = `brightness(${val}%)`;
  } else if (type === 'contrast') {
    const el = document.getElementById('valContrast');
    if (el) el.textContent = val + '%';
    img.style.filter = `contrast(${val}%)`;
  } else if (type === 'saturate') {
    const el = document.getElementById('valSaturation');
    if (el) el.textContent = val + '%';
    img.style.filter = `saturate(${val}%)`;
  }
}

function onResetToolSelection() {
  const img = document.getElementById('imagePreview');
  if (img) img.style.filter = 'none';
}
