/* =========================================================
   CÔNG CỤ CHUYỂN ĐỔI SANG JPG - CHUYEN-SANG-JPG.JS
   Logic chuyên biệt: Chất lượng JPG xuất ra, màu nền thay thế vùng trong suốt
   ========================================================= */

currentToolSlug = 'chuyen-sang-jpg';
let currentJpgBg = '#ffffff';
let currentJpgQuality = 95;

function setBgColor(btn, color) {
  currentJpgBg = color;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function selectQuality(val) {
  currentJpgQuality = val;
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để chuyển đổi sang JPG.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('quality', currentJpgQuality);
  formData.append('bg_color', currentJpgBg);

  sendImageApi('/anh/api/chuyen-sang-jpg', formData, {
    successTitle: 'Đã chuyển đổi sang định dạng JPG thành công!',
    buildMeta: function(d) {
      return `File xuất: <strong>${d.download_name}</strong> — Dung lượng: <strong>${d.file_size_formatted || ''}</strong>.`;
    }
  });
}
