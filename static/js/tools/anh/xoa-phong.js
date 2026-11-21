/* =========================================================
   CÔNG CỤ XÓA PHÔNG ẢNH AI - XOA-PHONG.JS
   Logic chuyên biệt: Xuất file PNG trong suốt hoặc nền trắng/xám
   ========================================================= */

currentToolSlug = 'xoa-phong';
let currentBgType = 'transparent';

function selectBgType(el, type) {
  currentBgType = type;
  selectRadio(el);
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để tách phông nền.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('bg_color', currentBgType);

  sendImageApi('/anh/api/xoa-phong', formData, {
    successTitle: 'Đã xóa phông nền thành công!',
    buildMeta: function(d) {
      return `Chủ thể đã được tách sắc nét. Tệp xuất: <strong>${d.download_name}</strong>.`;
    }
  });
}
