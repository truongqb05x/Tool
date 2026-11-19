/* =========================================================
   CÔNG CỤ PDF: Bảo vệ PDF bằng mật khẩu - bao-ve-pdf.js
   Logic chuyên biệt: Xử lý chọn file, workspace & chuẩn bị API backend
   ========================================================= */

let currentSelectedFile = null;

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
  currentSelectedFile = file;
  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  if (nameEl) nameEl.textContent = file.name;
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
}

function executeToolAction() {
  if (!currentSelectedFile) return;

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý tài liệu...';
  }

  // Giả lập tiến trình xử lý, sẵn sàng thay bằng fetch('/pdf/api/bao-ve-pdf')
  setTimeout(function() {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Đặt mật khẩu bảo vệ <i class="fas fa-arrow-right"></i>';
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
  }, 1200);
}

function downloadResultFile() {
  if (!currentSelectedFile) return;
  const originalName = currentSelectedFile.name;
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
  const resultFileName = baseName + '_bao-ve-pdf.pdf';

  if (typeof fakeDownload === 'function') {
    fakeDownload(resultFileName);
  } else {
    alert('Đã chuẩn bị tải về: ' + resultFileName);
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

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
