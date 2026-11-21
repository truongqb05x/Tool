/* =========================================================
   CÔNG CỤ CẮT ẢNH - CAT-ANH.JS
   Logic chuyên biệt: Chọn tỉ lệ khung hình (1:1, 16:9, 4:3, 9:16, 3:2)
   ========================================================= */

currentToolSlug = 'cat-anh';
let currentCropRatio = 'free';

function selectCropRatio(btn, ratio) {
  currentCropRatio = ratio;
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để cắt.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);

  const ratioToSend = (currentCropRatio === 'free' || !currentCropRatio) ? '1:1' : currentCropRatio;
  formData.append('crop_mode', 'ratio');
  formData.append('ratio', ratioToSend);

  sendImageApi('/anh/api/cat-anh', formData, {
    successTitle: 'Đã cắt hình ảnh thành công!',
    buildMeta: function(d) {
      const w = d.cropped_width || d.crop_width || '';
      const h = d.cropped_height || d.crop_height || '';
      return `Kích thước sau khi cắt: <strong>${w} x ${h} px</strong> (Tỉ lệ <strong>${ratioToSend}</strong>).`;
    }
  });
}
