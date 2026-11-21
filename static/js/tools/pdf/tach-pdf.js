/* =========================================================
   CÔNG CỤ PDF: TÁCH PDF - TACH-PDF.JS
   Logic chuyên biệt: Xử lý 1 file PDF, 3 chế độ (Range / Pages / Size),
   xem trước trang đầu tiên và cấu hình thông số bóc tách linh hoạt
   ========================================================= */

let currentSelectedFile = null;
let totalPdfPages = 1;
let currentTab = 'range';
let currentRangeMode = 'custom';
let currentExtractMode = 'all';
let currentSizeUnit = 'KB';
let rangeCount = 1;

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

  const sizeKb = (file.size / 1024).toFixed(2);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  // Cập nhật thẻ xem trước file
  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = 'Dung lượng: ' + displaySize;

  // Cập nhật thông số tab Size
  const sizeInfoOrig = document.getElementById('sizeInfoOrig');
  if (sizeInfoOrig) sizeInfoOrig.textContent = displaySize;

  // Render trang 1 thumbnail qua pdf-preview.js
  if (typeof renderPdfFirstPageThumbnail === 'function') {
    renderPdfFirstPageThumbnail(file, 'filePreview');
  }

  // Đọc số trang thực tế bằng PDF.js
  if (typeof pdfjsLib !== 'undefined') {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
        totalPdfPages = pdf.numPages || 1;
        applyTotalPagesToUi(totalPdfPages);
      }).catch(function(err) {
        console.warn('Lỗi đọc số trang PDF:', err);
        applyTotalPagesToUi(1);
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    applyTotalPagesToUi(1);
  }

  // Tooltip nổi tự ẩn sau 10s giống nen-pdf
  const tooltip = document.getElementById('floatingAddTooltip');
  if (tooltip) {
    tooltip.classList.remove('fade-out');
    clearTimeout(window._floatingTooltipTimer);
    window._floatingTooltipTimer = setTimeout(function() {
      tooltip.classList.add('fade-out');
    }, 10000);
  }

  // Ẩn hero, căn lề trái và chuyển màn hình
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

function applyTotalPagesToUi(pages) {
  totalPdfPages = Math.max(1, parseInt(pages, 10) || 1);

  // Tab Range: Custom - Giới hạn thực tế tối đa số trang
  document.querySelectorAll('input[id^="rangeTo_"]').forEach(el => {
    el.max = totalPdfPages;
    if (parseInt(el.value, 10) > totalPdfPages || el.id === 'rangeTo_1') {
      el.value = totalPdfPages;
    }
  });

  document.querySelectorAll('input[id^="rangeFrom_"]').forEach(el => {
    el.max = totalPdfPages;
    if (parseInt(el.value, 10) > totalPdfPages) {
      el.value = 1;
    }
  });

  // Tab Range: Fixed
  const fixedRangeInput = document.getElementById('fixedRangePages');
  if (fixedRangeInput) {
    fixedRangeInput.max = totalPdfPages;
    if (parseInt(fixedRangeInput.value, 10) > totalPdfPages) {
      fixedRangeInput.value = 1;
    }
  }
  const fixedCountPdf = document.getElementById('fixedCountPdf');
  if (fixedCountPdf) {
    fixedCountPdf.textContent = totalPdfPages;
  }

  // Tab Pages
  const extractAllCountPdf = document.getElementById('extractAllCountPdf');
  if (extractAllCountPdf) {
    extractAllCountPdf.textContent = totalPdfPages;
  }

  // Tab Size
  const sizeInfoPages = document.getElementById('sizeInfoPages');
  if (sizeInfoPages) {
    sizeInfoPages.textContent = totalPdfPages + ' trang';
  }

  updateSplitNotice();
}

function validateRangeInput(el, isTo = false) {
  let val = parseInt(el.value, 10);
  if (isNaN(val)) return;

  if (val > totalPdfPages) {
    el.value = totalPdfPages;
  } else if (val < 1) {
    el.value = 1;
  }

  updateSplitNotice();
}

function validateFixedRangeInput(el) {
  let val = parseInt(el.value, 10);
  if (isNaN(val)) return;

  if (val > totalPdfPages) {
    el.value = totalPdfPages;
  } else if (val < 1) {
    el.value = 1;
  }

  updateSplitNotice();
}

/* =========================================================
   CHUYỂN ĐỔI CÁC TAB CHÍNH (RANGE / PAGES / SIZE)
   ========================================================= */
function selectSplitTab(tab) {
  currentTab = tab;

  // Cập nhật active class cho 3 nút tab lớn
  document.querySelectorAll('.ws-tab-btn').forEach(el => el.classList.remove('active'));
  const activeTabBtn = document.getElementById('tabBtn' + capitalize(tab));
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Ẩn tất cả nội dung tab và hiển thị tab được chọn
  document.querySelectorAll('.split-tab-content').forEach(el => el.style.display = 'none');
  const activeContent = document.getElementById('tabContent' + capitalize(tab));
  if (activeContent) activeContent.style.display = 'block';

  updateSplitNotice();
}

/* =========================================================
   CHẾ ĐỘ TAB 1: RANGE (CUSTOM / FIXED)
   ========================================================= */
function selectRangeMode(mode) {
  currentRangeMode = mode;

  document.querySelectorAll('#tabContentRange .ws-submode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('modeBtn' + capitalize(mode));
  if (btn) btn.classList.add('active');

  const customEl = document.getElementById('rangeCustomContainer');
  const fixedEl = document.getElementById('rangeFixedContainer');
  if (customEl) customEl.style.display = mode === 'custom' ? 'block' : 'none';
  if (fixedEl) fixedEl.style.display = mode === 'fixed' ? 'block' : 'none';

  updateSplitNotice();
}

function addNewRangeItem() {
  rangeCount++;
  const wrapper = document.getElementById('rangeListWrapper');
  if (!wrapper) return;

  const fromVal = Math.min(totalPdfPages, rangeCount);
  const toVal = totalPdfPages;

  const itemHtml = `
    <div class="ws-range-card" id="rangeItem_${rangeCount}">
      <div class="ws-range-header">
        <span><i class="fas fa-bookmark" style="margin-right:4px;"></i> Khoảng trang ${rangeCount}</span>
        <button type="button" class="btn-delete-range" onclick="deleteRangeItem(${rangeCount})" title="Xóa khoảng trang này">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
      <div class="ws-range-inputs">
        <div class="ws-input-wrap">
          <span class="ws-input-prefix">Từ trang</span>
          <input type="number" min="1" max="${totalPdfPages}" value="${fromVal}" id="rangeFrom_${rangeCount}" oninput="validateRangeInput(this, false)">
        </div>
        <div class="ws-input-wrap">
          <span class="ws-input-prefix">Đến trang</span>
          <input type="number" min="1" max="${totalPdfPages}" value="${toVal}" id="rangeTo_${rangeCount}" oninput="validateRangeInput(this, true)">
        </div>
      </div>
    </div>
  `;

  wrapper.insertAdjacentHTML('beforeend', itemHtml);
  updateSplitNotice();
}

function deleteRangeItem(id) {
  const item = document.getElementById('rangeItem_' + id);
  if (item) {
    item.remove();
    updateSplitNotice();
  }
}

/* =========================================================
   CHẾ ĐỘ TAB 2: PAGES (EXTRACT ALL / SELECT PAGES)
   ========================================================= */
function selectExtractMode(mode) {
  currentExtractMode = mode;

  document.querySelectorAll('#tabContentPages .ws-submode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('modeBtnExtract' + (mode === 'all' ? 'All' : 'Select'));
  if (btn) btn.classList.add('active');

  const allEl = document.getElementById('extractAllContainer');
  const selectEl = document.getElementById('extractSelectContainer');
  if (allEl) allEl.style.display = mode === 'all' ? 'block' : 'none';
  if (selectEl) selectEl.style.display = mode === 'select' ? 'block' : 'none';

  updateSplitNotice();
}

/* =========================================================
   CHẾ ĐỘ TAB 3: SIZE (KB / MB)
   ========================================================= */
function toggleSizeUnit(unit) {
  currentSizeUnit = unit;
  document.querySelectorAll('.unit-toggle-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('unitBtn' + unit);
  if (btn) btn.classList.add('active');

  const inputMaxSize = document.getElementById('inputMaxSize');
  if (inputMaxSize) {
    if (unit === 'MB' && inputMaxSize.value > 10) {
      inputMaxSize.value = 2;
    } else if (unit === 'KB' && inputMaxSize.value <= 10) {
      inputMaxSize.value = 172;
    }
  }

  updateSplitNotice();
}

/* =========================================================
   TÍNH TOÁN & CẬP NHẬT THÔNG BÁO THỜI GIAN THỰC (TIẾNG VIỆT)
   ========================================================= */
function updateSplitNotice() {
  // Tab 1: Fixed
  const fixedRangeInput = document.getElementById('fixedRangePages');
  const fixedNoticeText = document.getElementById('fixedNoticeText');
  if (fixedRangeInput && fixedNoticeText) {
    const rangeVal = parseInt(fixedRangeInput.value, 10) || 1;
    const countPdf = Math.ceil(totalPdfPages / rangeVal);
    fixedNoticeText.innerHTML = `
      Tệp PDF sẽ được chia đều thành các file gồm ${rangeVal} trang.<br>
      Dự kiến tạo ra: <strong><span id="fixedCountPdf">${countPdf}</span> file PDF</strong>.
    `;
  }

  // Tab 2: Extract Select Pages
  const inputPages = document.getElementById('inputPagesToExtract');
  const extractSelectCountPdf = document.getElementById('extractSelectCountPdf');
  if (inputPages && extractSelectCountPdf) {
    const val = inputPages.value.trim();
    if (!val) {
      extractSelectCountPdf.textContent = '0';
    } else {
      // Phân tích cú pháp: 1, 3, 5-8
      const pagesSet = parsePageRangeString(val, totalPdfPages);
      extractSelectCountPdf.textContent = pagesSet.size;
    }
  }

  // Tab 3: Size
  const inputMaxSize = document.getElementById('inputMaxSize');
  const noticeMaxSizeVal = document.getElementById('noticeMaxSizeVal');
  if (inputMaxSize && noticeMaxSizeVal) {
    const maxVal = inputMaxSize.value.trim() || '172';
    noticeMaxSizeVal.textContent = `${maxVal} ${currentSizeUnit}`;
  }
}

function parsePageRangeString(str, maxPage) {
  const result = new Set();
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

let currentDownloadUrl = null;
let currentDownloadName = null;

/* =========================================================
   THỰC THI BÓC TÁCH FILE PDF
   ========================================================= */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 file PDF để xử lý.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang bóc tách file PDF...';

  // Đọc góc xoay từ card xem trước
  const fileCard = document.getElementById('fileCard');
  let rotation = 0;
  if (fileCard && fileCard.dataset.rotation) {
    rotation = parseInt(fileCard.dataset.rotation, 10) || 0;
  } else if (typeof currentPreviewRotation !== 'undefined') {
    rotation = currentPreviewRotation || 0;
  }

  // Thu thập cấu hình chi tiết theo tab đang chọn
  const config = {
    tab: currentTab,
    rotation: rotation
  };

  if (currentTab === 'range') {
    config.range_mode = currentRangeMode;
    if (currentRangeMode === 'custom') {
      const ranges = [];
      document.querySelectorAll('#rangeListWrapper .ws-range-card').forEach(card => {
        const fromInput = card.querySelector('input[id^="rangeFrom_"]');
        const toInput = card.querySelector('input[id^="rangeTo_"]');
        const f = fromInput ? parseInt(fromInput.value, 10) || 1 : 1;
        const t = toInput ? parseInt(toInput.value, 10) || totalPdfPages : totalPdfPages;
        ranges.push({ from: f, to: t });
      });
      config.ranges = ranges.length ? ranges : [{ from: 1, to: totalPdfPages }];
      const chkMerge = document.getElementById('chkMergeRangesCustom');
      config.merge_ranges = chkMerge ? chkMerge.checked : false;
    } else {
      const fixedInput = document.getElementById('fixedRangePages');
      config.fixed_pages = fixedInput ? parseInt(fixedInput.value, 10) || 1 : 1;
    }
  } else if (currentTab === 'pages') {
    config.extract_mode = currentExtractMode;
    if (currentExtractMode === 'select') {
      const inputPages = document.getElementById('inputPagesToExtract');
      config.pages_to_extract = inputPages ? inputPages.value.trim() : '';
      const chkMerge = document.getElementById('chkMergeExtractedPages');
      config.merge_pages = chkMerge ? chkMerge.checked : false;
    }
  } else if (currentTab === 'size') {
    const inputSize = document.getElementById('inputMaxSize');
    const rawVal = inputSize ? parseFloat(inputSize.value) || 500 : 500;
    config.max_size_kb = currentSizeUnit === 'MB' ? rawVal * 1024 : rawVal;
    const chkComp = document.getElementById('chkAllowCompression');
    config.allow_compression = chkComp ? chkComp.checked : true;
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('config', JSON.stringify(config));

  // Gửi request lên Backend Flask
  const uploadPromise = (window.UserFiles && typeof window.UserFiles.uploadAndProcess === 'function')
    ? window.UserFiles.uploadAndProcess('/pdf/api/tach-pdf', formData)
    : fetch('/pdf/api/tach-pdf', { method: 'POST', body: formData, credentials: 'same-origin' });

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
          downloadSuccessTitle.textContent = 'File PDF của bạn đã được tách thành công!';
        }

        if (downloadMeta) {
          if (data.is_zip) {
            downloadMeta.innerHTML = `Đã chia tách thành công thành <strong>${data.total_files} file PDF</strong> (tổng dung lượng nén: <strong>${data.result_size_formatted}</strong>). Tệp tải về là file ZIP chứa tất cả các phần đã tách.`;
          } else {
            downloadMeta.innerHTML = `Đã bóc tách thành <strong>1 file PDF</strong> duy nhất theo tùy chọn của bạn (dung lượng: <strong>${data.result_size_formatted}</strong>).`;
          }
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
        const errMsg = (result.data && result.data.message) ? result.data.message : 'Có lỗi xảy ra khi bóc tách file PDF.';
        alert(errMsg);
      }
    })
    .catch(function(err) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      console.error('Lỗi API bóc tách:', err);
      alert('Không thể kết nối đến máy chủ xử lý. Vui lòng thử lại sau.');
    });
}

function downloadResultFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    a.download = currentDownloadName || 'tailieu_da_tach.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Chưa có file kết quả để tải về.');
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
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

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
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
