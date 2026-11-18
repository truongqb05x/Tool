/* =========================================================
   TRANG XỬ LÝ - XULY.JS
   Tùy chọn định dạng, preview và mô phỏng tiến trình chuyển đổi
   ========================================================= */

let selectedFiles = [];

/**
 * Đổi hướng trang giấy (Dọc / Ngang)
 */
function setOrientation(btn) {
  if (!btn || !btn.parentElement) return;
  const btns = btn.parentElement.querySelectorAll('.opt-btn');
  btns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/**
 * Đổi căn lề trang (Không lề / Nhỏ / Lớn)
 */
function setMargin(btn) {
  if (!btn || !btn.parentElement) return;
  const btns = btn.parentElement.querySelectorAll('.opt-btn');
  btns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/**
 * Xử lý khi người dùng chọn thêm file (cập nhật preview và badge)
 */
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  const firstFile = files[0];

  // Cập nhật tên file
  const fileNameEl = document.getElementById('fileName');
  if (fileNameEl) fileNameEl.textContent = firstFile.name;

  // Cập nhật badge đếm số file
  const badge = document.getElementById('fileCountBadge');
  if (badge) {
    const currentCount = parseInt(badge.textContent) || 1;
    badge.textContent = currentCount + files.length - 1;
  }

  // Nếu là ảnh thì hiển thị preview trực tiếp
  const filePreview = document.getElementById('filePreview');
  if (filePreview && firstFile.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      filePreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
    };
    reader.readAsDataURL(firstFile);
  }
}

/**
 * Xóa file và trả giao diện về khung giấy mặc định
 */
function removeFile() {
  const fileInput = document.getElementById('fileInput');
  const fileNameEl = document.getElementById('fileName');
  const badge = document.getElementById('fileCountBadge');
  const filePreview = document.getElementById('filePreview');

  if (fileInput) fileInput.value = '';
  if (fileNameEl) fileNameEl.textContent = '4758f49c82ec4c9ab6759056a...';
  if (badge) badge.textContent = '1';

  if (filePreview) {
    filePreview.innerHTML = `
      <div class="paper-mockup">
        <div class="line title"></div>
        <div class="line"></div>
        <div class="line short"></div>
        <div class="line"></div>
        <div class="line block"></div>
        <div class="line"></div>
        <div class="line short"></div>
      </div>
    `;
  }
}

/**
 * Xử lý tiến trình chuyển đổi (mô phỏng)
 */
function startConvert() {
  const btn = document.getElementById('btnConvert');
  if (!btn) return;
  const originalHtml = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    alert('Tạo file PDF thành công!\n(Đây là giao diện mô phỏng xử lý)');
  }, 1500);
}

/**
 * Khởi tạo dữ liệu file từ phiên trước đó
 */
function initXuly() {
  const saved = sessionStorage.getItem('toolhub_selected_file_name');
  if (saved) {
    const fileNameEl = document.getElementById('fileName');
    if (fileNameEl) fileNameEl.textContent = saved;
  }
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initXuly);
} else {
  initXuly();
}
