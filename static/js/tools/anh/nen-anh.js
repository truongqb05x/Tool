/* =========================================================
   CÔNG CỤ NÉN ẢNH - NEN-ANH.JS
   Logic chuyên biệt: Mức độ nén, loại bỏ EXIF
   ========================================================= */

currentToolSlug = 'nen-anh';
let currentCompressionLevel = 'recommended';

function selectCompressionLevel(el, level) {
  currentCompressionLevel = level;
  selectRadio(el);
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để nén.');
    return;
  }

  const stripExif = document.getElementById('stripExifCheck') ? document.getElementById('stripExifCheck').checked : true;

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('level', currentCompressionLevel);
  formData.append('strip_exif', stripExif ? 'true' : 'false');

  sendImageApi('/anh/api/nen-anh', formData, {
    successTitle: 'Hình ảnh của bạn đã được nén thành công!',
    buildMeta: function(d) {
      if (d.saved_percent > 0) {
        return `Dung lượng đã giảm từ <strong>${d.original_size_formatted}</strong> xuống còn <strong>${d.compressed_size_formatted}</strong> (tiết kiệm <strong>${d.saved_percent}%</strong>).`;
      } else {
        return `Hình ảnh đã ở mức nén tối ưu (<strong>${d.compressed_size_formatted}</strong>). Độ nét được bảo toàn 100%.`;
      }
    }
  });
}
