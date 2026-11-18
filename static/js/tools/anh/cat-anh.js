/* =========================================================
   CÔNG CỤ CẮT & XOAY ẢNH - CAT-ANH.JS
   Logic chuyên biệt: Xem trước ảnh, xoay góc 90 độ, chọn tỉ lệ khung hình
   ========================================================= */

let currentImageFile = null;
let currentRotation = 0;
let currentRatio = 'free';

function initCatAnhTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        handleImageSelected(this.files[0]);
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
        handleImageSelected(e.dataTransfer.files[0]);
      }
    });
  }
}

function handleImageSelected(file) {
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn tệp định dạng hình ảnh (JPG, PNG, WEBP, GIF).');
    return;
  }

  currentImageFile = file;
  currentRotation = 0;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('imagePreview');
    if (img) {
      img.src = e.target.result;
      img.style.transform = 'rotate(0deg)';
      img.onload = function() {
        const dimEl = document.getElementById('imageDimensions');
        if (dimEl) dimEl.textContent = `Kích thước gốc: ${this.naturalWidth} × ${this.naturalHeight} px`;
      };
    }

    const uploadPanel = document.getElementById('uploadPanel');
    const toolWorkspace = document.getElementById('toolWorkspace');
    const downloadCard = document.getElementById('downloadCard');

    if (uploadPanel) uploadPanel.style.display = 'none';
    if (downloadCard) downloadCard.classList.remove('show');
    if (toolWorkspace) {
      toolWorkspace.classList.add('active');
      toolWorkspace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  reader.readAsDataURL(file);
}

function setAspectRatio(btn, ratio) {
  currentRatio = ratio;
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function rotateImage(deg) {
  currentRotation = (currentRotation + deg) % 360;
  const img = document.getElementById('imagePreview');
  if (img) {
    img.style.transform = `rotate(${currentRotation}deg)`;
  }
}

function executeCrop() {
  if (!currentImageFile) return;

  const btn = document.getElementById('btnCrop');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý ảnh...';

  setTimeout(function() {
    btn.disabled = false;
    btn.innerHTML = originalHtml;

    const downloadMeta = document.getElementById('downloadMeta');
    if (downloadMeta) {
      downloadMeta.innerHTML = `Đã cắt theo tỉ lệ <strong>${currentRatio.toUpperCase()}</strong> và xoay góc <strong>${currentRotation}°</strong> thành công.`;
    }

    const toolWorkspace = document.getElementById('toolWorkspace');
    const downloadCard = document.getElementById('downloadCard');
    if (toolWorkspace) toolWorkspace.classList.remove('active');
    if (downloadCard) {
      downloadCard.classList.add('show');
      downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 1000);
}

function downloadCroppedImage() {
  const baseName = currentImageFile ? currentImageFile.name.replace(/\.[^/.]+$/, '') : 'anh_da_cat';
  const fileName = baseName + '_crop.png';

  if (typeof fakeDownload === 'function') {
    fakeDownload(fileName.replace('.png', ''));
  } else {
    alert('Đã tải xuống ' + fileName);
  }
}

function resetImageSelection() {
  currentImageFile = null;
  currentRotation = 0;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const uploadPanel = document.getElementById('uploadPanel');
  const toolWorkspace = document.getElementById('toolWorkspace');
  const downloadCard = document.getElementById('downloadCard');

  if (uploadPanel) uploadPanel.style.display = '';
  if (toolWorkspace) toolWorkspace.classList.remove('active');
  if (downloadCard) downloadCard.classList.remove('show');
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCatAnhTool);
} else {
  initCatAnhTool();
}
