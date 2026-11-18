/* =========================================================
   CÔNG CỤ TẠO MÃ QR - TAO-MA-QR.JS
   Logic chuyên biệt: Chuyển đổi văn bản/URL thành mã QR, tùy biến màu sắc
   ========================================================= */

let currentQrColor = '#000000';

function initTaoMaQrTool() {
  const contentInput = document.getElementById('qrContent');
  if (contentInput) {
    contentInput.addEventListener('input', function() {
      generateQrCode();
    });
  }
}

function setQrColor(btn, color) {
  currentQrColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.style.borderColor = 'transparent');
  btn.style.borderColor = '#1e5b9c';

  const path = document.getElementById('qrPath');
  if (path) {
    path.setAttribute('fill', color);
  }
}

function generateQrCode() {
  const input = document.getElementById('qrContent');
  if (!input) return;
  const val = input.value.trim();

  const path = document.getElementById('qrPath');
  if (path) {
    path.setAttribute('fill', currentQrColor);
  }
}

function downloadQrImage() {
  const input = document.getElementById('qrContent');
  const text = input ? input.value.trim() : 'toolhub';
  const fileName = 'qrcode_' + (text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) || 'demo') + '.png';

  if (typeof fakeDownload === 'function') {
    fakeDownload(fileName.replace('.png', ''));
  } else {
    alert('Đã tải xuống mã QR: ' + fileName);
  }
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTaoMaQrTool);
} else {
  initTaoMaQrTool();
}
