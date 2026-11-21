/* =========================================================
   CÔNG CỤ NÂNG CẤP CHẤT LƯỢNG ẢNH AI - NANG-CAP-ANH.JS
   Logic chuyên biệt: Chọn mô hình AI 2x, 4x, khử nhiễu chân dung
   ========================================================= */

currentToolSlug = 'nang-cap-anh';
let currentAiModel = 'clarity';

function selectAiModel(el, model) {
  currentAiModel = model;
  selectRadio(el);
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để nâng cấp.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('mode', currentAiModel);

  sendImageApi('/anh/api/nang-cap-anh', formData, {
    successTitle: 'Đã nâng cấp chất lượng ảnh thành công!',
    buildMeta: function(d) {
      return `File xuất: <strong>${d.download_name}</strong> — Chế độ: <strong>${currentAiModel.toUpperCase()}</strong>.`;
    }
  });
}
