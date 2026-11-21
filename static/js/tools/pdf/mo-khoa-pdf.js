/* =========================================================
   CÔNG CỤ PDF: Mở khóa PDF - mo-khoa-pdf.js
   Logic: Xử lý gỡ bỏ mật khẩu và hạn chế quyền tài liệu PDF
   ========================================================= */

let currentSelectedFile = null;
let unlockedDownloadUrl = null;
let unlockedFileName = null;

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
  unlockedDownloadUrl = null;
  unlockedFileName = null;

  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  const summaryNameEl = document.getElementById('summaryFileName');

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = 'Dung lượng: ' + displaySize;
  if (summaryNameEl) summaryNameEl.textContent = file.name;

  // Reset ô nhập mật khẩu
  const pwInput = document.getElementById('pdfPassword');
  if (pwInput) pwInput.value = '';

  const confirmCheck = document.getElementById('confirmOwner');
  if (confirmCheck) confirmCheck.checked = false;

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

function togglePasswordVisibility() {
  const pwInput = document.getElementById('pdfPassword');
  const icon = document.getElementById('togglePasswordIcon');
  if (!pwInput || !icon) return;

  if (pwInput.type === 'password') {
    pwInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    pwInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

async function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn một file PDF trước!');
    return;
  }

  const confirmCheck = document.getElementById('confirmOwner');
  if (confirmCheck && !confirmCheck.checked) {
    alert('Vui lòng tích xác nhận bạn là chủ sở hữu hoặc có quyền hợp pháp để mở khóa tệp PDF này.');
    confirmCheck.focus();
    return;
  }

  const pwInput = document.getElementById('pdfPassword');
  const password = pwInput ? pwInput.value : '';

  const btn = document.getElementById('btnExecute');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Đang giải mã và mở khóa...';
  }

  try {
    const formData = new FormData();
    formData.append('file', currentSelectedFile);
    formData.append('password', password);

    const response = await fetch('/pdf/api/mo-khoa-pdf', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || 'Mở khóa file PDF thất bại. Vui lòng kiểm tra lại mật khẩu!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
      return;
    }

    // Mở khóa thành công
    unlockedDownloadUrl = result.download_url;
    unlockedFileName = result.filename || (currentSelectedFile.name.replace(/\.pdf$/i, '') + '_unlocked.pdf');

    // Lưu vào lịch sử xử lý gần đây nếu có hàm
    if (typeof saveRecentFile === 'function') {
      saveRecentFile({
        name: unlockedFileName,
        url: unlockedDownloadUrl,
        tool: 'mo-khoa-pdf',
        date: new Date().toISOString()
      });
    }

    const toolWorkspace = document.getElementById('toolWorkspace');
    const downloadCard = document.getElementById('downloadCard');
    const toolContainer = document.getElementById('toolContainer');
    const downloadMeta = document.getElementById('downloadMeta');

    if (downloadMeta) {
      downloadMeta.textContent = `Tài liệu "${unlockedFileName}" đã được loại bỏ hoàn toàn mật khẩu và sẵn sàng tải về.`;
    }

    if (toolContainer) toolContainer.classList.add('aligned-left');
    if (toolWorkspace) toolWorkspace.classList.remove('active');
    if (downloadCard) {
      downloadCard.classList.add('show');
      downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

  } catch (err) {
    console.error('Lỗi khi mở khóa PDF:', err);
    alert('Có lỗi kết nối máy chủ khi mở khóa tệp PDF. Vui lòng thử lại!');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

function downloadResultFile() {
  if (unlockedDownloadUrl) {
    const a = document.createElement('a');
    a.href = unlockedDownloadUrl;
    a.download = unlockedFileName || 'tai_lieu_unlocked.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy liên kết tải về. Vui lòng thực hiện lại!');
  }
}

function resetFileSelection() {
  currentSelectedFile = null;
  unlockedDownloadUrl = null;
  unlockedFileName = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const pwInput = document.getElementById('pdfPassword');
  if (pwInput) pwInput.value = '';

  const confirmCheck = document.getElementById('confirmOwner');
  if (confirmCheck) confirmCheck.checked = false;

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
