/* =========================================================
   CÔNG CỤ ĐÓNG DẤU BẢN QUYỀN ẢNH - DONG-DAU-ANH.JS
   Logic chuyên biệt: Vị trí đóng dấu, độ trong suốt Opacity
   ========================================================= */

currentToolSlug = 'dong-dau-anh';
let currentWatermarkPos = 'bottom-right';

function setWmPos(btn, pos) {
  currentWatermarkPos = pos;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
