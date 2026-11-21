/* =========================================================
   CÔNG CỤ XOAY & LẬT ẢNH - XOAY-ANH.JS
   Logic chuyên biệt: Xoay 90/180 độ, lật ảnh đối xứng ngang/dọc
   ========================================================= */

currentToolSlug = 'xoay-anh';

function flipPreview(axis) {
  const img = document.getElementById('imagePreview');
  if (!img) return;
  img.style.transform = axis === 'h' ? 'scaleX(-1)' : 'scaleY(-1)';
}
