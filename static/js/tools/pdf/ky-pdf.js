/* =========================================================
   CÔNG CỤ PDF: Ký PDF - ky-pdf.js
   Logic chuyên biệt: Vẽ chữ ký Canvas, tải ảnh chữ ký & kết nối API
   ========================================================= */

let currentSelectedFile = null;
let currentDownloadUrl = null;
let currentDownloadName = null;
let currentSigType = 'draw';

// Canvas drawing state
let canvas = null;
let ctx = null;
let isDrawing = false;
let hasDrawn = false;

function initCanvas() {
  canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startDraw(e) {
    isDrawing = true;
    hasDrawn = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function drawMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    isDrawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', drawMove);
  window.addEventListener('mouseup', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', drawMove, { passive: false });
  window.addEventListener('touchend', endDraw);
}

function clearSignatureCanvas() {
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
  }
}

function selectSignatureType(element, type) {
  currentSigType = type;
  document.querySelectorAll('.ws-radio-box').forEach(el => el.classList.remove('selected'));
  if (element) {
    element.classList.add('selected');
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }

  const canvasWrap = document.getElementById('canvasWrap');
  const imageWrap = document.getElementById('imageSigWrap');

  if (type === 'draw') {
    if (canvasWrap) canvasWrap.style.display = 'block';
    if (imageWrap) imageWrap.style.display = 'none';
  } else if (type === 'image') {
    if (canvasWrap) canvasWrap.style.display = 'none';
    if (imageWrap) imageWrap.style.display = 'block';
  } else {
    if (canvasWrap) canvasWrap.style.display = 'none';
    if (imageWrap) imageWrap.style.display = 'none';
  }
}

function initTool() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const dateInput = document.getElementById('signDateInput');

  if (dateInput && !dateInput.value) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    dateInput.value = `${dd}/${mm}/${yyyy}`;
  }

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

  initCanvas();
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
  clearSignatureCanvas();

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const sigImageInput = document.getElementById('sigImageInput');
  if (sigImageInput) sigImageInput.value = '';

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
    alert('Vui lòng chọn 1 tệp PDF để ký.');
    return;
  }

  const signName = document.getElementById('signNameInput') ? document.getElementById('signNameInput').value.trim() : '';
  const position = document.getElementById('sigPositionSelect') ? document.getElementById('sigPositionSelect').value : 'bottom-right';
  const pageTarget = document.getElementById('sigPageTargetSelect') ? document.getElementById('sigPageTargetSelect').value : 'last';
  const signDate = document.getElementById('signDateInput') ? document.getElementById('signDateInput').value.trim() : '';

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('signature_type', currentSigType);
  formData.append('sign_name', signName);
  formData.append('position', position);
  formData.append('page_target', pageTarget);
  formData.append('sign_date', signDate);

  if (currentSigType === 'draw') {
    if (hasDrawn && canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      formData.append('signature_base64', dataUrl);
    }
  } else if (currentSigType === 'image') {
    const imgInput = document.getElementById('sigImageInput');
    if (imgInput && imgInput.files && imgInput.files[0]) {
      formData.append('signature_image', imgInput.files[0]);
    }
  }

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chèn chữ ký...';
  }

  fetch('/pdf/api/ky-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Hoàn tất chữ ký <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' || data.success) {
      currentDownloadUrl = data.download_url;
      currentDownloadName = data.download_name || 'tai_lieu_signed.pdf';

      const toolWorkspace = document.getElementById('toolWorkspace');
      const downloadCard = document.getElementById('downloadCard');
      const downloadMeta = document.getElementById('downloadMeta');

      if (downloadMeta) {
        downloadMeta.textContent = `Tài liệu đã được ký xác nhận bởi "${data.data?.sign_name || signName}" thành công.`;
      }

      if (toolWorkspace) toolWorkspace.classList.remove('active');
      if (downloadCard) {
        downloadCard.classList.add('show');
        downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      alert(data.message || 'Có lỗi xảy ra khi ký PDF. Vui lòng thử lại!');
    }
  })
  .catch(err => {
    console.error('Lỗi API sign PDF:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Hoàn tất chữ ký <i class="fas fa-arrow-right"></i>';
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
