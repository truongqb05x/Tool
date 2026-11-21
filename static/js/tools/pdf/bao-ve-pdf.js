/* =========================================================
   CÔNG CỤ PDF: BẢO VỆ PDF BẰNG MẬT KHẨU - BAO-VE-PDF.JS
   Hỗ trợ cài đặt mật khẩu mã hóa AES-256 an toàn,
   đánh giá độ mạnh mật khẩu thời gian thực, ẩn/hiện mật khẩu
   ========================================================= */

let currentSelectedFile = null;
let currentTotalPages = 1;
let currentDownloadUrl = null;
let currentDownloadFilename = null;

document.addEventListener('DOMContentLoaded', function() {
  initTool();
});

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

/**
 * Xử lý khi người dùng chọn file PDF
 */
function handleFileSelected(file) {
  if (!file) return;

  const fileNameLower = file.name.toLowerCase();
  if (!fileNameLower.endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Vui lòng chỉ chọn 1 tệp tài liệu định dạng PDF (.pdf).');
    return;
  }

  currentSelectedFile = file;
  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const displaySize = file.size >= 1024 * 1024 ? sizeMb + ' MB' : sizeKb + ' KB';

  const nameEl = document.getElementById('selectedFileName');
  const summaryNameEl = document.getElementById('summaryFileName');
  const sizeEl = document.getElementById('selectedFileSize');

  if (nameEl) nameEl.textContent = file.name;
  if (summaryNameEl) summaryNameEl.textContent = file.name;
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

  // Render thumbnail trang đầu tiên
  if (typeof renderPdfFirstPageThumbnail === 'function') {
    renderPdfFirstPageThumbnail(file, 'filePreview');
  }

  // Đọc tổng số trang bằng PDF.js
  if (typeof pdfjsLib !== 'undefined') {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
        currentTotalPages = pdf.numPages;
        const totalEl = document.getElementById('totalPagesOrig');
        if (totalEl) totalEl.textContent = `${currentTotalPages} trang`;
      }).catch(function() {
        currentTotalPages = 1;
      });
    };
    reader.readAsArrayBuffer(file);
  }
}

/**
 * Kiểm tra và đánh giá độ mạnh của mật khẩu
 */
function onPasswordInput() {
  const pwInput = document.getElementById('inputUserPassword');
  const confirmInput = document.getElementById('inputConfirmPassword');
  const matchError = document.getElementById('passwordMatchError');
  const strengthWrap = document.getElementById('passwordStrengthWrap');
  const strengthBar = document.getElementById('passwordStrengthBar');
  const strengthLabel = document.getElementById('passwordStrengthLabel');

  const pw = pwInput ? pwInput.value : '';
  const confirm = confirmInput ? confirmInput.value : '';

  // Đánh giá độ mạnh
  if (pw.length > 0) {
    if (strengthWrap) strengthWrap.style.display = 'block';

    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) {
      if (strengthBar) {
        strengthBar.style.width = '25%';
        strengthBar.style.background = '#ef4444';
      }
      if (strengthLabel) {
        strengthLabel.textContent = 'Yếu';
        strengthLabel.style.color = '#ef4444';
      }
    } else if (score <= 3) {
      if (strengthBar) {
        strengthBar.style.width = '60%';
        strengthBar.style.background = '#f59e0b';
      }
      if (strengthLabel) {
        strengthLabel.textContent = 'Trung bình';
        strengthLabel.style.color = '#f59e0b';
      }
    } else {
      if (strengthBar) {
        strengthBar.style.width = '100%';
        strengthBar.style.background = '#10b981';
      }
      if (strengthLabel) {
        strengthLabel.textContent = 'Mạnh & An toàn';
        strengthLabel.style.color = '#10b981';
      }
    }
  } else {
    if (strengthWrap) strengthWrap.style.display = 'none';
  }

  // Kiểm tra trùng khớp
  if (confirm.length > 0) {
    if (pw !== confirm) {
      if (matchError) matchError.style.display = 'block';
    } else {
      if (matchError) matchError.style.display = 'none';
    }
  } else {
    if (matchError) matchError.style.display = 'none';
  }
}

/**
 * Ẩn / hiện mật khẩu
 */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const icon = btn ? btn.querySelector('i') : null;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

/**
 * Gửi yêu cầu cài mật khẩu lên API Backend
 */
function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp tài liệu PDF để thực hiện.');
    return;
  }

  const pwInput = document.getElementById('inputUserPassword');
  const confirmInput = document.getElementById('inputConfirmPassword');

  const pw = pwInput ? pwInput.value.trim() : '';
  const confirm = confirmInput ? confirmInput.value.trim() : '';

  if (!pw) {
    alert('Vui lòng nhập mật khẩu bảo vệ cho tài liệu.');
    if (pwInput) pwInput.focus();
    return;
  }

  if (confirm && pw !== confirm) {
    alert('Mật khẩu xác nhận không trùng khớp. Vui lòng kiểm tra lại.');
    if (confirmInput) confirmInput.focus();
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang mã hóa tài liệu...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);
  formData.append('password', pw);

  fetch('/pdf/api/bao-ve-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock" style="margin-right:6px;"></i> Đặt mật khẩu bảo vệ ngay';
    }

    if (data.status === 'success' && data.data) {
      currentDownloadUrl = data.data.download_url;
      currentDownloadFilename = data.data.download_name;

      const metaEl = document.getElementById('downloadMeta');
      if (metaEl) {
        metaEl.innerHTML = `Tài liệu gồm <strong>${data.data.total_pages} trang</strong> đã được mã hóa an toàn bằng tiêu chuẩn <strong>AES 256-bit</strong>. Dung lượng hoàn tất: <strong>${data.data.result_size_formatted}</strong>.`;
      }

      const saveNotice = document.getElementById('saveAccountNotice');
      if (saveNotice) {
        if (data.data.saved_in_account) {
          saveNotice.style.display = 'block';
          saveNotice.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981; margin-right:6px;"></i> Tệp đã được tự động lưu vào danh sách tệp tài khoản của bạn!';
        } else {
          saveNotice.style.display = 'none';
        }
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
    } else {
      alert(data.message || 'Đã có lỗi xảy ra trong quá trình cài mật khẩu.');
    }
  })
  .catch(err => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock" style="margin-right:6px;"></i> Đặt mật khẩu bảo vệ ngay';
    }
    console.error('Lỗi API bảo vệ PDF:', err);
    alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  });
}

/**
 * Tải file kết quả về máy tính/thiết bị
 */
function downloadResultFile() {
  if (currentDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentDownloadUrl;
    if (currentDownloadFilename) a.download = currentDownloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Không tìm thấy đường dẫn tải về. Vui lòng thử lại.');
  }
}

/**
 * Đặt lại trạng thái để chọn file khác
 */
function resetFileSelection() {
  currentSelectedFile = null;
  currentDownloadUrl = null;
  currentDownloadFilename = null;

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const pwInput = document.getElementById('inputUserPassword');
  if (pwInput) pwInput.value = '';

  const confirmInput = document.getElementById('inputConfirmPassword');
  if (confirmInput) confirmInput.value = '';

  const strengthWrap = document.getElementById('passwordStrengthWrap');
  if (strengthWrap) strengthWrap.style.display = 'none';

  const matchError = document.getElementById('passwordMatchError');
  if (matchError) matchError.style.display = 'none';

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
