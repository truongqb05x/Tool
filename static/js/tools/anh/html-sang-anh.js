/* =========================================================
   CÔNG CỤ CHUYỂN HTML SANG ẢNH - HTML-SANG-ANH.JS
   Logic chuyên biệt: Khung nhìn Desktop/Mobile, nhập URL
   ========================================================= */

currentToolSlug = 'html-sang-anh';
let currentViewport = 'desktop';

function selectViewport(el, vp) {
  currentViewport = vp;
  selectRadio(el);
}
