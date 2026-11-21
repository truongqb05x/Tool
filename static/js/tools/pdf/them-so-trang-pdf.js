/* =========================================================
   CÔNG CỤ PDF: THÊM SỐ TRANG PDF - THEM-SO-TRANG-PDF.JS
   Hỗ trợ xem trước trực quan, tùy chỉnh 6 vị trí hiển thị,
   đa dạng định dạng (1, 1/N, Trang 1/N), chọn trang bắt đầu và gửi API PyMuPDF
   ========================================================= */

let currentSelectedFile = null;
let currentTotalPages = 10; // Mặc định 10 cho mockup ban đầu
let currentPosition = 'bottom-center';
let currentFormatType = 'page_total';
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

  // Đọc tổng số trang bằng PDF.js để cập nhật giao diện
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
        updateBadgePreview();
      }).catch(function() {
        currentTotalPages = 1;
        updateBadgePreview();
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    updateBadgePreview();
  }
}

/**
 * Chọn vị trí chèn số trang trên trang giấy
 */
function selectPosition(pos) {
  currentPosition = pos;

  // Cập nhật trạng thái active cho các nút bấm trên lưới
  const btns = document.querySelectorAll('.ws-pos-btn');
  btns.forEach(btn => {
    if (btn.dataset.pos === pos) {
      btn.classList.add('active');
      btn.style.background = '#1e5b9c';
      btn.style.color = '#fff';
      btn.style.fontWeight = '700';
    } else {
      btn.classList.remove('active');
      btn.style.background = '#fff';
      btn.style.color = '#333';
      btn.style.fontWeight = 'normal';
    }
  });

  // Tên vị trí hiển thị
  const posNames = {
    'top-left': 'Trên - Bên trái',
    'top-center': 'Trên - Chính giữa',
    'top-right': 'Trên - Bên phải',
    'bottom-left': 'Dưới - Bên trái',
    'bottom-center': 'Dưới - Chính giữa',
    'bottom-right': 'Dưới - Bên phải'
  };

  const summaryPos = document.getElementById('summaryPositionText');
  if (summaryPos) summaryPos.textContent = posNames[pos] || 'Dưới - Chính giữa';

  updateBadgePreview();
}

/**
 * Khi người dùng thay đổi định dạng hiển thị
 */
function onFormatChange() {
  const select = document.getElementById('selectFormatType');
  if (select) {
    currentFormatType = select.value;
  }
  updateBadgePreview();
}

/**
 * Khi thay đổi trang bắt đầu hoặc số bắt đầu
 */
function onSettingsChange() {
  updateBadgePreview();
}

/**
 * Cập nhật vị trí và nội dung của badge xem trước trên thẻ file
 */
function updateBadgePreview() {
  let badge = document.getElementById('pageNumberPreviewBadge');
  const preview = document.getElementById('filePreview');

  if (!badge && preview) {
    badge = document.createElement('div');
    badge.id = 'pageNumberPreviewBadge';
    badge.style.cssText = 'position:absolute; background:#1e5b9c; color:#fff; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:3px; box-shadow:0 1px 4px rgba(0,0,0,0.3); pointer-events:none; transition:all 0.25s ease; z-index:10;';
    preview.appendChild(badge);
  }

  if (!badge) return;

  const startInput = document.getElementById('inputStartNumber');
  const startNum = startInput ? parseInt(startInput.value, 10) || 1 : 1;
  const total = currentTotalPages || 10;

  // Tính chuỗi mẫu
  let sampleText = `${startNum} / ${total}`;
  if (currentFormatType === 'page_only') {
    sampleText = `${startNum}`;
  } else if (currentFormatType === 'text_page_total') {
    sampleText = `Trang ${startNum} / ${total}`;
  } else if (currentFormatType === 'text_page_only') {
    sampleText = `Trang ${startNum}`;
  }

  badge.textContent = sampleText;

  const summaryFmt = document.getElementById('summaryFormatPreview');
  if (summaryFmt) summaryFmt.textContent = sampleText;

  // Đặt lại tọa độ CSS của badge theo vị trí được chọn
  badge.style.top = '';
  badge.style.bottom = '';
  badge.style.left = '';
  badge.style.right = '';
  badge.style.transform = '';

  if (currentPosition === 'bottom-center') {
    badge.style.bottom = '10px';
    badge.style.left = '50%';
    badge.style.transform = 'translateX(-50%)';
  } else if (currentPosition === 'bottom-right') {
    badge.style.bottom = '10px';
    badge.style.right = '12px';
  } else if (currentPosition === 'bottom-left') {
    badge.style.bottom = '10px';
    badge.style.left = '12px';
  } else if (currentPosition === 'top-center') {
    badge.style.top = '10px';
    badge.style.left = '50%';
    badge.style.transform = 'translateX(-50%)';
  } else if (currentPosition === 'top-right') {
    badge.style.top = '10px';
    badge.style.right = '12px';
  } else if (currentPosition === 'top-left') {
    badge.style.top = '10px';
    badge.style.left = '12px';
  }
}

/**
 * Gửi yêu cầu chèn số trang lên API Backend
 */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp tài liệu PDF để thực hiện.');
    return;
  }

  const fromPageInput = document.getElementById('inputFromPage');
  const startNumInput = document.getElementById('inputStartNumber');

  const fromPage = fromPageInput ? parseInt(fromPageInput.value, 10) || 1 : 1;
  const startNumber = startNumInput ? parseInt(startNumInput.value, 10) || 1 : 1;

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chèn số trang...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('position', currentPosition);
  formData.append('format_type', currentFormatType);
  formData.append('from_page', fromPage);
  formData.append('start_number', startNumber);

  fetch('/pdf/api/them-so-trang-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Đánh số trang ngay <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' && data.data) {
      currentDownloadUrl = data.data.download_url;
      currentDownloadFilename = data.data.download_name;

      const metaEl = document.getElementById('downloadMeta');
      if (metaEl) {
        metaEl.innerHTML = `Đã hoàn tất đánh số cho <strong>${data.data.total_pages} trang</strong>. Dung lượng hoàn tất: <strong>${data.data.result_size_formatted}</strong>.`;
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
      alert(data.message || 'Đã có lỗi xảy ra trong quá trình đánh số trang.');
    }
  })
  .catch(err => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Đánh số trang ngay <i class="fas fa-arrow-right"></i>';
    }
    console.error('Lỗi API đánh số trang:', err);
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

  const badge = document.getElementById('pageNumberPreviewBadge');
  if (badge) badge.remove();

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
