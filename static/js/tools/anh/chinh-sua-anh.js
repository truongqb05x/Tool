/* =========================================================
   CÔNG CỤ TRÌNH CHỈNH SỬA ẢNH - CHINH-SUA-ANH.JS
   Logic chuyên biệt: Bộ lọc màu nghệ thuật, thanh trượt ánh sáng
   ========================================================= */

currentToolSlug = 'chinh-sua-anh';
let currentFilterPreset = 'normal';
let currentBrightness = 100;
let currentContrast = 100;
let currentSaturation = 100;

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
  const num = parseInt(val) || 100;

  if (type === 'brightness') {
    currentBrightness = num;
    const el = document.getElementById('valBrightness');
    if (el) el.textContent = num + '%';
  } else if (type === 'contrast') {
    currentContrast = num;
    const el = document.getElementById('valContrast');
    if (el) el.textContent = num + '%';
  } else if (type === 'saturate') {
    currentSaturation = num;
    const el = document.getElementById('valSaturation');
    if (el) el.textContent = num + '%';
  }

  if (img) {
    img.style.filter = `brightness(${currentBrightness}%) contrast(${currentContrast}%) saturate(${currentSaturation}%)`;
  }
}

function onResetToolSelection() {
  currentFilterPreset = 'normal';
  currentBrightness = 100;
  currentContrast = 100;
  currentSaturation = 100;
  const img = document.getElementById('imagePreview');
  if (img) img.style.filter = 'none';
  const sb = document.getElementById('sliderBrightness');
  const sc = document.getElementById('sliderContrast');
  const ss = document.getElementById('sliderSaturation');
  if (sb) sb.value = 100;
  if (sc) sc.value = 100;
  if (ss) ss.value = 100;
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để chỉnh sửa.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);

  // Map preset tên sang filter backend hỗ trợ (normal, grayscale, sepia, vintage, warm, cool, invert)
  let backendFilter = currentFilterPreset;
  if (backendFilter === 'bw') backendFilter = 'grayscale';
  formData.append('filter', backendFilter);

  // Chuyển đổi từ scale 100 sang scale float 1.0
  formData.append('brightness', (currentBrightness / 100).toFixed(2));
  formData.append('contrast', (currentContrast / 100).toFixed(2));
  formData.append('saturation', (currentSaturation / 100).toFixed(2));

  sendImageApi('/anh/api/chinh-sua-anh', formData, {
    successTitle: 'Đã chỉnh sửa hình ảnh thành công!',
    buildMeta: function(d) {
      return `File xuất: <strong>${d.download_name}</strong> — Bộ lọc: <strong>${currentFilterPreset}</strong>.`;
    }
  });
}
