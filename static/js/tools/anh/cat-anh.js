/* =========================================================
   CÔNG CỤ CẮT ẢNH - CAT-ANH.JS
   Logic chuyên biệt: Chọn tỉ lệ khung hình (1:1, 16:9, 4:3, 9:16)
   ========================================================= */

currentToolSlug = 'cat-anh';
let currentCropRatio = 'free';

function selectCropRatio(btn, ratio) {
  currentCropRatio = ratio;
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
