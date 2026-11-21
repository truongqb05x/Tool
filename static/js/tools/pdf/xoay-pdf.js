/* =========================================================
   CÔNG CỤ PDF: XOAY PDF - XOAY-PDF.JS
   Logic chuyên biệt: Xử lý 1 file PDF, xoay trái 90° / xoay phải 90°,
   xem trước trang đầu trực quan với PDF.js và gửi yêu cầu tới API
   ========================================================= */

let currentSelectedFile = null;
let currentRotationAngle = 0;
let currentDownloadUrl = null;
let currentDownloadName = null;

function initTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length) {
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
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }
}

function handleFileSelected(file) {
  // Ràng buộc chỉ nhận đúng 1 tệp định dạng PDF
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Vui lòng chọn tệp tài liệu định dạng PDF.');
    return;
  }

  currentSelectedFile = file;
  currentRotationAngle = 0;

  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  // Cập nhật thẻ xem trước file
  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = 'Dung lượng: ' + displaySize;

  // Render trang 1 thumbnail qua pdf-preview.js
  if (typeof renderPdfFirstPageThumbnail === 'function') {
    renderPdfFirstPageThumbnail(file, 'filePreview');
  }

  // Cập nhật góc xoay về 0°
  updateRotationDisplay();

  // Tooltip nổi tự ẩn sau 10s giống nen-pdf
  const tooltip = document.getElementById('floatingAddTooltip');
  if (tooltip) {
    tooltip.classList.remove('fade-out');
    clearTimeout(window._floatingTooltipTimer);
    window._floatingTooltipTimer = setTimeout(function() {
      tooltip.classList.add('fade-out');
    }, 10000);
  }

  // Chuyển sang màn hình workspace
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
}

/* =========================================================
   ĐIỀU HƯỚNG XOAY TRANG (XOAY TRÁI -90°, XOAY PHẢI +90°)
   ========================================================= */
function rotateFileDirection(delta) {
  currentRotationAngle = (currentRotationAngle + delta) % 360;
  if (currentRotationAngle < 0) {
    currentRotationAngle += 360;
  }
  updateRotationDisplay();
}

function resetRotation() {
  currentRotationAngle = 0;
  updateRotationDisplay();
}

function updateRotationDisplay() {
  // Đồng bộ biến góc xoay dùng chung cho pdf-preview.js
  if (typeof currentPreviewRotation !== 'undefined') {
    currentPreviewRotation = currentRotationAngle;
  }

  // Cập nhật thuộc tính data-rotation của file-card
  const fileCard = document.getElementById('fileCard');
  if (fileCard) {
    fileCard.dataset.rotation = currentRotationAngle;
  }

  // Xoay phần tử hình ảnh hoặc canvas trong khung xem trước
  const previewEl = document.getElementById('filePreview');
  if (previewEl) {
    const targetEl = previewEl.querySelector('canvas') ||
                     previewEl.querySelector('img') ||
                     previewEl.querySelector('.paper-mockup');
    if (targetEl) {
      targetEl.style.transition = 'transform 0.3s ease';
      targetEl.style.transform = `rotate(${currentRotationAngle}deg)`;
    }
  }

  // Cập nhật cả góc xoay trong Lightbox Zoom modal nếu đang mở
  const modalTarget = document.querySelector('#zoomModalContent canvas') || document.querySelector('#zoomModalContent img');
  if (modalTarget) {
    modalTarget.style.transition = 'transform 0.3s ease';
    modalTarget.style.transform = `rotate(${currentRotationAngle}deg)`;
  }

  // Cập nhật badge hiển thị góc xoay
  const badge = document.getElementById('rotateStatusBadge');
  if (badge) {
    badge.textContent = `${currentRotationAngle}°` + (currentRotationAngle === 0 ? ' (Gốc)' : '');
  }

  // Nút đặt lại về ban đầu
  const btnReset = document.getElementById('btnResetRotation');
  if (btnReset) {
    btnReset.style.display = currentRotationAngle !== 0 ? 'flex' : 'none';
  }
}

/* =========================================================
   THỰC THI XOAY VĨNH VIỄN VÀ GỬI LÊN BACKEND
   ========================================================= */
/* =========================================================
   ĐIỀU HƯỚNG XOAY TRANG (XOAY TRÁI -90°, XOAY PHẢI +90°)
   ========================================================= */
function rotateFileDirection(delta) {
  currentRotationAngle = (currentRotationAngle + delta) % 360;
  if (currentRotationAngle < 0) {
    currentRotationAngle += 360;
  }
  updateRotationDisplay();
}

function resetRotation() {
  currentRotationAngle = 0;
  updateRotationDisplay();
}

function updateRotationDisplay() {
  // Cập nhật thuộc tính data-rotation của file-card
  const fileCard = document.getElementById('fileCard');
  if (fileCard) {
    fileCard.dataset.rotation = currentRotationAngle;
  }

  // Xoay phần tử hình ảnh hoặc canvas trong khung xem trước
  const previewEl = document.getElementById('filePreview');
  if (previewEl) {
    const targetEl = previewEl.querySelector('canvas') ||
                     previewEl.querySelector('img') ||
                     previewEl.querySelector('.paper-mockup');
    if (targetEl) {
      targetEl.style.transition = 'transform 0.3s ease';
      targetEl.style.transform = `rotate(${currentRotationAngle}deg)`;
    }
  }

  // Cập nhật badge hiển thị góc xoay
  const badge = document.getElementById('rotateStatusBadge');
  if (badge) {
    badge.textContent = `${currentRotationAngle}°` + (currentRotationAngle === 0 ? ' (Gốc)' : '');
  }

  // Nút đặt lại về ban đầu
  const btnReset = document.getElementById('btnResetRotation');
  if (btnReset) {
    btnReset.style.display = currentRotationAngle !== 0 ? 'flex' : 'none';
  }
}

/* =========================================================
   THỰC THI XOAY VĨNH VIỄN VÀ GỬI LÊN BACKEND
   ========================================================= */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn một file PDF để xoay.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xoay tài liệu...';

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('angle', currentRotationAngle);

  const uploadPromise = (window.UserFiles && typeof window.UserFiles.uploadAndProcess === 'function')
    ? window.UserFiles.uploadAndProcess('/pdf/api/xoay-pdf', formData)
    : fetch('/pdf/api/xoay-pdf', { method: 'POST', body: formData, credentials: 'same-origin' });

  uploadPromise
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    })
    .then(function(result) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;

      if (result.ok && result.data.status === 'success') {
        const data = result.data.data;
        currentDownloadUrl = data.download_url;
        currentDownloadName = data.download_name;

        // Cập nhật thẻ kết quả
        const downloadSuccessTitle = document.getElementById('downloadSuccessTitle');
        const downloadMeta = document.getElementById('downloadMeta');

        if (downloadSuccessTitle) {
          downloadSuccessTitle.textContent = 'File PDF của bạn đã được xoay thành công!';
        }

        if (downloadMeta) {
          downloadMeta.innerHTML = `Tất cả các trang tài liệu đã được xoay <strong>${data.angle}°</strong> theo đúng chiều mong muốn (dung lượng: <strong>${data.result_size_formatted}</strong>).`;
        }

        // Thông báo lưu trữ tài khoản
        const saveNotice = document.getElementById('saveAccountNotice');
        if (saveNotice) {
          if (data.saved_in_account) {
            saveNotice.className = 'save-account-notice saved';
            saveNotice.innerHTML = '<i class="fas fa-check-circle"></i> File đã được tự động lưu vào <a href="/">File của bạn</a> trong tài khoản.';
            saveNotice.style.display = 'flex';
          } else {
            saveNotice.className = 'save-account-notice guest';
            saveNotice.innerHTML = '<i class="fas fa-info-circle"></i> <a href="#" onclick="openModal(\'login\'); return false;">Đăng nhập</a> để tự động lưu trữ và quản lý file của bạn lâu dài.';
            saveNotice.style.display = 'flex';
          }
        }

        // Chuyển màn hình sang kết quả
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
        const errMsg = (result.data && result.data.message) ? result.data.message : 'Có lỗi xảy ra khi xoay file PDF.';
        alert(errMsg);
      }
    })
    .catch(function(err) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      console.error('Lỗi API xoay PDF:', err);
      alert('Không thể kết nối đến máy chủ xử lý. Vui lòng thử lại sau.');
    });
}

function downloadResultFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    a.download = currentDownloadName || 'tailieu_da_xoay.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Chưa có file kết quả để tải về.');
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
  currentRotationAngle = 0;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const tooltip = document.getElementById('floatingAddTooltip');
  if (tooltip) {
    tooltip.classList.remove('fade-out');
    clearTimeout(window._floatingTooltipTimer);
  }

  if (typeof restoreDefaultMockup === 'function') {
    restoreDefaultMockup('filePreview');
  }

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');
  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');

  if (toolHero) toolHero.classList.remove('sr-only');
  if (toolContainer) toolContainer.classList.remove('aligned-left');
  if (downloadCard) downloadCard.classList.remove('show');
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (uploadPanel) uploadPanel.style.display = '';
}

function toggleFaqItem(header) {
  const item = header.parentElement;
  if (item) item.classList.toggle('open');
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTool);
} else {
  initTool();
}
