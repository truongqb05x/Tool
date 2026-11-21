/* =========================================================
   TIỆN ÍCH DÙNG CHUNG - HELPERS.JS
   Các hàm hỗ trợ chuỗi, mã hóa an toàn và tải file mẫu
   ========================================================= */

/**
 * Chuẩn hóa tiếng Việt bỏ dấu (hỗ trợ tìm kiếm & so khớp)
 */
function removeDiacritics(str) {
  if (!str) return '';
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
}

/**
 * Thoát các ký tự đặc biệt trong HTML để chống XSS
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/**
 * Đóng mở các mục câu hỏi thường gặp (FAQ Accordion)
 */
function toggleFaqItem(el) {
  if (!el) return;
  const item = el.closest('.tool-faq-item');
  if (item) {
    item.classList.toggle('open');
  }
}

/**
 * Tải xuống file văn bản giả lập minh họa tính năng
 */
function fakeDownload(filename) {
  const content = 'ToolHub demo download\nFile: ' + filename + '\nThời gian: ' + new Date().toLocaleString('vi-VN');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (filename || 'toolhub-output') + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() {
    URL.revokeObjectURL(url);
  }, 1000);
}
