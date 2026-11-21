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
