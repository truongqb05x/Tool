/* =========================================================
   CÔNG CỤ PDF: XÓA TRANG PDF - XOA-TRANG-PDF.JS
   Logic chuyên biệt: Xử lý 1 file PDF, chọn trang hoặc khoảng trang cần xóa,
   tính toán số trang còn lại theo thời gian thực và gọi API Backend
   ========================================================= */

let currentSelectedFile = null;
let totalPdfPages = 1;
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

  // Đọc tổng số trang thực tế bằng PDF.js
  if (typeof pdfjsLib !== 'undefined') {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
        totalPdfPages = pdf.numPages || 1;
        applyTotalPages(totalPdfPages);
      }).catch(function() {
        applyTotalPages(1);
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    applyTotalPages(1);
  }

  // Tooltip nổi tự ẩn sau 10s
  const tooltip = document.getElementById('floatingAddTooltip');
  if (tooltip) {
    tooltip.classList.remove('fade-out');
    clearTimeout(window._floatingTooltipTimer);
    window._floatingTooltipTimer = setTimeout(function() {
      tooltip.classList.add('fade-out');
    }, 10000);
  }

  // Chuyển màn hình sang workspace
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

function applyTotalPages(pages) {
  totalPdfPages = Math.max(1, pages);

  const totalPagesOrig = document.getElementById('totalPagesOrig');
  if (totalPagesOrig) {
    totalPagesOrig.textContent = totalPdfPages + ' trang';
  }

  const inputEl = document.getElementById('inputPagesToRemove');
  if (inputEl) {
    inputEl.placeholder = `Ví dụ: 1, 3, 5-${Math.min(totalPdfPages, 8)}`;
  }

  updateDeleteNotice();
}

/* =========================================================
   CÁC NÚT CHỌN NHANH TRANG CẦN XÓA
   ========================================================= */
function applyQuickTag(type) {
  const inputEl = document.getElementById('inputPagesToRemove');
  if (!inputEl) return;

  if (type === 'first') {
    inputEl.value = '1';
  } else if (type === 'last') {
    inputEl.value = String(totalPdfPages);
  } else if (type === 'even') {
    const evens = [];
    for (let i = 2; i <= totalPdfPages; i += 2) evens.push(i);
    inputEl.value = evens.length ? evens.join(', ') : '';
  } else if (type === 'odd') {
    const odds = [];
    for (let i = 1; i <= totalPdfPages; i += 2) odds.push(i);
    inputEl.value = odds.length ? odds.join(', ') : '';
  }

  updateDeleteNotice();
}

function clearPagesInput() {
  const inputEl = document.getElementById('inputPagesToRemove');
  if (inputEl) inputEl.value = '';
  updateDeleteNotice();
}

/* =========================================================
   CẬP NHẬT THỜI GIAN THỰC SỐ TRANG SẼ XÓA & CÒN LẠI
   ========================================================= */
function updateDeleteNotice() {
  const inputEl = document.getElementById('inputPagesToRemove');
  const removeEl = document.getElementById('totalRemoveCount');
  const remainEl = document.getElementById('totalRemainCount');
  const noticeBox = document.getElementById('deleteNoticeText');
  const btnExecute = document.getElementById('btnExecute');

  if (!inputEl) return;

  const rawVal = inputEl.value.trim();
  const pagesSet = parsePageRangeString(rawVal, totalPdfPages);
  const removeCount = pagesSet.size;
  const remainCount = Math.max(0, totalPdfPages - removeCount);

  if (removeEl) removeEl.textContent = removeCount + ' trang';
  if (remainEl) remainEl.textContent = remainCount + ' trang';

  if (!noticeBox) return;

  if (removeCount === 0) {
    noticeBox.innerHTML = 'Vui lòng nhập số trang hoặc chọn nút gợi ý ở trên để chỉ định trang cần xóa.';
    if (btnExecute) btnExecute.disabled = false;
  } else if (removeCount >= totalPdfPages) {
    noticeBox.innerHTML = '<span style="color:#ef4444; font-weight:700;"><i class="fas fa-exclamation-triangle"></i> Không thể xóa toàn bộ các trang! Tài liệu phải giữ lại ít nhất 1 trang.</span>';
  } else {
    const sortedPages = Array.from(pagesSet).sort((a, b) => a - b);
    const displayList = sortedPages.length <= 6 ? sortedPages.join(', ') : (sortedPages.slice(0, 5).join(', ') + '... (tổng ' + sortedPages.length + ' trang)');
    noticeBox.innerHTML = `Sẽ xóa vĩnh viễn trang: <strong>${displayList}</strong>.<br>Tài liệu kết quả dự kiến còn: <strong style="color:#10b981;">${remainCount} trang</strong>.`;
    if (btnExecute) btnExecute.disabled = false;
  }
}

function parsePageRangeString(str, maxPage) {
  const result = new Set();
  if (!str) return result;

  const parts = str.split(',');
  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const fromP = Math.max(1, Math.min(start, end));
        const toP = Math.min(maxPage, Math.max(start, end));
        for (let p = fromP; p <= toP; p++) result.add(p);
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPage) {
        result.add(p);
      }
    }
  });
  return result;
}

/* =========================================================
   THỰC THI XÓA TRANG VÀ GỬI REQUEST LÊN BACKEND
   ========================================================= */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 file PDF để xử lý.');
    return;
  }

  const inputEl = document.getElementById('inputPagesToRemove');
  const rawVal = inputEl ? inputEl.value.trim() : '';
  const pagesSet = parsePageRangeString(rawVal, totalPdfPages);

  if (pagesSet.size === 0) {
    alert('Vui lòng nhập ít nhất 1 số trang cần xóa (ví dụ: 1, 3, 5-8).');
    if (inputEl) inputEl.focus();
    return;
  }

  if (pagesSet.size >= totalPdfPages) {
    alert('Không thể xóa toàn bộ trang của tài liệu. File PDF phải giữ lại ít nhất 1 trang.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xóa các trang đã chọn...';

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('pages_to_remove', JSON.stringify(Array.from(pagesSet)));

  const uploadPromise = (window.UserFiles && typeof window.UserFiles.uploadAndProcess === 'function')
    ? window.UserFiles.uploadAndProcess('/pdf/api/xoa-trang-pdf', formData)
    : fetch('/pdf/api/xoa-trang-pdf', { method: 'POST', body: formData, credentials: 'same-origin' });

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
          downloadSuccessTitle.textContent = 'Đã xóa các trang thừa thành công!';
        }

        if (downloadMeta) {
          downloadMeta.innerHTML = `Đã loại bỏ <strong>${data.removed_count} trang</strong>. File PDF mới còn <strong>${data.remaining_pages} trang</strong> (dung lượng: <strong>${data.result_size_formatted}</strong>).`;
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
        const errMsg = (result.data && result.data.message) ? result.data.message : 'Có lỗi xảy ra khi xóa trang file PDF.';
        alert(errMsg);
      }
    })
    .catch(function(err) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      console.error('Lỗi API xóa trang PDF:', err);
      alert('Không thể kết nối đến máy chủ xử lý. Vui lòng thử lại sau.');
    });
}

function downloadResultFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    a.download = currentDownloadName || 'tailieu_da_xoa_trang.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Chưa có file kết quả để tải về.');
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
  totalPdfPages = 1;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const inputPages = document.getElementById('inputPagesToRemove');
  if (inputPages) inputPages.value = '';

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
