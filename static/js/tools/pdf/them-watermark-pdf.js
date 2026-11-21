/* =========================================================
   CÔNG CỤ PDF: THÊM WATERMARK PDF - THEM-WATERMARK-PDF.JS
   Hỗ trợ xem trước watermark trực quan thời gian thực,
   tùy chỉnh nội dung chữ, độ mờ trong suốt, góc xoay 45°/0° và màu sắc
   ========================================================= */

let currentSelectedFile = null;
let currentTotalPages = 1;
let currentRotation = 45;
let currentOpacity = 0.25;
let currentColorHex = '#888888';
let currentDownloadUrl = null;
let currentDownloadFilename = null;

document.addEventListener('DOMContentLoaded', function() {
  initTool();
});

function initTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        handleFileSelected(this.files[0]);
      }
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }
}

/**
 * Xử lý khi người dùng chọn file PDF
 */
function handleFileSelected(file) {
  if (!file) return;

  const fileNameLower = file.name.toLowerCase();
  if (!fileNameLower.endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Vui lòng chỉ chọn 1 tệp tài liệu định dạng PDF (.pdf).');
    return;
  }

  currentSelectedFile = file;
  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  const nameEl = document.getElementById('selectedFileName');
  const summaryNameEl = document.getElementById('summaryFileName');
  const sizeEl = document.getElementById('selectedFileSize');

  if (nameEl) nameEl.textContent = file.name;
  if (summaryNameEl) summaryNameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = 'Dung lượng: ' + displaySize;

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');
  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');

  if (toolHero) toolHero.classList.add('sr-only');
  if (toolContainer) toolContainer.classList.add('aligned-left');
  if (uploadPanel) uploadPanel.style.display = 'none';
  if (downloadCard) downloadCard.classList.remove('show');
  if (toolWorkspace) {
    toolWorkspace.classList.add('active');
    toolWorkspace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Render thumbnail trang đầu tiên
  if (typeof renderPdfFirstPageThumbnail === 'function') {
    renderPdfFirstPageThumbnail(file, 'filePreview');
  }

  // Đọc tổng số trang bằng PDF.js
  if (typeof pdfjsLib !== 'undefined') {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
        currentTotalPages = pdf.numPages;
        const totalEl = document.getElementById('totalPagesOrig');
        if (totalEl) totalEl.textContent = `${currentTotalPages} trang`;
        updateWatermarkPreview();
      }).catch(function() {
        currentTotalPages = 1;
        updateWatermarkPreview();
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    updateWatermarkPreview();
  }
}

/**
 * Cập nhật hiển thị watermark thời gian thực trên khung xem trước
 */
function updateWatermarkPreview() {
  const inputEl = document.getElementById('inputWatermarkText');
  const text = inputEl ? inputEl.value.trim() : 'BẢN QUYỀN';
  const displayText = text || 'BẢN QUYỀN';

  const summaryEl = document.getElementById('summaryWatermarkPreview');
  if (summaryEl) summaryEl.textContent = displayText;

  let overlay = document.getElementById('watermarkPreviewOverlay');
  const preview = document.getElementById('filePreview');

  if (!overlay && preview) {
    overlay = document.createElement('div');
    overlay.id = 'watermarkPreviewOverlay';
    overlay.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:1.5rem; font-weight:800; color:#888888; opacity:0.25; white-space:nowrap; pointer-events:none; text-transform:uppercase; z-index:10; transition:all 0.2s ease;';
    preview.appendChild(overlay);
  }

  if (overlay) {
    overlay.textContent = displayText;
    overlay.style.opacity = currentOpacity;
    overlay.style.color = currentColorHex;

    const rotDeg = currentRotation === 45 ? -45 : 0;
    overlay.style.transform = `translate(-50%, -50%) rotate(${rotDeg}deg)`;
  }
}

/**
 * Chọn nhanh thẻ gợi ý nội dung
 */
function applyWatermarkTag(tag) {
  const inputEl = document.getElementById('inputWatermarkText');
  if (inputEl) {
    inputEl.value = tag;
    updateWatermarkPreview();
  }
}

/**
 * Thay đổi góc xoay (45 độ hoặc 0 độ)
 */
function onWatermarkRotateChange(radio) {
  const optionBoxes = document.querySelectorAll('.ws-radio-box');
  optionBoxes.forEach(b => b.classList.remove('selected'));
  if (radio && radio.closest('.ws-radio-box')) {
    radio.closest('.ws-radio-box').classList.add('selected');
  }

  currentRotation = parseInt(radio.value, 10) || 45;
  updateWatermarkPreview();
}

/**
 * Thay đổi độ trong suốt (Opacity)
 */
function onOpacityChange(val) {
  const num = parseInt(val, 10) || 25;
  currentOpacity = num / 100.0;

  const display = document.getElementById('opacityDisplayVal');
  if (display) display.textContent = `${num}%`;

  updateWatermarkPreview();
}

/**
 * Chọn màu sắc chữ Watermark
 */
function selectColor(colorHex, btn) {
  currentColorHex = colorHex;

  const btns = document.querySelectorAll('.color-pick-btn');
  btns.forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = '#cbd5e1';
    b.style.background = '#fff';
  });

  if (btn) {
    btn.classList.add('active');
    btn.style.borderColor = '#1e5b9c';
    btn.style.background = '#f1f5f9';
  }

  updateWatermarkPreview();
}

/**
 * Gửi yêu cầu chèn Watermark lên API Backend
 */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp tài liệu PDF để thực hiện.');
    return;
  }

  const inputEl = document.getElementById('inputWatermarkText');
  const text = inputEl ? inputEl.value.trim() : 'BẢN QUYỀN';

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chèn Watermark...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('watermark_text', text);
  formData.append('rotation', currentRotation);
  formData.append('opacity', currentOpacity);
  formData.append('color_hex', currentColorHex);

  fetch('/pdf/api/them-watermark-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Chèn Watermark ngay <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' && data.data) {
      currentDownloadUrl = data.data.download_url;
      currentDownloadFilename = data.data.download_name;

      const metaEl = document.getElementById('downloadMeta');
      if (metaEl) {
        metaEl.innerHTML = `Đã đóng dấu bản quyền cho <strong>${data.data.total_pages} trang</strong>. Dung lượng hoàn tất: <strong>${data.data.result_size_formatted}</strong>.`;
      }

      const saveNotice = document.getElementById('saveAccountNotice');
      if (saveNotice) {
        if (data.data.saved_in_account) {
          saveNotice.style.display = 'block';
          saveNotice.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981; margin-right:6px;"></i> Tệp đã được tự động lưu vào danh sách tệp tài khoản của bạn!';
        } else {
          saveNotice.style.display = 'none';
        }
      }

      const toolWorkspace = document.getElementById('toolWorkspace');
      const downloadCard = document.getElementById('downloadCard');
      const toolContainer = document.getElementById('toolContainer');

      if (toolContainer) toolContainer.classList.add('aligned-left');
      if (toolWorkspace) toolWorkspace.classList.remove('active');
      if (downloadCard) {
        downloadCard.classList.add('show');
        downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      alert(data.message || 'Đã có lỗi xảy ra trong quá trình chèn watermark.');
    }
  })
  .catch(err => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Chèn Watermark ngay <i class="fas fa-arrow-right"></i>';
    }
    console.error('Lỗi API watermark:', err);
    alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  });
}

/**
 * Tải file kết quả về máy tính/thiết bị
 */
function downloadResultFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    if (currentDownloadFilename) a.download = currentDownloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy đường dẫn tải về. Vui lòng thử lại.');
  }
}

/**
 * Đặt lại trạng thái để chọn file khác
 */
function resetFileSelection() {
  currentSelectedFile = null;
  currentDownloadUrl = null;
  currentDownloadFilename = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const totalEl = document.getElementById('totalPagesOrig');
  if (totalEl) totalEl.textContent = '0 trang';

  const overlay = document.getElementById('watermarkPreviewOverlay');
  if (overlay) overlay.remove();

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');
  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');

  if (toolHero) toolHero.classList.remove('sr-only');
  if (toolContainer) toolContainer.classList.remove('aligned-left');
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (downloadCard) downloadCard.classList.remove('show');
  if (uploadPanel) {
    uploadPanel.style.display = 'block';
    uploadPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
