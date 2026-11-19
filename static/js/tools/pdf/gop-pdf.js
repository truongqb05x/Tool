/* =========================================================
   CÔNG CỤ GỘP PDF - GOP-PDF.JS
   Logic chuyên biệt: Quản lý danh sách nhiều file, sắp xếp thứ tự và nối ghép
   ========================================================= */

let selectedPdfFiles = [];

function initGopPdfTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length) {
        addFilesToList(Array.from(this.files));
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
        addFilesToList(Array.from(e.dataTransfer.files));
      }
    });
  }
}

function addFilesToList(files) {
  const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
  if (!pdfFiles.length) {
    alert('Vui lòng chọn các tệp định dạng PDF.');
    return;
  }

  selectedPdfFiles = selectedPdfFiles.concat(pdfFiles);
  renderFileList();

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

function renderFileList() {
  const container = document.getElementById('fileListContainer');
  const countText = document.getElementById('fileCountText');
  if (countText) countText.textContent = selectedPdfFiles.length;
  if (!container) return;

  if (selectedPdfFiles.length === 0) {
    resetMergeSelection();
    return;
  }

  let html = '';
  selectedPdfFiles.forEach((file, index) => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    html += `
      <div class="selected-file-card">
        <div class="sfc-icon"><i class="fas fa-file-pdf"></i></div>
        <div class="sfc-body">
          <div class="sfc-name"><strong>#${index + 1}</strong> ${escapeHtml(file.name)}</div>
          <div class="sfc-meta">${sizeMb} MB</div>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
          <button type="button" class="sfc-remove" onclick="moveFileOrder(${index}, -1)" title="Di chuyển lên" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="fas fa-arrow-up"></i>
          </button>
          <button type="button" class="sfc-remove" onclick="moveFileOrder(${index}, 1)" title="Di chuyển xuống" ${index === selectedPdfFiles.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="fas fa-arrow-down"></i>
          </button>
          <button type="button" class="sfc-remove" onclick="removeFileFromList(${index})" title="Xóa file">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function moveFileOrder(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= selectedPdfFiles.length) return;

  const temp = selectedPdfFiles[index];
  selectedPdfFiles[index] = selectedPdfFiles[newIndex];
  selectedPdfFiles[newIndex] = temp;
  renderFileList();
}

function removeFileFromList(index) {
  selectedPdfFiles.splice(index, 1);
  renderFileList();
}

function startMergePdf() {
  if (selectedPdfFiles.length < 2) {
    alert('Vui lòng chọn ít nhất 2 file PDF để thực hiện ghép nối.');
    return;
  }

  const btn = document.getElementById('btnMerge');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gộp các trang PDF...';

  setTimeout(function() {
    btn.disabled = false;
    btn.innerHTML = originalHtml;

    const totalSize = selectedPdfFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    const totalMb = (totalSize / (1024 * 1024)).toFixed(1);

    const downloadMeta = document.getElementById('downloadMeta');
    if (downloadMeta) {
      downloadMeta.innerHTML = `Đã kết hợp <strong>${selectedPdfFiles.length} file PDF</strong> thành công (tổng dung lượng ~<strong>${totalMb} MB</strong>).`;
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
  }, 1400);
}

function downloadMergedFile() {
  const nameInput = document.getElementById('outputFileName');
  let filename = nameInput ? nameInput.value.trim() : 'tailieu_da_gop.pdf';
  if (!filename.endsWith('.pdf')) filename += '.pdf';

  if (typeof fakeDownload === 'function') {
    fakeDownload(filename.replace('.pdf', ''));
  } else {
    alert('Đã tải xuống file ' + filename);
  }
}

function resetMergeSelection() {
  selectedPdfFiles = [];
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');

  const toolHero = document.getElementById('toolHero');
  const toolContainer = document.getElementById('toolContainer');
  if (toolHero) toolHero.classList.remove('sr-only');
  if (toolContainer) toolContainer.classList.remove('aligned-left');
  if (uploadPanel) uploadPanel.style.display = '';
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (downloadCard) downloadCard.classList.remove('show');
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGopPdfTool);
} else {
  initGopPdfTool();
}
