/* =========================================================
   CÔNG CỤ CHUYỂN ĐỔI SANG JPG - CHUYEN-SANG-JPG.JS
   Logic chuyên biệt: Chất lượng JPG xuất ra, màu nền thay thế vùng trong suốt
   ========================================================= */

currentToolSlug = 'chuyen-sang-jpg';
let currentJpgBg = '#ffffff';

function setBgColor(btn, color) {
  currentJpgBg = color;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
