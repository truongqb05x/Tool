/* =========================================================
   IMAGE TOOL COMMON UTILITIES - IMAGE-PREVIEW.JS
   Gom các hàm dùng chung: Quản lý file ảnh, kéo thả,
   xem trước, xoay ảnh, Lightbox Zoom Modal, Radio, FAQ,
   chuyển đổi Workspace, gọi API Backend và Download kết quả.
   Đồng bộ kiến trúc với static/js/ultis/pdf/pdf-preview.js
   ========================================================= */

let currentImageFile = null;
let currentImageDataUrl = '';
let currentPreviewRotation = 0;
let currentToolSlug = 'image';
let currentDownloadUrl = null;
let currentDownloadName = null;

document.addEventListener('DOMContentLoaded', function() {
  initImageDropZone();
});

function initImageDropZone() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files && dt.files[0]) {
      processSelectedFile(dt.files[0]);
    }
  });
}

function handleFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  processSelectedFile(file);
}

function processSelectedFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn tệp định dạng hình ảnh hợp lệ (JPG, PNG, WEBP, GIF, SVG).');
    return;
  }

  currentImageFile = file;
  currentPreviewRotation = 0;
  currentDownloadUrl = null;
  currentDownloadName = null;

  const fileNameEl = document.getElementById('selectedFileName');
  if (fileNameEl) fileNameEl.textContent = file.name;

  const sizeKB = (file.size / 1024).toFixed(1);
  const metaEl = document.getElementById('selectedFileMeta');
  if (metaEl) metaEl.textContent = `Dung lượng: ${sizeKB} KB`;

  const reader = new FileReader();
  reader.onload = function(evt) {
    currentImageDataUrl = evt.target.result;
    const img = document.getElementById('imagePreview');
    if (img) {
      img.src = currentImageDataUrl;
      img.style.transform = 'rotate(0deg)';
      img.onload = function() {
        if (metaEl) {
          metaEl.textContent = `Kích thước: ${this.naturalWidth} x ${this.naturalHeight} px — Dung lượng: ${sizeKB} KB`;
        }
        if (typeof onImageLoaded === 'function') {
          onImageLoaded(this);
        }
      };
    }

    // Ẩn hero nhưng vẫn giữ nguyên SEO bằng class sr-only (chuẩn nen-pdf.html)
    const toolHero = document.getElementById('toolHero') || document.querySelector('.tool-hero');
    if (toolHero) toolHero.classList.add('sr-only');

    // Phóng to toàn bề ngang các khối bên dưới đồng bộ với workspace
    const toolContainer = document.getElementById('toolContainer') || document.querySelector('.tool-container');
    if (toolContainer) toolContainer.classList.add('aligned-left');

    // Chuyển từ panel upload sang workspace
    const uploadPanel = document.getElementById('uploadPanel');
    const downloadCard = document.getElementById('downloadCard');
    const ws = document.getElementById('toolWorkspace');

    if (uploadPanel) uploadPanel.style.display = 'none';
    if (downloadCard) {
      downloadCard.classList.remove('show');
      downloadCard.style.display = 'none';
    }
    if (ws) {
      ws.classList.add('active');
      ws.style.display = 'flex';
      ws.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  reader.readAsDataURL(file);
}

function rotatePreview(deg) {
  currentPreviewRotation = (currentPreviewRotation + deg) % 360;
  const img = document.getElementById('imagePreview');
  if (img) img.style.transform = `rotate(${currentPreviewRotation}deg)`;

  const modalImg = document.querySelector('#zoomModalContent img');
  if (modalImg) modalImg.style.transform = `rotate(${currentPreviewRotation}deg)`;
}

// Modal phóng to (Lightbox Zoom) chuẩn theo phong cách nen-pdf.html
function ensureImageZoomModal() {
  if (document.getElementById('imageZoomModal')) return;

  const modalHtml = `
    <div class="pdf-lightbox-overlay" id="imageZoomModal" onclick="closeImageZoomModal(event)">
      <div class="pdf-lightbox-wrapper" onclick="event.stopPropagation()">
        <button type="button" class="pdf-lightbox-close" onclick="closeImageZoomModal()" title="Đóng (Esc)">
          <i class="fas fa-times"></i>
        </button>
        <div id="zoomModalContent" class="pdf-lightbox-content"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openImageZoomModal() {
  if (!currentImageDataUrl) return;
  ensureImageZoomModal();

  const modal = document.getElementById('imageZoomModal');
  const content = document.getElementById('zoomModalContent');
  if (!modal || !content) return;

  content.innerHTML = '';
  const zoomImg = document.createElement('img');
  zoomImg.src = currentImageDataUrl;
  zoomImg.alt = 'Phóng to xem trước hình ảnh';
  zoomImg.style.transform = `rotate(${currentPreviewRotation}deg)`;
  zoomImg.style.transition = 'transform 0.3s ease';
  content.appendChild(zoomImg);

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeImageZoomModal(e) {
  const modal = document.getElementById('imageZoomModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeImageZoomModal();
  }
});

const openImageModal = openImageZoomModal;
const openPdfZoomModal = openImageZoomModal;

function selectRadio(el) {
  const parent = el.closest('.ws-option-group');
  if (parent) {
    parent.querySelectorAll('.ws-radio-box').forEach(b => b.classList.remove('selected'));
  }
  el.classList.add('selected');
  const radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

function toggleFaqItem(el) {
  const parent = el.closest('.tool-faq-item');
  if (parent) parent.classList.toggle('active');
}

/**
 * Gửi yêu cầu xử lý hình ảnh tới API backend thực tế
 */
function sendImageApi(endpoint, formData, options = {}) {
  const btn = document.getElementById('btnExecuteAction');
  const originalHtml = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý hình ảnh...';
  }

  const uploadPromise = (window.UserFiles && typeof window.UserFiles.uploadAndProcess === 'function')
    ? window.UserFiles.uploadAndProcess(endpoint, formData)
    : fetch(endpoint, { method: 'POST', body: formData, credentials: 'same-origin' });

  uploadPromise
    .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
    .then(result => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }

      if (result.ok && result.data && (result.data.status === 'success' || result.data.success)) {
        const root = result.data;
        const d = root.data || root;
        currentDownloadUrl = root.download_url || d.download_url;
        currentDownloadName = root.download_name || d.download_name || 'image_processed.jpg';

        // Cập nhật thông số kết quả
        const titleEl = document.getElementById('downloadSuccessTitle');
        const metaEl = document.getElementById('downloadMeta');

        if (options.successTitle && titleEl) {
          titleEl.textContent = options.successTitle;
        } else if (titleEl) {
          titleEl.textContent = 'Hình ảnh của bạn đã được xử lý thành công!';
        }

        if (options.buildMeta && metaEl) {
          metaEl.innerHTML = options.buildMeta(d, root);
        } else if (metaEl) {
          if (d.saved_percent !== undefined && d.orig_size_formatted && d.result_size_formatted) {
            metaEl.innerHTML = `Dung lượng đã giảm từ <strong>${d.orig_size_formatted}</strong> xuống còn <strong>${d.result_size_formatted}</strong> (tiết kiệm <strong>${d.saved_percent}%</strong>).`;
          } else if (d.saved_percent !== undefined && d.original_size_formatted && d.compressed_size_formatted) {
            metaEl.innerHTML = `Dung lượng đã giảm từ <strong>${d.original_size_formatted}</strong> xuống còn <strong>${d.compressed_size_formatted}</strong> (tiết kiệm <strong>${d.saved_percent}%</strong>).`;
          } else if (d.result_size_formatted || d.file_size_formatted) {
            metaEl.innerHTML = `Kích thước tệp xuất ra: <strong>${d.result_size_formatted || d.file_size_formatted}</strong>.`;
          }
        }

        // Cập nhật thông báo lưu tài khoản
        const saveNotice = document.getElementById('saveAccountNotice');
        if (saveNotice) {
          const isSaved = root.saved_to_account || d.saved_in_account;
          if (isSaved) {
            saveNotice.className = 'save-account-notice saved';
            saveNotice.innerHTML = '<i class="fas fa-check-circle"></i> File đã được tự động lưu vào <a href="/">File của bạn</a> trong tài khoản.';
            saveNotice.style.display = 'flex';
          } else {
            saveNotice.className = 'save-account-notice guest';
            saveNotice.innerHTML = '<i class="fas fa-info-circle"></i> <a href="#" onclick="openModal(\'login\'); return false;">Đăng nhập</a> để tự động lưu trữ và quản lý file của bạn lâu dài.';
            saveNotice.style.display = 'flex';
          }
        }

        // Chuyển sang màn hình kết quả tải xuống
        const ws = document.getElementById('toolWorkspace');
        const dl = document.getElementById('downloadCard');
        const toolContainer = document.getElementById('toolContainer') || document.querySelector('.tool-container');

        if (toolContainer) toolContainer.classList.add('aligned-left');
        if (ws) {
          ws.classList.remove('active');
          ws.style.display = 'none';
        }
        if (dl) {
          dl.classList.add('show');
          dl.style.display = 'block';
          dl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (typeof options.onSuccess === 'function') {
          options.onSuccess(d);
        }
      } else {
        const msg = (result.data && result.data.message) ? result.data.message : 'Có lỗi xảy ra khi xử lý ảnh.';
        alert(msg);
      }
    })
    .catch(err => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
      console.error('Lỗi khi gọi API xử lý ảnh:', err);
      alert('Không thể kết nối với máy chủ để xử lý ảnh. Vui lòng thử lại sau.');
    });
}

function downloadResultImage(customSuffix) {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    a.download = currentDownloadName || 'anh_da_xu_ly.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback nếu không có downloadUrl
  if (!currentImageDataUrl) return;
  const a = document.createElement('a');
  a.href = currentImageDataUrl;
  const originalName = currentImageFile ? currentImageFile.name : 'anh.jpg';
  const dotIdx = originalName.lastIndexOf('.');
  const base = dotIdx !== -1 ? originalName.substring(0, dotIdx) : 'anh';
  const ext = dotIdx !== -1 ? originalName.substring(dotIdx) : '.jpg';
  const suffix = customSuffix || currentToolSlug || 'processed';
  a.download = `${base}_${suffix}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function resetFileSelection() {
  currentImageFile = null;
  currentImageDataUrl = '';
  currentPreviewRotation = 0;
  currentDownloadUrl = null;
  currentDownloadName = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const toolHero = document.getElementById('toolHero') || document.querySelector('.tool-hero');
  if (toolHero) toolHero.classList.remove('sr-only');

  const toolContainer = document.getElementById('toolContainer') || document.querySelector('.tool-container');
  if (toolContainer) toolContainer.classList.remove('aligned-left');

  const ws = document.getElementById('toolWorkspace');
  if (ws) {
    ws.classList.remove('active');
    ws.style.display = 'none';
  }
  const dl = document.getElementById('downloadCard');
  if (dl) {
    dl.classList.remove('show');
    dl.style.display = 'none';
  }
  const uploadPanel = document.getElementById('uploadPanel');
  if (uploadPanel) uploadPanel.style.display = 'block';

  const img = document.getElementById('imagePreview');
  if (img) {
    img.src = '';
    img.style.transform = '';
  }

  if (typeof onResetToolSelection === 'function') {
    onResetToolSelection();
  }
}
