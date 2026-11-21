/* =========================================================
   CÔNG CỤ PDF: TRÍCH XUẤT TRANG PDF - TRICH-XUAT-TRANG-PDF.JS
   Hỗ trợ xem trước thumbnail từng trang, nhấp chọn trang trực quan,
   đồng bộ ô nhập dải trang 2 chiều, tùy chọn xuất gộp PDF hoặc nén ZIP
   ========================================================= */

let currentSelectedFile = null;
let currentPdfDoc = null;
let currentTotalPages = 0;
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
      currentTotalPages = pdf.numPages;

      const totalCountEl = document.getElementById('totalPagesOrig');
      if (totalCountEl) totalCountEl.textContent = `${currentTotalPages} trang`;

      if (cardWrap) cardWrap.innerHTML = '';

      // Duyệt qua từng trang để tạo khung thẻ
      for (let i = 1; i <= currentTotalPages; i++) {
        const card = createExtractPageCardElement(i);
        if (cardWrap) cardWrap.appendChild(card);
        renderExtractPageThumbnail(pdf, i);
      }

      // Mặc định chọn trang 1 để người dùng trải nghiệm ngay
      togglePageSelection(1, true);

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
 * Tạo DOM element cho thẻ trang PDF với trạng thái chọn trích xuất
 */
function createExtractPageCardElement(pageNum) {
  const card = document.createElement('div');
  card.className = 'file-card extract-page-card';
  card.dataset.pageNum = pageNum;
  card.dataset.rotation = '0';
  card.style.cursor = 'pointer';

  card.innerHTML = `
    <!-- Checkbox chọn trang -->
    <div class="page-select-badge" style="position:absolute; top:8px; left:8px; width:24px; height:24px; border-radius:4px; border:2px solid #cbd5e1; background:#fff; display:flex; align-items:center; justify-content:center; z-index:5; transition:all 0.2s ease;">
      <i class="fas fa-check" style="font-size:0.75rem; color:#fff; display:none;"></i>
    </div>

    <!-- Nút hành động xem phóng to và xoay -->
    <div class="file-card-actions">
      <button type="button" class="btn-card-action" onclick="event.stopPropagation(); rotatePageCard(this, 90);" title="Xoay trang 90°">
        <i class="fas fa-redo"></i>
      </button>
      <button type="button" class="btn-card-action" onclick="event.stopPropagation(); zoomPageCard(this);" title="Xem phóng to">
        <i class="fas fa-search-plus"></i>
      </button>
    </div>

    <div class="file-preview" id="pagePreview_${pageNum}" style="min-height:160px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
      <canvas id="pageCanvas_${pageNum}" style="max-width:100%; max-height:160px; border-radius:2px; box-shadow:0 1px 4px rgba(0,0,0,0.12); transition:transform 0.2s ease;"></canvas>
    </div>

    <div class="file-name" style="margin-top:6px; font-weight:600; font-size:0.82rem; color:#333;">Trang ${pageNum}</div>
  `;

  // Bấm vào thẻ để bật/tắt chọn trang
  card.addEventListener('click', function(e) {
    if (e.target.closest('button, .file-card-actions')) return;
    togglePageCardClick(card);
  });

  return card;
}

/**
 * Render thumbnail của 1 trang cụ thể vào canvas
 */
function renderExtractPageThumbnail(pdf, pageNum) {
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
 * Fallback khi không nạp được PDF.js
 */
function renderFallbackCardList(file) {
  const cardWrap = document.getElementById('fileCardWrap');
  if (!cardWrap) return;

  cardWrap.innerHTML = `
    <div class="file-card selected" data-page-num="1">
      <div class="file-name">${file.name}</div>
      <div class="file-meta">Trang 1</div>
    </div>
  `;
  currentTotalPages = 1;
  syncSelectedCardsToInput();
}

/**
 * Click vào thẻ trang để bật/tắt chọn
 */
function togglePageCardClick(card) {
  const isSelected = card.classList.contains('selected');
  setCardSelectedState(card, !isSelected);
  syncSelectedCardsToInput();
}

/**
 * Thiết lập trạng thái chọn cho thẻ
 */
function setCardSelectedState(card, selected) {
  const badge = card.querySelector('.page-select-badge');
  const checkIcon = badge ? badge.querySelector('i') : null;

  if (selected) {
    card.classList.add('selected');
    card.style.borderColor = '#1e5b9c';
    card.style.boxShadow = '0 0 0 2px rgba(30, 91, 156, 0.25)';
    if (badge) {
      badge.style.background = '#1e5b9c';
      badge.style.borderColor = '#1e5b9c';
    }
    if (checkIcon) checkIcon.style.display = 'block';
  } else {
    card.classList.remove('selected');
    card.style.borderColor = '#ccc';
    card.style.boxShadow = 'none';
    if (badge) {
      badge.style.background = '#fff';
      badge.style.borderColor = '#cbd5e1';
    }
    if (checkIcon) checkIcon.style.display = 'none';
  }
}

/**
 * Bật/tắt chọn trang theo số trang
 */
function togglePageSelection(pageNum, selected) {
  const card = document.querySelector(`.file-card[data-page-num="${pageNum}"]`);
  if (card) {
    setCardSelectedState(card, selected);
    syncSelectedCardsToInput();
  }
}

/**
 * Đồng bộ danh sách các thẻ được chọn lên Input và Tóm tắt
 */
function syncSelectedCardsToInput() {
  const cards = document.querySelectorAll('#fileCardWrap .file-card');
  const selectedPages = [];

  cards.forEach(card => {
    if (card.classList.contains('selected')) {
      const p = parseInt(card.dataset.pageNum, 10);
      if (!isNaN(p)) selectedPages.push(p);
    }
  });

  selectedPages.sort((a, b) => a - b);

  const inputEl = document.getElementById('inputPagesToExtract');
  if (inputEl && document.activeElement !== inputEl) {
    inputEl.value = formatPagesListToString(selectedPages);
  }

  updateExtractSummary(selectedPages);
}

/**
 * Gom chuỗi các số trang (ví dụ [1, 2, 3, 5, 7, 8] -> '1-3, 5, 7-8')
 */
function formatPagesListToString(pages) {
  if (!pages || pages.length === 0) return '';
  const ranges = [];
  let start = pages[0];
  let prev = pages[0];

  for (let i = 1; i < pages.length; i++) {
    const cur = pages[i];
    if (cur === prev + 1) {
      prev = cur;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = cur;
      prev = cur;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

/**
 * Khi người dùng nhập trực tiếp vào ô input
 */
function onPagesInputChange() {
  const inputEl = document.getElementById('inputPagesToExtract');
  if (!inputEl) return;

  const rawVal = inputEl.value.trim();
  const pagesSet = parsePagesString(rawVal, currentTotalPages);

  const cards = document.querySelectorAll('#fileCardWrap .file-card');
  cards.forEach(card => {
    const p = parseInt(card.dataset.pageNum, 10);
    setCardSelectedState(card, pagesSet.has(p));
  });

  updateExtractSummary(Array.from(pagesSet).sort((a, b) => a - b));
}

/**
 * Phân tích chuỗi số trang (ví dụ '1, 3, 5-8')
 */
function parsePagesString(str, maxPages) {
  const setPages = new Set();
  if (!str) return setPages;

  const parts = str.split(',');
  parts.forEach(part => {
    part = part.trim();
    if (!part) return;
    if (part.includes('-')) {
      const bounds = part.split('-');
      const start = parseInt(bounds[0].trim(), 10);
      const end = parseInt(bounds[1].trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const f = Math.max(1, Math.min(start, end));
        const t = Math.min(maxPages || 99999, Math.max(start, end));
        for (let i = f; i <= t; i++) setPages.add(i);
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= (maxPages || 99999)) {
        setPages.add(p);
      }
    }
  });

  return setPages;
}

/**
 * Cập nhật bảng tóm tắt và cảnh báo
 */
function updateExtractSummary(selectedPages) {
  const countEl = document.getElementById('totalExtractCount');
  const summaryEl = document.getElementById('pagesSelectedSummary');
  const noticeEl = document.getElementById('extractNoticeText');
  const btn = document.getElementById('btnExecute');

  const count = selectedPages.length;
  if (countEl) countEl.textContent = `${count} trang`;

  if (summaryEl) {
    if (count === 0) {
      summaryEl.textContent = 'Chưa chọn trang nào';
    } else if (count > 25) {
      const head = selectedPages.slice(0, 15).join(', ');
      const tail = selectedPages.slice(-5).join(', ');
      summaryEl.textContent = `${head}, ... , ${tail} (Tổng: ${count} trang)`;
    } else {
      summaryEl.textContent = selectedPages.join(', ');
    }
  }

  if (noticeEl) {
    if (count === 0) {
      noticeEl.innerHTML = '<span style="color:#ef4444;"><i class="fas fa-exclamation-triangle"></i> Vui lòng chọn ít nhất 1 trang để trích xuất ra tài liệu mới.</span>';
      if (btn) btn.disabled = true;
    } else {
      noticeEl.innerHTML = `<i class="fas fa-info-circle"></i> Sẵn sàng trích xuất <strong>${count} trang</strong> đã chọn thành tệp mới.`;
      if (btn) btn.disabled = false;
    }
  }
}

/**
 * Áp dụng các nút chọn nhanh
 */
function applyQuickTag(type) {
  if (currentTotalPages <= 0) return;

  const setPages = new Set();
  if (type === 'all') {
    for (let i = 1; i <= currentTotalPages; i++) setPages.add(i);
  } else if (type === 'first') {
    setPages.add(1);
  } else if (type === 'last') {
    setPages.add(currentTotalPages);
  } else if (type === 'even') {
    for (let i = 2; i <= currentTotalPages; i += 2) setPages.add(i);
  } else if (type === 'odd') {
    for (let i = 1; i <= currentTotalPages; i += 2) setPages.add(i);
  }

  const cards = document.querySelectorAll('#fileCardWrap .file-card');
  cards.forEach(card => {
    const p = parseInt(card.dataset.pageNum, 10);
    setCardSelectedState(card, setPages.has(p));
  });

  const arr = Array.from(setPages).sort((a, b) => a - b);
  const inputEl = document.getElementById('inputPagesToExtract');
  if (inputEl) inputEl.value = formatPagesListToString(arr);

  updateExtractSummary(arr);
}

/**
 * Xóa sạch ô nhập và bỏ chọn tất cả
 */
function clearPagesInput() {
  const inputEl = document.getElementById('inputPagesToExtract');
  if (inputEl) inputEl.value = '';

  const cards = document.querySelectorAll('#fileCardWrap .file-card');
  cards.forEach(card => setCardSelectedState(card, false));

  updateExtractSummary([]);
}

/**
 * Đổi chế độ xuất file (Gộp PDF hoặc Nén ZIP)
 */
function onExtractModeChange(radio) {
  const optionBoxes = document.querySelectorAll('.ws-radio-box');
  optionBoxes.forEach(b => b.classList.remove('selected'));
  if (radio && radio.closest('.ws-radio-box')) {
    radio.closest('.ws-radio-box').classList.add('selected');
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

  const pageNum = parseInt(card.dataset.pageNum || '1', 10);
  const rotation = parseInt(card.dataset.rotation || '0', 10);

  let modal = document.getElementById('pdfExtractZoomModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pdfExtractZoomModal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px; box-sizing:border-box;';
    modal.innerHTML = `
      <div style="background:#fff; border-radius:6px; max-width:850px; width:100%; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">
          <strong id="zoomExtractTitle" style="color:#1e5b9c; font-size:1rem;"><i class="fas fa-search-plus"></i> Xem trước trang</strong>
          <button type="button" onclick="closeZoomExtractModal()" style="border:none; background:transparent; font-size:1.3rem; cursor:pointer; color:#64748b;"><i class="fas fa-times"></i></button>
        </div>
        <div id="zoomExtractBody" style="padding:20px; overflow:auto; display:flex; justify-content:center; align-items:center; background:#525659; min-height:360px;">
          <canvas id="zoomExtractCanvas" style="max-width:100%; max-height:75vh; box-shadow:0 4px 15px rgba(0,0,0,0.4);"></canvas>
        </div>
      </div>
    `;
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeZoomExtractModal();
    });
    document.body.appendChild(modal);
  }

  const titleEl = document.getElementById('zoomExtractTitle');
  if (titleEl) {
    titleEl.innerHTML = `<i class="fas fa-search-plus"></i> Xem trước Trang ${pageNum} (Góc xoay: ${rotation}°)`;
  }

  modal.style.display = 'flex';

  currentPdfDoc.getPage(pageNum).then(function(page) {
    const canvas = document.getElementById('zoomExtractCanvas');
    if (!canvas) return;

    const viewport = page.getViewport({ scale: 1.5, rotation: rotation });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    page.render({ canvasContext: ctx, viewport: viewport });
  });
}

function closeZoomExtractModal() {
  const modal = document.getElementById('pdfExtractZoomModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Gửi yêu cầu trích xuất trang lên API Backend
 */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp tài liệu PDF để thực hiện.');
    return;
  }

  const inputEl = document.getElementById('inputPagesToExtract');
  const rawPages = inputEl ? inputEl.value.trim() : '';
  const setPages = parsePagesString(rawPages, currentTotalPages);

  if (setPages.size === 0) {
    alert('Vui lòng chọn ít nhất 1 trang để trích xuất.');
    return;
  }

  const selectedPagesList = Array.from(setPages).sort((a, b) => a - b);
  const extractModeRadio = document.querySelector('input[name="extractMode"]:checked');
  const extractMode = extractModeRadio ? extractModeRadio.value : 'merged';

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang trích xuất trang...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('pages', JSON.stringify(selectedPagesList));
  formData.append('extract_mode', extractMode);

  fetch('/pdf/api/trich-xuat-trang-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Trích xuất trang PDF ngay <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' && data.data) {
      currentDownloadUrl = data.data.download_url;
      currentDownloadFilename = data.data.download_name;

      const titleEl = document.getElementById('downloadSuccessTitle');
      if (titleEl) {
        titleEl.textContent = `Đã trích xuất thành công ${data.data.extracted_count} trang!`;
      }

      const metaEl = document.getElementById('downloadMeta');
      if (metaEl) {
        const typeLabel = data.data.is_zip ? 'Tệp nén ZIP' : 'Tệp PDF mới';
        metaEl.innerHTML = `Định dạng xuất: <strong>${typeLabel}</strong>. Dung lượng hoàn tất: <strong>${data.data.result_size_formatted}</strong>.`;
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
      alert(data.message || 'Đã có lỗi xảy ra trong quá trình trích xuất trang.');
    }
  })
  .catch(err => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Trích xuất trang PDF ngay <i class="fas fa-arrow-right"></i>';
    }
    console.error('Lỗi API trích xuất trang:', err);
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
    alert('Không tìm thấy đường dẫn tải về. Vui lòng bấm trích xuất lại.');
  }
}

/**
 * Đặt lại trạng thái để chọn file khác
 */
function resetFileSelection() {
  currentSelectedFile = null;
  currentPdfDoc = null;
  currentTotalPages = 0;
  currentDownloadUrl = null;
  currentDownloadFilename = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const cardWrap = document.getElementById('fileCardWrap');
  if (cardWrap) cardWrap.innerHTML = '';

  const inputEl = document.getElementById('inputPagesToExtract');
  if (inputEl) inputEl.value = '';

  const totalCountEl = document.getElementById('totalPagesOrig');
  if (totalCountEl) totalCountEl.textContent = '0 trang';

  const extractCountEl = document.getElementById('totalExtractCount');
  if (extractCountEl) extractCountEl.textContent = '0 trang';

  const summaryEl = document.getElementById('pagesSelectedSummary');
  if (summaryEl) summaryEl.textContent = 'Chưa chọn trang nào';

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
