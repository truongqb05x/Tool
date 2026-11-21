/* =========================================================
   CÔNG CỤ PDF: So sánh PDF - so-sanh-pdf.js
   Logic chuyên biệt: Tiếp nhận 2 file, hiển thị đối chiếu & kết nối API
   ========================================================= */

let selectedFileA = null;
let selectedFileB = null;
let currentDownloadUrl = null;
let currentDownloadName = null;

function initTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length >= 2) {
        handleFilesSelected(this.files[0], this.files[1]);
      } else if (this.files && this.files.length === 1) {
        if (!selectedFileA) {
          selectedFileA = this.files[0];
          alert('Đã chọn Bản A: ' + selectedFileA.name + '. Vui lòng chọn tiếp Bản B (File đối chiếu).');
          fileInput.value = '';
          fileInput.click();
        } else {
          selectedFileB = this.files[0];
          handleFilesSelected(selectedFileA, selectedFileB);
        }
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
      if (e.dataTransfer.files && e.dataTransfer.files.length >= 2) {
        handleFilesSelected(e.dataTransfer.files[0], e.dataTransfer.files[1]);
      } else if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {
        alert('Vui lòng kéo và thả đồng thời 2 file PDF để so sánh đối chiếu.');
      }
    });
  }
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  return (bytes / 1024).toFixed(1) + ' KB';
}

function handleFilesSelected(fileA, fileB) {
  if (!fileA.name.toLowerCase().endsWith('.pdf') || !fileB.name.toLowerCase().endsWith('.pdf')) {
    alert('Cả 2 tài liệu phải có định dạng PDF (.pdf). Vui lòng chọn lại.');
    return;
  }

  selectedFileA = fileA;
  selectedFileB = fileB;

  const nameA = document.getElementById('fileNameA');
  const sizeA = document.getElementById('fileSizeA');
  const nameB = document.getElementById('fileNameB');
  const sizeB = document.getElementById('fileSizeB');

  if (nameA) nameA.textContent = fileA.name;
  if (sizeA) sizeA.textContent = 'Dung lượng: ' + formatFileSize(fileA.size);

  if (nameB) nameB.textContent = fileB.name;
  if (sizeB) sizeB.textContent = 'Dung lượng: ' + formatFileSize(fileB.size);

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
  selectedFileA = null;
  selectedFileB = null;
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
  if (!selectedFileA || !selectedFileB) {
    alert('Vui lòng chọn đủ 2 tệp PDF để so sánh.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đối chiếu văn bản...';
  }

  const formData = new FormData();
  formData.append('file1', selectedFileA);
  formData.append('file2', selectedFileB);

  fetch('/pdf/api/so-sanh-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Bắt đầu so sánh <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' || data.success) {
      currentDownloadUrl = data.download_url;
      currentDownloadName = data.download_name || 'Bao_cao_so_sanh_PDF.pdf';

      const toolWorkspace = document.getElementById('toolWorkspace');
      const downloadCard = document.getElementById('downloadCard');
      const downloadMeta = document.getElementById('downloadMeta');

      const d = data.data || {};
      if (downloadMeta) {
        downloadMeta.innerHTML = `<strong>Tỷ lệ tương đồng: ${d.similarity_ratio || 100}%</strong> · Phát hiện <strong>${d.differences_found || 0} điểm khác biệt</strong> (+${d.total_added || 0} dòng thêm, -${d.total_removed || 0} dòng xóa trên ${d.changed_pages || 0} trang).`;
      }

      if (toolWorkspace) toolWorkspace.classList.remove('active');
      if (downloadCard) {
        downloadCard.classList.add('show');
        downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      alert(data.message || 'Có lỗi xảy ra khi so sánh PDF. Vui lòng thử lại!');
    }
  })
  .catch(err => {
    console.error('Lỗi API compare PDF:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Bắt đầu so sánh <i class="fas fa-arrow-right"></i>';
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
