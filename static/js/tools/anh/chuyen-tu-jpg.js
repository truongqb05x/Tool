/* =========================================================
   CÔNG CỤ CHUYỂN ĐỔI TỪ JPG - CHUYEN-TU-JPG.JS
   Logic chuyên biệt: Chọn định dạng đích PNG, WEBP, GIF, BMP
   ========================================================= */

currentToolSlug = 'chuyen-tu-jpg';
let currentTargetFormat = 'png';

function selectTargetFormat(el, fmt) {
  currentTargetFormat = fmt;
  selectRadio(el);
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để chuyển đổi.');
    return;
  }

  const selectedRadio = document.querySelector('input[name="targetFormat"]:checked');
  const format = selectedRadio ? selectedRadio.value : currentTargetFormat;

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('target_format', format.toUpperCase());

  sendImageApi('/anh/api/chuyen-tu-jpg', formData, {
    successTitle: `Đã chuyển đổi sang định dạng ${format.toUpperCase()} thành công!`,
    buildMeta: function(d) {
      return `Tệp xuất: <strong>${d.download_name}</strong> — Dung lượng: <strong>${d.file_size_formatted || ''}</strong>.`;
    }
  });
}
