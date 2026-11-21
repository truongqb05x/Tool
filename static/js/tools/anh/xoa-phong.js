/* =========================================================
   CÔNG CỤ XÓA PHÔNG ẢNH AI - XOA-PHONG.JS
   Logic chuyên biệt: Xuất file PNG trong suốt hoặc nền trắng TMĐT
   ========================================================= */

currentToolSlug = 'xoa-phong';
let currentBgType = 'transparent';

function selectBgType(el, type) {
  currentBgType = type;
  selectRadio(el);
}
