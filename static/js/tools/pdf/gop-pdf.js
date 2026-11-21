/* =========================================================
   CÔNG CỤ GỘP PDF - GOP-PDF.JS
   Logic chuyên biệt: Quản lý danh sách nhiều file, sắp xếp thứ tự và nối ghép
   ========================================================= */

let selectedPdfFiles = [];
let currentDownloadUrl = null;
let currentDownloadName = null;

function initGopPdfTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length) {
        addFilesToList(Array.from(this.files));
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
        addFilesToList(Array.from(e.dataTransfer.files));
      }
    });
  }
}

function addFilesToList(files) {
  const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
  if (!pdfFiles.length) {
    alert('Vui lòng chọn các tệp định dạng PDF.');
    return;
  }

  selectedPdfFiles = selectedPdfFiles.concat(pdfFiles);
  renderFileList();

  // Hiển thị tooltip 10s rồi tự động ẩn dòng chữ giống nen-pdf
  const tooltip = document.getElementById('floatingAddTooltip');
  if (tooltip) {
    tooltip.classList.remove('fade-out');
    clearTimeout(window._floatingTooltipTimer);
    window._floatingTooltipTimer = setTimeout(function() {
      tooltip.classList.add('fade-out');
    }, 10000);
  }

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

function renderFileList() {
  const container = document.getElementById('fileCardWrap');
  const badgeEl = document.getElementById('floatingBadge');
  if (badgeEl) badgeEl.textContent = selectedPdfFiles.length;

  if (selectedPdfFiles.length === 0) {
    resetMergeSelection();
    return;
  }

  if (!container) return;

  let html = '';
  selectedPdfFiles.forEach((file, index) => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    html += `
      <div class="file-card" id="fileCard_${index}" draggable="true" data-rotation="0">
        <!-- Số thứ tự file -->
        <div class="file-card-order">${index + 1}</div>

        <!-- Nút xóa file (X đỏ góc trên phải) -->
        <button type="button" class="btn-remove-file" onclick="removeFileFromCard(this)" title="Xóa file">
          <i class="fas fa-times"></i>
        </button>

        <!-- Tùy chọn khi hover: Xoay 90 độ & Phóng to (Zoom) giống nen-pdf -->
        <div class="file-card-actions">
          <button type="button" class="btn-card-action" onclick="rotatePdfCardByBtn(this, 90)" title="Xoay 90 độ">
            <i class="fas fa-redo"></i>
          </button>
          <button type="button" class="btn-card-action" onclick="zoomPdfCardByBtn(this)" title="Phóng to xem trước">
            <i class="fas fa-search-plus"></i>
          </button>
        </div>

        <div class="file-preview" id="filePreview_${index}">
          <div class="paper-mockup" style="position:relative; display:flex; flex-direction:column;">
            <div style="position:absolute; bottom:8px; right:8px; font-size:1.8rem; color:#e74c3c; opacity:0.3;"><i class="fas fa-file-pdf"></i></div>
            <div class="line title"></div>
            <div class="line"></div>
            <div class="line short"></div>
            <div class="line"></div>
            <div class="line block"></div>
            <div class="line"></div>
            <div class="line short"></div>
          </div>
        </div>

        <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
        <div class="file-meta" style="font-size:0.75rem; color:#888; margin-top:2px;">${sizeMb} MB</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Render thumbnail trang đầu cho từng file thông qua pdf-preview.js
  selectedPdfFiles.forEach((file, index) => {
    if (typeof renderPdfFirstPageThumbnail === 'function') {
      renderPdfFirstPageThumbnail(file, 'filePreview_' + index);
    }
  });

  // Khởi tạo tính năng kéo thả sắp xếp thứ tự thẻ (Drag & Drop Reorder)
  if (window.DragReorder && typeof window.DragReorder.init === 'function') {
    window.DragReorder.init({
      container: '#fileCardWrap',
      itemSelector: '.file-card',
      updateBadgeOrders: true,
      onReorder: function(oldIndex, newIndex) {
        if (oldIndex === newIndex) return;
        // Đổi vị trí phần tử trong mảng selectedPdfFiles đồng bộ với DOM
        const movedItem = selectedPdfFiles.splice(oldIndex, 1)[0];
        selectedPdfFiles.splice(newIndex, 0, movedItem);
      }
    });
  }
}

function getCardIndex(el) {
  const card = el.closest('.file-card');
  const container = document.getElementById('fileCardWrap');
  if (!card || !container) return -1;
  return Array.from(container.querySelectorAll('.file-card')).indexOf(card);
}

function removeFileFromCard(btn) {
  const index = getCardIndex(btn);
  if (index !== -1) {
    selectedPdfFiles.splice(index, 1);
    renderFileList();
  }
}

function rotatePdfCardByBtn(btn, degrees = 90) {
  const card = btn.closest('.file-card');
  if (!card) return;

  const currentRot = parseInt(card.dataset.rotation || '0', 10);
  const newRot = (currentRot + degrees) % 360;
  card.dataset.rotation = newRot;

  // Xoay trực tiếp phần tử thumbnail nằm ngay trong card này
  const targetEl = card.querySelector('.file-preview canvas') ||
                   card.querySelector('.file-preview img') ||
                   card.querySelector('.file-preview .paper-mockup');
  if (targetEl) {
    targetEl.style.transition = 'transform 0.3s ease';
    targetEl.style.transform = `rotate(${newRot}deg)`;
  }
}

function zoomPdfCardByBtn(btn) {
  const card = btn.closest('.file-card');
  if (!card) return;
  const index = getCardIndex(btn);
  if (index === -1) return;
  const file = selectedPdfFiles[index];
  if (!file) return;

  const rot = parseInt(card.dataset.rotation || '0', 10);
  openPdfFileZoom(file, rot);
}

function openPdfFileZoom(file, rotation) {
  if (typeof ensurePdfZoomModal === 'function') {
    ensurePdfZoomModal();
  } else if (!document.getElementById('pdfZoomModal')) {
    const modalHtml = `
      <div class="pdf-lightbox-overlay" id="pdfZoomModal" onclick="closePdfZoomModal(event)">
        <div class="pdf-lightbox-wrapper" onclick="event.stopPropagation()">
          <button type="button" class="pdf-lightbox-close" onclick="closePdfZoomModal()" title="Đóng">
            <i class="fas fa-times"></i>
          </button>
          <div id="zoomModalContent" class="pdf-lightbox-content"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  const modal = document.getElementById('pdfZoomModal');
  const content = document.getElementById('zoomModalContent');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; padding: 40px; color:#fff;">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-right:12px;"></i> Đang tải trang rõ nét...
    </div>
  `;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  const rot = rotation || 0;

  if (typeof pdfjsLib !== 'undefined') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
        return pdf.getPage(1);
      }).then(function(page) {
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetHeight = Math.min(window.innerHeight * 0.88, 1400);
        const scale = targetHeight / unscaledViewport.height;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.transform = `rotate(${rot}deg)`;
        canvas.style.transition = 'transform 0.3s ease';

        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        };

        page.render(renderContext).promise.then(function() {
          content.innerHTML = '';
          content.appendChild(canvas);
        }).catch(function() {
          content.innerHTML = `<div style="color:#fff; padding:20px; font-size:1.1rem;"><i class="fas fa-file-pdf" style="font-size:2rem; margin-bottom:8px; display:block;"></i>${escapeHtml(file.name)}</div>`;
        });
      }).catch(function() {
        content.innerHTML = `<div style="color:#fff; padding:20px; font-size:1.1rem;"><i class="fas fa-file-pdf" style="font-size:2rem; margin-bottom:8px; display:block;"></i>${escapeHtml(file.name)}</div>`;
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    content.innerHTML = `<div style="color:#fff; padding:20px; font-size:1.1rem;"><i class="fas fa-file-pdf" style="font-size:2rem; margin-bottom:8px; display:block;"></i>${escapeHtml(file.name)}</div>`;
  }
}

function startMergePdf() {
  if (selectedPdfFiles.length < 2) {
    alert('Vui lòng chọn ít nhất 2 file PDF để thực hiện ghép nối.');
    return;
  }

  const btn = document.getElementById('btnMerge');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gộp các trang PDF...';

  const nameInput = document.getElementById('outputFileName');
  let filename = nameInput ? nameInput.value.trim() : 'tailieu_da_gop.pdf';
  if (!filename) filename = 'tailieu_da_gop.pdf';
  if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

  // Chuẩn bị FormData theo đúng thứ tự mảng selectedPdfFiles đã được sắp xếp và góc xoay từ thẻ DOM
  const formData = new FormData();
  const rotations = [];
  const container = document.getElementById('fileCardWrap');
  const cards = container ? Array.from(container.querySelectorAll('.file-card')) : [];

  selectedPdfFiles.forEach((file, index) => {
    formData.append('files', file);
    const card = cards[index];
    const rot = card ? parseInt(card.dataset.rotation || '0', 10) : 0;
    rotations.push(rot);
  });

  formData.append('rotations', JSON.stringify(rotations));
  formData.append('output_name', filename);

  // Gửi request lên Backend Flask
  const uploadPromise = (window.UserFiles && typeof window.UserFiles.uploadAndProcess === 'function')
    ? window.UserFiles.uploadAndProcess('/pdf/api/gop-pdf', formData)
    : fetch('/pdf/api/gop-pdf', { method: 'POST', body: formData, credentials: 'same-origin' });

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

        // Cập nhật thông tin kết quả thực tế từ Backend
        const downloadSuccessTitle = document.getElementById('downloadSuccessTitle');
        const downloadMeta = document.getElementById('downloadMeta');

        if (downloadSuccessTitle) {
          downloadSuccessTitle.textContent = 'Đã gộp các file PDF thành công!';
        }
        if (downloadMeta) {
          downloadMeta.innerHTML = `Đã kết hợp <strong>${data.total_files} file PDF</strong> thành 1 tài liệu gồm <strong>${data.total_pages} trang</strong> (dung lượng: <strong>${data.merged_size_formatted}</strong>).`;
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

        // Chuyển sang màn hình tải kết quả
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
        const errMsg = (result.data && result.data.message) ? result.data.message : 'Có lỗi xảy ra trong quá trình gộp các file PDF.';
        alert(errMsg);
      }
    })
    .catch(function(err) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      console.error('Lỗi khi gọi API gộp PDF:', err);
      alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    });
}

function downloadMergedFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    a.download = currentDownloadName || 'tailieu_da_gop.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy liên kết tải về. Vui lòng thực hiện ghép nối lại.');
  }
}

function resetMergeSelection() {
  selectedPdfFiles = [];
  window._currentZoomIndex = null;
  currentDownloadUrl = null;
  currentDownloadName = null;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const tooltip = document.getElementById('floatingAddTooltip');
  if (tooltip) {
    tooltip.classList.remove('fade-out');
    clearTimeout(window._floatingTooltipTimer);
  }

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');

  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');
  if (toolHero) toolHero.classList.remove('sr-only');
  if (toolContainer) toolContainer.classList.remove('aligned-left');
  if (uploadPanel) uploadPanel.style.display = '';
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (downloadCard) downloadCard.classList.remove('show');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toggleFaqItem(header) {
  const item = header.parentElement;
  if (item) item.classList.toggle('open');
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGopPdfTool);
} else {
  initGopPdfTool();
}
