/* =========================================================
   CÔNG CỤ PDF: Ảnh sang PDF - anh-sang-pdf.js
   Logic: Ghép nhiều hình ảnh JPG, PNG, WEBP thành một tài liệu PDF
   ========================================================= */

let selectedImages = [];
let currentPageSize = 'fit';
let currentOrientation = 'auto';
let currentMargin = 0;
let pdfDownloadUrl = null;
let pdfFileName = null;

function initTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        addFiles(Array.from(this.files));
        this.value = ''; // Reset input để có thể chọn lại cùng file
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    });
  }
}

function addFiles(files) {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
  const newValidImages = files.filter(file => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return validExtensions.includes(ext);
  });

  if (newValidImages.length === 0) {
    alert('Vui lòng chọn các tệp hình ảnh hợp lệ (JPG, PNG, WEBP, BMP)!');
    return;
  }

  // Thêm vào danh sách
  selectedImages = selectedImages.concat(newValidImages);
  renderThumbnails();

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

function renderThumbnails() {
  const container = document.getElementById('imageListContainer');
  const summaryCount = document.getElementById('summaryImageCount');
  if (summaryCount) {
    summaryCount.textContent = `${selectedImages.length} ảnh`;
  }

  if (!container) return;
  container.innerHTML = '';

  selectedImages.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'img-thumb-card';
    card.style.cssText = `
      position: relative;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px;
    `;

    // Nút xóa ảnh
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.title = 'Xóa ảnh này';
    removeBtn.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(231,76,60,0.85);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      z-index: 2;
    `;
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeImage(index);
    };

    // Số trang / số thứ tự
    const badge = document.createElement('span');
    badge.textContent = index + 1;
    badge.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      background: rgba(30,91,156,0.85);
      color: #fff;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.7rem;
      font-weight: bold;
      z-index: 2;
    `;

    // Ảnh xem trước
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.style.cssText = `
      width: 100%;
      height: 120px;
      object-fit: contain;
      background: #f8fafc;
      border-radius: 4px;
    `;

    // Tên file
    const nameEl = document.createElement('div');
    nameEl.textContent = file.name;
    nameEl.title = file.name;
    nameEl.style.cssText = `
      font-size: 0.75rem;
      color: #475569;
      margin-top: 6px;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    `;

    card.appendChild(removeBtn);
    card.appendChild(badge);
    card.appendChild(img);
    card.appendChild(nameEl);
    container.appendChild(card);
  });
}

function removeImage(index) {
  selectedImages.splice(index, 1);
  if (selectedImages.length === 0) {
    resetFileSelection();
  } else {
    renderThumbnails();
  }
}

function handlePageSizeChange(size) {
  currentPageSize = size;
  ['optSizeFit', 'optSizeA4', 'optSizeLetter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });

  const activeId = size === 'fit' ? 'optSizeFit' : (size === 'a4' ? 'optSizeA4' : 'optSizeLetter');
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('selected');

  const orientWrap = document.getElementById('orientationWrap');
  if (orientWrap) {
    orientWrap.style.display = size === 'fit' ? 'none' : 'block';
  }

  updateSummary();
}

function handleOrientationChange(orient) {
  currentOrientation = orient;
  ['optOrientAuto', 'optOrientPort', 'optOrientLand'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });

  const activeId = orient === 'auto' ? 'optOrientAuto' : (orient === 'portrait' ? 'optOrientPort' : 'optOrientLand');
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('selected');

  updateSummary();
}

function handleMarginChange(margin) {
  currentMargin = margin;
  ['optMarginNone', 'optMarginSmall', 'optMarginBig'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });

  const activeId = margin === 0 ? 'optMarginNone' : (margin === 12 ? 'optMarginSmall' : 'optMarginBig');
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('selected');

  updateSummary();
}

function updateSummary() {
  const summaryPage = document.getElementById('summaryPageSize');
  if (summaryPage) {
    let sizeText = 'Vừa kích thước ảnh';
    if (currentPageSize === 'a4') sizeText = 'Khổ A4 (' + (currentOrientation === 'landscape' ? 'Ngang' : 'Dọc') + ')';
    if (currentPageSize === 'letter') sizeText = 'Letter (' + (currentOrientation === 'landscape' ? 'Ngang' : 'Dọc') + ')';
    summaryPage.textContent = sizeText;
  }
}

async function executeToolAction() {
  if (!selectedImages || selectedImages.length === 0) {
    alert('Vui lòng chọn ít nhất một hình ảnh!');
    return;
  }

  const btn = document.getElementById('btnExecute');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Đang tạo tệp PDF...';
  }

  try {
    const formData = new FormData();
    selectedImages.forEach(file => {
      formData.append('files', file);
    });
    formData.append('pageSize', currentPageSize);
    formData.append('orientation', currentOrientation);
    formData.append('margin', currentMargin);

    const response = await fetch('/pdf/api/anh-sang-pdf', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || 'Chuyển đổi hình ảnh sang PDF thất bại. Vui lòng thử lại!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
      return;
    }

    // Ghép thành công
    pdfDownloadUrl = result.download_url;
    pdfFileName = result.filename || `anh_sang_pdf_${result.task_id.substring(0,8)}.pdf`;

    if (typeof saveRecentFile === 'function') {
      saveRecentFile({
        name: pdfFileName,
        url: pdfDownloadUrl,
        tool: 'anh-sang-pdf',
        date: new Date().toISOString()
      });
    }

    const downloadSuccessTitle = document.getElementById('downloadSuccessTitle');
    const downloadMeta = document.getElementById('downloadMeta');

    if (downloadSuccessTitle) {
      downloadSuccessTitle.textContent = `Đã ghép ${result.image_count} bức ảnh thành tài liệu PDF hoàn chỉnh!`;
    }
    if (downloadMeta) {
      downloadMeta.textContent = `Tệp PDF (${result.result_size_formatted || ''}) đã được tối ưu và sẵn sàng tải về.`;
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
    console.error('Lỗi khi ghép ảnh sang PDF:', err);
    alert('Có lỗi mạng khi kết nối máy chủ. Vui lòng thử lại!');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

function downloadResultFile() {
  if (pdfDownloadUrl) {
    const a = document.createElement('a');
    a.href = pdfDownloadUrl;
    a.download = pdfFileName || 'anh_sang_pdf.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy liên kết tải về. Vui lòng thực hiện lại!');
  }
}

function resetFileSelection() {
  selectedImages = [];
  pdfDownloadUrl = null;
  pdfFileName = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const container = document.getElementById('imageListContainer');
  if (container) container.innerHTML = '';

  handlePageSizeChange('fit');
  handleOrientationChange('auto');
  handleMarginChange(0);

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
