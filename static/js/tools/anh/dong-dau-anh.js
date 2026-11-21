/* =========================================================
   CÔNG CỤ ĐÓNG DẤU BẢN QUYỀN ẢNH - DONG-DAU-ANH.JS
   Logic chuyên biệt: Vị trí đóng dấu, nội dung chữ, độ trong suốt Opacity
   ========================================================= */

currentToolSlug = 'dong-dau-anh';
let currentWatermarkPos = 'bottom-right';

function setWmPos(btn, pos) {
  currentWatermarkPos = pos;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để đóng dấu bản quyền.');
    return;
  }

  const textInput = document.getElementById('watermarkText');
  const text = textInput ? textInput.value.trim() : '© Bản quyền hình ảnh';
  if (!text) {
    alert('Vui lòng nhập nội dung chữ đóng dấu bản quyền.');
    return;
  }

  const slider = document.getElementById('sliderWmOpacity');
  const opacityVal = slider ? (parseInt(slider.value) / 100).toFixed(2) : '0.60';

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('wm_type', 'text');
  formData.append('text', text);
  formData.append('opacity', opacityVal);
  formData.append('position', currentWatermarkPos);

  sendImageApi('/anh/api/dong-dau-anh', formData, {
    successTitle: 'Đã đóng dấu bản quyền thành công!',
    buildMeta: function(d) {
      return `Nội dung bản quyền: <strong>${text}</strong> — Vị trí: <strong>${currentWatermarkPos}</strong>.`;
    }
  });
}
