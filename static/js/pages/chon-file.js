/* =========================================================
   TRANG CHỌN FILE - CHON-FILE.JS
   Cấu hình công cụ, kéo thả file và chuyển sang trang xử lý
   ========================================================= */

const TOOLS = {
  'nen-pdf': {
    title: 'Nén PDF',
    desc: 'Giảm dung lượng file PDF mà vẫn giữ chất lượng tốt nhất.',
    icon: 'fa-compress-alt',
    accept: '.pdf,application/pdf',
    acceptText: 'Hỗ trợ: PDF · Tối đa 50 MB'
  },
  'gop-pdf': {
    title: 'Gộp nhiều PDF',
    desc: 'Kết hợp nhiều file PDF thành một tài liệu duy nhất.',
    icon: 'fa-object-group',
    accept: '.pdf,application/pdf',
    acceptText: 'Hỗ trợ: PDF · Tối đa 50 MB'
  },
  'pdf-sang-word': {
    title: 'Chuyển PDF sang Word',
    desc: 'Chuyển đổi PDF sang DOCX có thể chỉnh sửa.',
    icon: 'fa-file-signature',
    accept: '.pdf,application/pdf',
    acceptText: 'Hỗ trợ: PDF · Tối đa 50 MB'
  },
  'ghep-anh': {
    title: 'Ghép ảnh',
    desc: 'Ghép nhiều ảnh thành một bức ảnh lớn theo bố cục.',
    icon: 'fa-images',
    accept: 'image/*',
    acceptText: 'Hỗ trợ: JPG, PNG, GIF · Tối đa 20 MB'
  },
  'xoa-phong-nen': {
    title: 'Xóa phông nền',
    desc: 'Tự động tách nền ảnh chỉ trong vài giây.',
    icon: 'fa-magic',
    accept: 'image/*',
    acceptText: 'Hỗ trợ: JPG, PNG · Tối đa 20 MB'
  },
  'tao-ma-qr': {
    title: 'Tạo mã QR',
    desc: 'Tạo mã QR cho văn bản, URL, email và nhiều hơn nữa.',
    icon: 'fa-qrcode',
    accept: 'image/*',
    acceptText: 'Hỗ trợ: ảnh logo để chèn vào QR · Tối đa 5 MB'
  }
};

let currentToolKey = 'nen-pdf';
let selectedFile = null;

function applyToolConfig(key) {
  const tool = TOOLS[key];
  if (!tool) return;

  // Cập nhật banner công cụ
  const toolIcon = document.getElementById('toolIcon');
  const toolTitle = document.getElementById('toolTitle');
  const toolDesc = document.getElementById('toolDesc');
  const fileInput = document.getElementById('fileInput');
  const dzNote = document.getElementById('dzNote');

  if (toolIcon) toolIcon.className = 'fas ' + tool.icon;
  if (toolTitle) toolTitle.textContent = tool.title;
  if (toolDesc) toolDesc.textContent = tool.desc;

  // Cập nhật vùng chọn file
  if (fileInput) fileInput.setAttribute('accept', tool.accept);
  if (dzNote) dzNote.textContent = tool.acceptText;
}

function handleFileSelected(file) {
  selectedFile = file;
  try {
    sessionStorage.setItem('toolhub_selected_file_name', file.name);
  } catch (err) {}

  // Chuyển trực tiếp sang trang xử lý kèm tool key
  window.location.href = 'xuly.html?tool=' + encodeURIComponent(currentToolKey);
}

function resetAll() {
  selectedFile = null;
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
}

function initChonFile() {
  // Đọc tham số ?tool=... từ URL
  const params = new URLSearchParams(window.location.search);
  const toolParam = params.get('tool');
  if (toolParam && TOOLS[toolParam]) {
    currentToolKey = toolParam;
  }
  applyToolConfig(currentToolKey);

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
    // Kéo thả file
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

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChonFile);
} else {
  initChonFile();
}
