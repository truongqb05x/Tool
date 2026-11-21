/* =========================================================
   CÔNG CỤ PDF: OCR PDF - ocr-pdf.js
   Logic chuyên biệt: Xử lý chọn file, tùy chọn ngôn ngữ & kết nối API
   ========================================================= */

let currentSelectedFile = null;
let currentDownloadUrl = null;
let currentDownloadName = null;
let currentOcrLang = 'vie+eng';

function selectOcrLang(element, lang) {
  currentOcrLang = lang;
  document.querySelectorAll('.ws-radio-box').forEach(el => el.classList.remove('selected'));
  if (element) {
    element.classList.add('selected');
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }
}

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
    alert('Vui lòng chọn đúng tệp tài liệu PDF (.pdf).');
    return;
  }

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

function resetFileSelection() {
  currentSelectedFile = null;
  currentDownloadUrl = null;
  currentDownloadName = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

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

function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp PDF để thực hiện OCR.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang quét OCR nhận diện chữ...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('lang', currentOcrLang);

  fetch('/pdf/api/ocr-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Quét OCR văn bản <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' || data.success) {
      currentDownloadUrl = data.download_url;
      currentDownloadName = data.download_name || 'tai_lieu_searchable.pdf';

      const toolWorkspace = document.getElementById('toolWorkspace');
      const downloadCard = document.getElementById('downloadCard');
      const downloadMeta = document.getElementById('downloadMeta');

      const d = data.data || {};
      if (downloadMeta) {
        downloadMeta.innerHTML = `Đã nhận diện thành công <strong>${d.total_pages || 1} trang</strong> (${d.total_words || 0} từ). Tệp PDF giờ đây có thể tìm kiếm từ khóa và bôi đen sao chép văn bản.`;
      }

      if (toolWorkspace) toolWorkspace.classList.remove('active');
      if (downloadCard) {
        downloadCard.classList.add('show');
        downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      alert(data.message || 'Có lỗi xảy ra khi OCR PDF. Vui lòng thử lại!');
    }
  })
  .catch(err => {
    console.error('Lỗi API OCR PDF:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Quét OCR văn bản <i class="fas fa-arrow-right"></i>';
    }
    alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau ít phút!');
  });
}

function downloadResultFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    if (currentDownloadName) a.download = currentDownloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy tệp tải về!');
  }
}

function toggleFaqItem(header) {
  const item = header.parentElement;
  if (item) item.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', initTool);
