/* =========================================================
   CÔNG CỤ PDF: PDF sang ảnh - pdf-sang-anh.js
   Logic: Chuyển đổi các trang PDF thành hình ảnh JPG/PNG chất lượng cao
   ========================================================= */

let currentSelectedFile = null;
let currentFormat = 'jpg';
let currentDpi = '150';
let convertedDownloadUrl = null;
let convertedFileName = null;

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

function handleFileSelected(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Vui lòng chọn tệp có định dạng PDF (.pdf)!');
    return;
  }

  currentSelectedFile = file;
  convertedDownloadUrl = null;
  convertedFileName = null;

  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  const summaryNameEl = document.getElementById('summaryFileName');

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = 'Dung lượng: ' + displaySize;
  if (summaryNameEl) summaryNameEl.textContent = file.name;

  updateSummary();

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

function handleFormatChange(fmt) {
  currentFormat = fmt;
  const optJpg = document.getElementById('optJpgLabel');
  const optPng = document.getElementById('optPngLabel');
  if (fmt === 'jpg') {
    if (optJpg) optJpg.classList.add('selected');
    if (optPng) optPng.classList.remove('selected');
  } else {
    if (optPng) optPng.classList.add('selected');
    if (optJpg) optJpg.classList.remove('selected');
  }
  updateSummary();
}

function handleDpiChange(dpi) {
  currentDpi = dpi;
  const opt150 = document.getElementById('optDpi150Label');
  const opt300 = document.getElementById('optDpi300Label');
  if (dpi === '150') {
    if (opt150) opt150.classList.add('selected');
    if (opt300) opt300.classList.remove('selected');
  } else {
    if (opt300) opt300.classList.add('selected');
    if (opt150) opt150.classList.remove('selected');
  }
  updateSummary();
}

function togglePageRangeInput(show) {
  const wrap = document.getElementById('pageRangeWrap');
  if (wrap) {
    wrap.style.display = show ? 'block' : 'none';
    if (show) {
      const input = document.getElementById('pageRangeInput');
      if (input) input.focus();
    }
  }
}

function updateSummary() {
  const summaryEl = document.getElementById('summaryFormatDpi');
  if (summaryEl) {
    summaryEl.textContent = `Ảnh ${currentFormat.toUpperCase()} (${currentDpi} DPI)`;
  }
}

async function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn một file PDF trước!');
    return;
  }

  let pageRange = '';
  const customScope = document.querySelector('input[name="pageScope"][value="custom"]');
  if (customScope && customScope.checked) {
    const rangeInput = document.getElementById('pageRangeInput');
    pageRange = rangeInput ? rangeInput.value.trim() : '';
    if (!pageRange) {
      alert('Vui lòng nhập khoảng trang cần xuất (ví dụ: 1-3, 5)!');
      if (rangeInput) rangeInput.focus();
      return;
    }
  }

  const btn = document.getElementById('btnExecute');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Đang kết xuất hình ảnh...';
  }

  try {
    const formData = new FormData();
    formData.append('file', currentSelectedFile);
    formData.append('format', currentFormat);
    formData.append('dpi', currentDpi);
    if (pageRange) {
      formData.append('page_range', pageRange);
    }

    const response = await fetch('/pdf/api/pdf-sang-anh', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || 'Chuyển đổi PDF sang ảnh thất bại. Vui lòng thử lại!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
      return;
    }

    // Thành công
    convertedDownloadUrl = result.download_url;
    convertedFileName = result.filename || `${currentSelectedFile.name.replace(/\.pdf$/i, '')}_images_${currentFormat}.zip`;

    // Lưu vào lịch sử xử lý gần đây nếu có
    if (typeof saveRecentFile === 'function') {
      saveRecentFile({
        name: convertedFileName,
        url: convertedDownloadUrl,
        tool: 'pdf-sang-anh',
        date: new Date().toISOString()
      });
    }

    const downloadSuccessTitle = document.getElementById('downloadSuccessTitle');
    const downloadMeta = document.getElementById('downloadMeta');

    if (downloadSuccessTitle) {
      downloadSuccessTitle.textContent = `Đã xuất ${result.exported_images || ''} trang thành ảnh ${result.format || ''} thành công!`;
    }
    if (downloadMeta) {
      downloadMeta.textContent = `Tệp ZIP (${result.result_size_formatted || ''}) chứa trọn bộ ảnh đã sẵn sàng lưu về thiết bị của bạn.`;
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

  } catch (err) {
    console.error('Lỗi khi chuyển đổi PDF sang ảnh:', err);
    alert('Có lỗi mạng khi kết nối máy chủ. Vui lòng kiểm tra lại!');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

function downloadResultFile() {
  if (convertedDownloadUrl) {
    const a = document.createElement('a');
    a.href = convertedDownloadUrl;
    a.download = convertedFileName || 'tai_lieu_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy liên kết tải về. Vui lòng chuyển đổi lại!');
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
  convertedDownloadUrl = null;
  convertedFileName = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const rangeInput = document.getElementById('pageRangeInput');
  if (rangeInput) rangeInput.value = '';

  const allScope = document.querySelector('input[name="pageScope"][value="all"]');
  if (allScope) allScope.checked = true;
  togglePageRangeInput(false);

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');
  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');

  if (toolHero) toolHero.classList.remove('sr-only');
  if (toolContainer) toolContainer.classList.remove('aligned-left');
  if (downloadCard) downloadCard.classList.remove('show');
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (uploadPanel) uploadPanel.style.display = 'block';
}

function toggleFaqItem(element) {
  const faqItem = element.closest('.tool-faq-item');
  if (faqItem) {
    faqItem.classList.toggle('active');
  }
}

document.addEventListener('DOMContentLoaded', initTool);
