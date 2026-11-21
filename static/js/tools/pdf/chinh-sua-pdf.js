/* =========================================================
   CÔNG CỤ PDF: Chỉnh sửa PDF - chinh-sua-pdf.js
   Logic chuyên biệt: Xử lý chọn file, workspace & kết nối API backend thật
   ========================================================= */

let currentSelectedFile = null;
let currentDownloadUrl = null;
let currentDownloadName = null;
let currentEditType = 'text';

function selectEditType(element, type) {
  currentEditType = type;
  document.querySelectorAll('.ws-radio-box').forEach(el => el.classList.remove('selected'));
  if (element) {
    element.classList.add('selected');
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }

  const groupPos = document.getElementById('groupPosition');
  const contentInput = document.getElementById('editContentInput');

  if (type === 'stamp') {
    if (groupPos) groupPos.style.display = 'none';
    if (contentInput && (!contentInput.value || contentInput.value.includes('đã duyệt bởi'))) {
      contentInput.value = 'APPROVED - ĐÃ DUYỆT';
    }
  } else if (type === 'header_footer') {
    if (groupPos) groupPos.style.display = 'none';
    if (contentInput && (!contentInput.value || contentInput.value.includes('APPROVED'))) {
      contentInput.value = 'Tài liệu lưu hành nội bộ - ToolHub';
    }
  } else {
    if (groupPos) groupPos.style.display = 'block';
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
    alert('Vui lòng chọn 1 tệp PDF để chỉnh sửa.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chỉnh sửa PDF...';
  }

  const textVal = document.getElementById('editContentInput') ? document.getElementById('editContentInput').value : '';
  const posVal = document.getElementById('editPositionSelect') ? document.getElementById('editPositionSelect').value : 'bottom';
  const colorVal = document.getElementById('editColorSelect') ? document.getElementById('editColorSelect').value : '#e74c3c';
  const fontSizeVal = document.getElementById('editFontSizeSelect') ? document.getElementById('editFontSizeSelect').value : '14';
  const pageScopeVal = document.getElementById('editPageScopeSelect') ? document.getElementById('editPageScopeSelect').value : 'all';

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('edit_type', currentEditType);
  formData.append('text', textVal);
  formData.append('position', posVal);
  formData.append('color_hex', colorVal);
  formData.append('font_size', fontSizeVal);
  formData.append('page_scope', pageScopeVal);

  fetch('/pdf/api/chinh-sua-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Lưu file PDF đã sửa <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' || data.success) {
      currentDownloadUrl = data.download_url;
      currentDownloadName = data.download_name || 'tai_lieu_edited.pdf';

      const toolWorkspace = document.getElementById('toolWorkspace');
      const downloadCard = document.getElementById('downloadCard');
      const downloadMeta = document.getElementById('downloadMeta');

      if (downloadMeta) {
        downloadMeta.textContent = `Tài liệu (${data.data?.edited_pages || 1} trang được chỉnh sửa) đã sẵn sàng tải về.`;
      }

      if (toolWorkspace) toolWorkspace.classList.remove('active');
      if (downloadCard) {
        downloadCard.classList.add('show');
        downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      alert(data.message || 'Có lỗi xảy ra khi chỉnh sửa PDF. Vui lòng thử lại!');
    }
  })
  .catch(err => {
    console.error('Lỗi API edit PDF:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Lưu file PDF đã sửa <i class="fas fa-arrow-right"></i>';
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
