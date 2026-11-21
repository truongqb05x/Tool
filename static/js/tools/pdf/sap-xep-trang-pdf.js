/* =========================================================
   CÔNG CỤ PDF: SẮP XẾP TRANG PDF - SAP-XEP-TRANG-PDF.JS
   Hỗ trợ xem trước thumbnail tất cả các trang, kéo thả di chuyển vị trí,
   đảo ngược/khôi phục thứ tự, xoay trang và gửi thứ tự mới lên backend PyMuPDF
   ========================================================= */

let currentSelectedFile = null;
let currentPdfDoc = null;
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
  if (nameEl) {
    nameEl.textContent = file.name;
    nameEl.title = `${file.name} (${displaySize})`;
  }

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');
  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');
  const cardWrap = document.getElementById('fileCardWrap');

  if (toolHero) toolHero.classList.add('sr-only');
  if (toolContainer) toolContainer.classList.add('aligned-left');
  if (uploadPanel) uploadPanel.style.display = 'none';
  if (downloadCard) downloadCard.classList.remove('show');
  if (toolWorkspace) {
    toolWorkspace.classList.add('active');
    toolWorkspace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Hiển thị trạng thái đang đọc trang PDF
  if (cardWrap) {
    cardWrap.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px; width:100%; color:#1e5b9c;">
        <i class="fas fa-spinner fa-spin" style="font-size:2.4rem;"></i>
        <span style="font-size:0.95rem; font-weight:600; color:#333;">Đang tạo hình thu nhỏ từng trang tài liệu...</span>
      </div>
    `;
  }

  // Khởi tạo thư viện PDF.js nếu có
  if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const typedarray = new Uint8Array(e.target.result);

    if (typeof pdfjsLib === 'undefined') {
      renderFallbackCardList(file);
      return;
    }

    pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
      currentPdfDoc = pdf;
      const totalPages = pdf.numPages;

      const totalCountEl = document.getElementById('totalPagesCount');
      if (totalCountEl) totalCountEl.textContent = `${totalPages} trang`;

      if (cardWrap) cardWrap.innerHTML = '';

      // Duyệt qua từng trang để tạo khung thẻ
      for (let i = 1; i <= totalPages; i++) {
        const card = createPageCardElement(i);
        if (cardWrap) cardWrap.appendChild(card);
        renderPageThumbnail(pdf, i);
      }

      // Kích hoạt tính năng kéo thả sắp xếp
      initPageDragDrop();
      updateOrderSummary();

    }).catch(function(err) {
      console.error('Lỗi khi nạp PDF:', err);
      renderFallbackCardList(file);
    });
  };

  reader.onerror = function() {
    renderFallbackCardList(file);
  };

  reader.readAsArrayBuffer(file);
}

/**
 * Tạo DOM element cho thẻ trang PDF
 */
function createPageCardElement(pageNum) {
  const card = document.createElement('div');
  card.className = 'file-card';
  card.dataset.originalPage = pageNum;
  card.dataset.rotation = '0';
  card.setAttribute('draggable', 'true');

  card.innerHTML = `
    <div class="file-card-order">${pageNum}</div>
    <div class="file-card-actions">
      <button type="button" class="btn-card-action" onclick="rotatePageCard(this, 90)" title="Xoay trang 90°">
        <i class="fas fa-redo"></i>
      </button>
      <button type="button" class="btn-card-action" onclick="zoomPageCard(this)" title="Xem phóng to">
        <i class="fas fa-search-plus"></i>
      </button>
    </div>
    <div class="file-preview" id="pagePreview_${pageNum}" style="min-height:160px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
      <canvas id="pageCanvas_${pageNum}" style="max-width:100%; max-height:160px; border-radius:2px; box-shadow:0 1px 4px rgba(0,0,0,0.12); transition:transform 0.2s ease;"></canvas>
    </div>
    <div class="file-name" style="margin-top:6px; font-weight:600; font-size:0.82rem; color:#333;">Trang ${pageNum}</div>
  `;

  return card;
}

/**
 * Render thumbnail của 1 trang cụ thể vào canvas
 */
function renderPageThumbnail(pdf, pageNum) {
  pdf.getPage(pageNum).then(function(page) {
    const canvas = document.getElementById(`pageCanvas_${pageNum}`);
    if (!canvas) return;

    const unscaledViewport = page.getViewport({ scale: 1 });
    const targetHeight = 160;
    const scale = targetHeight / unscaledViewport.height;
    const viewport = page.getViewport({ scale: scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    page.render({
      canvasContext: ctx,
      viewport: viewport
    });
  }).catch(function(e) {
    console.warn(`Không thể render trang ${pageNum}:`, e);
  });
}

/**
 * Fallback khi không tải được PDF.js
 */
function renderFallbackCardList(file) {
  const cardWrap = document.getElementById('fileCardWrap');
  if (!cardWrap) return;

  cardWrap.innerHTML = `
    <div class="file-card" data-original-page="1" data-rotation="0" draggable="true">
      <div class="file-card-order">1</div>
      <div class="file-preview">
        <div class="paper-mockup">
          <div class="line title"></div>
          <div class="line"></div>
          <div class="line short"></div>
        </div>
      </div>
      <div class="file-name">${file.name}</div>
    </div>
  `;
  updateOrderSummary();
}

/**
 * Khởi tạo kéo thả sắp xếp cho các thẻ trang
 */
function initPageDragDrop() {
  if (typeof window.initDragReorder === 'function') {
    window.initDragReorder({
      container: '#fileCardWrap',
      itemSelector: '.file-card',
      updateBadgeOrders: true,
      onReorder: function() {
        updateOrderSummary();
      }
    });
  }
}

/**
 * Cập nhật chuỗi thứ tự trang mới hiển thị ở cột Tùy chọn
 */
function updateOrderSummary() {
  const container = document.getElementById('fileCardWrap');
  if (!container) return;

  const cards = container.querySelectorAll('.file-card');
  const pageOrder = [];

  cards.forEach((card, idx) => {
    // Đảm bảo số thứ tự badge khớp với vị trí trong DOM
    const badge = card.querySelector('.file-card-order');
    if (badge) badge.textContent = idx + 1;

    const orig = card.dataset.originalPage || (idx + 1);
    pageOrder.push(orig);
  });

  const previewEl = document.getElementById('orderSequencePreview');
  if (previewEl) {
    if (pageOrder.length === 0) {
      previewEl.textContent = 'Chưa có trang nào';
    } else if (pageOrder.length > 25) {
      const head = pageOrder.slice(0, 15).join(', ');
      const tail = pageOrder.slice(-5).join(', ');
      previewEl.textContent = `${head}, ... , ${tail} (Tổng: ${pageOrder.length} trang)`;
    } else {
      previewEl.textContent = pageOrder.join(', ');
    }
  }
}

/**
 * Xoay hướng của 1 trang cụ thể (90°)
 */
function rotatePageCard(btn, angle) {
  const card = btn.closest('.file-card');
  if (!card) return;

  const curAngle = parseInt(card.dataset.rotation || '0', 10);
  const newAngle = (curAngle + angle) % 360;
  card.dataset.rotation = newAngle;

  const canvas = card.querySelector('canvas');
  if (canvas) {
    canvas.style.transform = `rotate(${newAngle}deg)`;
  }
}

/**
 * Phóng to xem trước 1 trang cụ thể
 */
function zoomPageCard(btn) {
  const card = btn.closest('.file-card');
  if (!card || !currentPdfDoc) return;

  const origPage = parseInt(card.dataset.originalPage || '1', 10);
  const rotation = parseInt(card.dataset.rotation || '0', 10);

  // Tạo hoặc lấy modal zoom
  let modal = document.getElementById('pdfPageZoomModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pdfPageZoomModal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px; box-sizing:border-box;';
    modal.innerHTML = `
      <div style="background:#fff; border-radius:6px; max-width:850px; width:100%; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">
          <strong id="zoomModalTitle" style="color:#1e5b9c; font-size:1rem;"><i class="fas fa-search-plus"></i> Xem trước trang</strong>
          <button type="button" onclick="closeZoomPageModal()" style="border:none; background:transparent; font-size:1.3rem; cursor:pointer; color:#64748b;"><i class="fas fa-times"></i></button>
        </div>
        <div id="zoomModalBody" style="padding:20px; overflow:auto; display:flex; justify-content:center; align-items:center; background:#525659; min-height:360px;">
          <canvas id="zoomModalCanvas" style="max-width:100%; max-height:75vh; box-shadow:0 4px 15px rgba(0,0,0,0.4);"></canvas>
        </div>
      </div>
    `;
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeZoomPageModal();
    });
    document.body.appendChild(modal);
  }

  const titleEl = document.getElementById('zoomModalTitle');
  if (titleEl) {
    titleEl.innerHTML = `<i class="fas fa-search-plus"></i> Xem trước Trang ${origPage} (Góc xoay: ${rotation}°)`;
  }

  modal.style.display = 'flex';

  currentPdfDoc.getPage(origPage).then(function(page) {
    const canvas = document.getElementById('zoomModalCanvas');
    if (!canvas) return;

    const viewport = page.getViewport({ scale: 1.5, rotation: rotation });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    page.render({ canvasContext: ctx, viewport: viewport });
  });
}

function closeZoomPageModal() {
  const modal = document.getElementById('pdfPageZoomModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Đảo ngược toàn bộ thứ tự trang (trang cuối lên đầu)
 */
function reversePageOrder() {
  const container = document.getElementById('fileCardWrap');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.file-card'));
  if (cards.length <= 1) return;

  cards.reverse();
  cards.forEach(card => container.appendChild(card));

  updateOrderSummary();
}

/**
 * Khôi phục về thứ tự trang ban đầu từ 1 đến N
 */
function resetPageOrder() {
  const container = document.getElementById('fileCardWrap');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.file-card'));
  if (cards.length <= 1) return;

  cards.sort((a, b) => {
    const pageA = parseInt(a.dataset.originalPage || '0', 10);
    const pageB = parseInt(b.dataset.originalPage || '0', 10);
    return pageA - pageB;
  });

  cards.forEach(card => {
    card.dataset.rotation = '0';
    const canvas = card.querySelector('canvas');
    if (canvas) canvas.style.transform = 'none';
    container.appendChild(card);
  });

  updateOrderSummary();
}

/**
 * Gửi yêu cầu sắp xếp trang lên API Backend
 */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp tài liệu PDF để thực hiện.');
    return;
  }

  const container = document.getElementById('fileCardWrap');
  if (!container) return;

  const cards = container.querySelectorAll('.file-card');
  if (!cards || cards.length === 0) {
    alert('Không tìm thấy trang nào để sắp xếp.');
    return;
  }

  const newOrder = [];
  cards.forEach(card => {
    const origPage = parseInt(card.dataset.originalPage || '1', 10);
    const rot = parseInt(card.dataset.rotation || '0', 10);
    newOrder.push({ page: origPage, rotation: rot });
  });

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang sắp xếp tài liệu...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('new_order', JSON.stringify(newOrder));

  fetch('/pdf/api/sap-xep-trang-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Lưu thứ tự trang mới <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' && data.data) {
      currentDownloadUrl = data.data.download_url;
      currentDownloadFilename = data.data.download_name;

      const metaEl = document.getElementById('downloadMeta');
      if (metaEl) {
        metaEl.innerHTML = `Đã sắp xếp thành công <strong>${data.data.total_pages} trang</strong>. Dung lượng hoàn tất: <strong>${data.data.result_size_formatted}</strong>.`;
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
      alert(data.message || 'Đã có lỗi xảy ra trong quá trình sắp xếp trang.');
    }
  })
  .catch(err => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Lưu thứ tự trang mới <i class="fas fa-arrow-right"></i>';
    }
    console.error('Lỗi API sắp xếp trang:', err);
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
    alert('Không tìm thấy đường dẫn tải về. Vui lòng bấm sắp xếp lại.');
  }
}

/**
 * Đặt lại trạng thái để chọn file khác
 */
function resetFileSelection() {
  currentSelectedFile = null;
  currentPdfDoc = null;
  currentDownloadUrl = null;
  currentDownloadFilename = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const cardWrap = document.getElementById('fileCardWrap');
  if (cardWrap) cardWrap.innerHTML = '';

  const orderPrev = document.getElementById('orderSequencePreview');
  if (orderPrev) orderPrev.textContent = 'Chưa tải trang...';

  const totalCountEl = document.getElementById('totalPagesCount');
  if (totalCountEl) totalCountEl.textContent = '0 trang';

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
