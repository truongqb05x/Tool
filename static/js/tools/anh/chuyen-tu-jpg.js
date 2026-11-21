/* =========================================================
   CÔNG CỤ CHUYỂN ĐỔI TỪ JPG - CHUYEN-TU-JPG.JS
   Logic chuyên biệt: Chọn định dạng đích PNG, WEBP, PDF
   ========================================================= */

currentToolSlug = 'chuyen-tu-jpg';
let currentTargetFormat = 'png';

function selectTargetFormat(el, fmt) {
  currentTargetFormat = fmt;
  selectRadio(el);
}
