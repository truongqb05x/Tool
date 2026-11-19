/* =========================================================
   CÔNG CỤ NÉN PDF - NEN-PDF.JS
   Logic chuyên biệt: Kéo thả file PDF, cấu hình mức độ nén và tải kết quả
   ========================================================= */

let currentPdfFile = null;
let currentCompressionLevel = 'recommended';

function initNenPdfTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        handlePdfSelected(this.files[0]);
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
        handlePdfSelected(e.dataTransfer.files[0]);
      }
    });
  }
}

function handlePdfSelected(file) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Vui lòng chọn tệp định dạng PDF.');
    return;
  }

  currentPdfFile = file;
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

  // Cập nhật card thông tin file
  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = `Dung lượng: ${sizeMb} MB`;

  // Ẩn phần giới thiệu hero nhưng vẫn giữ nguyên SEO bằng class sr-only
  const toolHero = document.getElementById('toolHero') || document.querySelector('.tool-hero');
  if (toolHero) toolHero.classList.add('sr-only');

  // Căn sát lề trái các khối bên dưới cho đồng bộ với vùng làm việc
  const toolContainer = document.getElementById('toolContainer') || document.querySelector('.tool-container');
  if (toolContainer) toolContainer.classList.add('aligned-left');

  // Ẩn upload panel và hiển thị workspace
  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');

  if (uploadPanel) uploadPanel.style.display = 'none';
  if (downloadCard) downloadCard.classList.remove('show');
  if (toolWorkspace) {
    toolWorkspace.classList.add('active');
    toolWorkspace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function selectCompressionLevel(el, level) {
  currentCompressionLevel = level;
  document.querySelectorAll('.ws-radio-box').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

function startCompression() {
  if (!currentPdfFile) return;

  const btn = document.getElementById('btnCompress');
  if (!btn) return;
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang nén file PDF...';

  setTimeout(function() {
    btn.disabled = false;
    btn.innerHTML = originalText;

    // Tính toán giả lập dung lượng sau nén dựa trên mức độ nén
    let ratio = 0.5; // recommended 50%
    if (currentCompressionLevel === 'extreme') ratio = 0.3; // extreme 70%
    if (currentCompressionLevel === 'light') ratio = 0.75; // light 25%

    const origSize = currentPdfFile.size ? (currentPdfFile.size / (1024 * 1024)) : 15.4;
    const newSize = (origSize * ratio).toFixed(1);
    const origSizeFormatted = origSize.toFixed(1);
    const savedPercent = Math.round((1 - ratio) * 100);

    const downloadMeta = document.getElementById('downloadMeta');
    if (downloadMeta) {
      downloadMeta.innerHTML = `Dung lượng đã giảm từ <strong>${origSizeFormatted} MB</strong> xuống còn <strong>${newSize} MB</strong> (tiết kiệm <strong>${savedPercent}%</strong>).`;
    }

    // Chuyển sang màn hình tải file kết quả
    const toolWorkspace = document.getElementById('toolWorkspace');
    const downloadCard = document.getElementById('downloadCard');
    const toolContainer = document.getElementById('toolContainer') || document.querySelector('.tool-container');
    if (toolContainer) toolContainer.classList.remove('aligned-left');
    if (toolWorkspace) toolWorkspace.classList.remove('active');
    if (downloadCard) {
      downloadCard.classList.add('show');
      downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 1200);
}

function downloadCompressedFile() {
  const baseName = currentPdfFile ? currentPdfFile.name.replace(/\.[^/.]+$/, '') : 'tailieu_nen';
  const fileName = baseName + '_nen.pdf';

  if (typeof fakeDownload === 'function') {
    fakeDownload(fileName);
  } else {
    alert('Đã tải xuống file ' + fileName);
  }
}

function resetFileSelection() {
  currentPdfFile = null;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  // Khôi phục hiển thị của phần giới thiệu hero và vị trí căn giữa các div bên dưới
  const toolHero = document.getElementById('toolHero') || document.querySelector('.tool-hero');
  if (toolHero) toolHero.classList.remove('sr-only');

  const toolContainer = document.getElementById('toolContainer') || document.querySelector('.tool-container');
  if (toolContainer) toolContainer.classList.remove('aligned-left');

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');

  if (uploadPanel) uploadPanel.style.display = '';
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (downloadCard) downloadCard.classList.remove('show');
}

function toggleFaqItem(header) {
  const item = header.parentElement;
  if (item) item.classList.toggle('open');
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNenPdfTool);
} else {
  initNenPdfTool();
}
