/* =========================================================
   CÔNG CỤ PDF: Đọc thông tin PDF - doc-thong-tin-pdf.js
   Logic chuyên biệt: Xử lý file, trích xuất & hiển thị Metadata dạng bảng
   ========================================================= */

let currentSelectedFile = null;
let currentDownloadUrl = null;
let currentDownloadName = null;

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

  const tableDiv = document.getElementById('metadataDisplayTable');
  if (tableDiv) tableDiv.innerHTML = '';

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

function renderMetadataTable(meta) {
  const container = document.getElementById('metadataDisplayTable');
  if (!container) return;

  const items = [
    { label: 'Tiêu đề tài liệu', value: meta.title, icon: 'fas fa-heading' },
    { label: 'Tác giả (Author)', value: meta.author, icon: 'fas fa-user-edit' },
    { label: 'Tổng số trang', value: `${meta.total_pages || 0} trang`, icon: 'fas fa-copy' },
    { label: 'Khổ giấy chuẩn', value: meta.page_format || 'Khổ tùy chỉnh', icon: 'fas fa-ruler-combined' },
    { label: 'Kích thước điểm ảnh', value: `${meta.page_width || 0} x ${meta.page_height || 0} points`, icon: 'fas fa-vector-square' },
    { label: 'Dung lượng tệp', value: meta.file_size_formatted || '0 KB', icon: 'fas fa-hdd' },
    { label: 'Phần mềm tạo (Creator)', value: meta.creator, icon: 'fas fa-laptop-code' },
    { label: 'Phần mềm đóng gói (Producer)', value: meta.producer, icon: 'fas fa-cogs' },
    { label: 'Ngày khởi tạo', value: meta.creation_date, icon: 'fas fa-calendar-plus' },
    { label: 'Ngày sửa đổi cuối', value: meta.mod_date, icon: 'fas fa-calendar-check' },
    { label: 'Mã hóa / Mật khẩu bảo vệ', value: meta.is_encrypted ? 'Có (Được bảo vệ mật khẩu)' : 'Không (Tài liệu mở)', icon: 'fas fa-shield-alt' }
  ];

  let html = `
    <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
      <tbody>
  `;

  items.forEach((item, index) => {
    const bg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
    html += `
      <tr style="background:${bg}; border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 14px; font-weight:600; color:#334155; width:35%;">
          <i class="${item.icon}" style="color:#1e5b9c; width:18px; margin-right:6px;"></i> ${item.label}
        </td>
        <td style="padding:10px 14px; color:#0f172a; word-break:break-all;">
          ${item.value || '<span style="color:#94a3b8; font-style:italic;">Không có thông tin</span>'}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

function executeToolAction() {
  if (!currentSelectedFile) {
    alert('Vui lòng chọn 1 tệp PDF để đọc siêu dữ liệu.');
    return;
  }

  const btn = document.getElementById('btnExecute');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang trích xuất Metadata...';
  }

  const formData = new FormData();
  formData.append('file', currentSelectedFile);

  fetch('/pdf/api/doc-thong-tin-pdf', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Đọc thông tin metadata <i class="fas fa-arrow-right"></i>';
    }

    if (data.status === 'success' || data.success) {
      currentDownloadUrl = data.download_url;
      currentDownloadName = data.download_name || 'tai_lieu_metadata.json';

      renderMetadataTable(data.data || {});

      const toolWorkspace = document.getElementById('toolWorkspace');
      const downloadCard = document.getElementById('downloadCard');
      const downloadMeta = document.getElementById('downloadMeta');

      if (downloadMeta) {
        downloadMeta.textContent = `Tài liệu "${currentSelectedFile.name}" đã được phân tích cấu trúc metadata thành công.`;
      }

      if (toolWorkspace) toolWorkspace.classList.remove('active');
      if (downloadCard) {
        downloadCard.classList.add('show');
        downloadCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      alert(data.message || 'Có lỗi xảy ra khi đọc thông tin PDF. Vui lòng thử lại!');
    }
  })
  .catch(err => {
    console.error('Lỗi API metadata PDF:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Đọc thông tin metadata <i class="fas fa-arrow-right"></i>';
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
