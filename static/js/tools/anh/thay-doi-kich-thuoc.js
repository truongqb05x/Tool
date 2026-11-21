/* =========================================================
   CÔNG CỤ THAY ĐỔI KÍCH THƯỚC ẢNH - THAY-DOI-KICH-THUOC.JS
   Logic chuyên biệt: Nhập pixel width/height, tỉ lệ khung hình, preset
   ========================================================= */

currentToolSlug = 'thay-doi-kich-thuoc';
let originalImgWidth = 0;
let originalImgHeight = 0;
let originalAspectRatio = 1;

function onImageLoaded(img) {
  originalImgWidth = img.naturalWidth || 1200;
  originalImgHeight = img.naturalHeight || 800;
  originalAspectRatio = originalImgWidth / originalImgHeight;

  const elW = document.getElementById('resizeWidth');
  const elH = document.getElementById('resizeHeight');
  if (elW && elH) {
    elW.value = originalImgWidth;
    elH.value = originalImgHeight;
  }
  setupAspectListeners();
}

function setupAspectListeners() {
  const elW = document.getElementById('resizeWidth');
  const elH = document.getElementById('resizeHeight');
  const lock = document.getElementById('lockAspect');

  if (elW && !elW._hasAspectEvent) {
    elW._hasAspectEvent = true;
    elW.addEventListener('input', function() {
      if (lock && lock.checked && originalAspectRatio > 0) {
        const val = parseInt(this.value) || 0;
        if (val > 0 && elH) {
          elH.value = Math.round(val / originalAspectRatio);
        }
      }
    });
  }

  if (elH && !elH._hasAspectEvent) {
    elH._hasAspectEvent = true;
    elH.addEventListener('input', function() {
      if (lock && lock.checked && originalAspectRatio > 0) {
        const val = parseInt(this.value) || 0;
        if (val > 0 && elW) {
          elW.value = Math.round(val * originalAspectRatio);
        }
      }
    });
  }
}

function setPresetSize(w, h) {
  const elW = document.getElementById('resizeWidth');
  const elH = document.getElementById('resizeHeight');
  if (elW) elW.value = w;
  if (elH) elH.value = h;
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để thay đổi kích thước.');
    return;
  }

  const elW = document.getElementById('resizeWidth');
  const elH = document.getElementById('resizeHeight');
  const lock = document.getElementById('lockAspect');

  const width = elW ? (parseInt(elW.value) || 0) : 0;
  const height = elH ? (parseInt(elH.value) || 0) : 0;

  if (width <= 0 && height <= 0) {
    alert('Vui lòng nhập chiều rộng hoặc chiều cao hợp lệ (lớn hơn 0).');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('mode', 'pixel');
  formData.append('width', width);
  formData.append('height', height);
  formData.append('maintain_ratio', (lock && lock.checked) ? 'true' : 'false');

  sendImageApi('/anh/api/thay-doi-kich-thuoc', formData, {
    successTitle: 'Đã thay đổi kích thước ảnh thành công!',
    buildMeta: function(d) {
      return `Kích thước mới: <strong>${d.new_width} x ${d.new_height} px</strong> — Dung lượng file: <strong>${d.file_size_formatted || ''}</strong>.`;
    }
  });
}
