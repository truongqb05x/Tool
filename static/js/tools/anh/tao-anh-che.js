/* =========================================================
   CÔNG CỤ TẠO ẢNH CHẾ MEME - TAO-ANH-CHE.JS
   Logic chuyên biệt: Màu chữ meme, top & bottom text
   ========================================================= */

currentToolSlug = 'tao-anh-che';
let currentMemeColor = '#ffffff';

function setMemeColor(btn, color) {
  currentMemeColor = color;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
