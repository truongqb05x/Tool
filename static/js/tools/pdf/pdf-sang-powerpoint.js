/* =========================================================
   CÔNG CỤ PDF: Chuyển PDF sang PowerPoint - pdf-sang-powerpoint.js
   Logic: Chuyển đổi các trang PDF thành bài thuyết trình PowerPoint (.pptx)
   ========================================================= */

let currentSelectedFile = null;
let pptDownloadUrl = null;
let pptFileName = null;

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
  pptDownloadUrl = null;
  pptFileName = null;

  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  const summaryNameEl = document.getElementById('summaryFileName');

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = 'Dung lượng: ' + displaySize;
  if (summaryNameEl) summaryNameEl.textContent = file.name;

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

async function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn một file PDF trước!');
    return;
  }

  const btn = document.getElementById('btnExecute');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Đang tạo slide PowerPoint...';
  }

  try {
    const formData = new FormData();
    formData.append('file', currentSelectedFile);

    const response = await fetch('/pdf/api/pdf-sang-powerpoint', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || 'Chuyển đổi PDF sang PowerPoint thất bại. Vui lòng thử lại!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
      return;
    }

    // Chuyển đổi thành công
    pptDownloadUrl = result.download_url;
    pptFileName = result.filename || `${currentSelectedFile.name.replace(/\.pdf$/i, '')}.pptx`;

    if (typeof saveRecentFile === 'function') {
      saveRecentFile({
        name: pptFileName,
        url: pptDownloadUrl,
        tool: 'pdf-sang-powerpoint',
        date: new Date().toISOString()
      });
    }

    const downloadSuccessTitle = document.getElementById('downloadSuccessTitle');
    const downloadMeta = document.getElementById('downloadMeta');

    if (downloadSuccessTitle) {
      downloadSuccessTitle.textContent = `Bài thuyết trình "${pptFileName}" đã sẵn sàng!`;
    }
    if (downloadMeta) {
      downloadMeta.textContent = `Tệp PowerPoint .pptx (${result.result_size_formatted || ''}) gồm ${result.slides_count || 1} slide đã được tối ưu hoàn tất.`;
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
    console.error('Lỗi khi chuyển đổi PDF sang PowerPoint:', err);
    alert('Có lỗi mạng khi kết nối máy chủ. Vui lòng thử lại!');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

function downloadResultFile() {
  if (pptDownloadUrl) {
    const a = document.createElement('a');
    a.href = pptDownloadUrl;
    a.download = pptFileName || 'tai_lieu.pptx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy liên kết tải về. Vui lòng chuyển đổi lại!');
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
  pptDownloadUrl = null;
  pptFileName = null;

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
