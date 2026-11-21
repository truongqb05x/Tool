/* =========================================================
   CÔNG CỤ THAY ĐỔI KÍCH THƯỚC ẢNH - THAY-DOI-KICH-THUOC.JS
   Logic chuyên biệt: Nhập pixel width/height, preset mạng xã hội
   ========================================================= */

currentToolSlug = 'thay-doi-kich-thuoc';

function setPresetSize(w, h) {
  const elW = document.getElementById('resizeWidth');
  const elH = document.getElementById('resizeHeight');
  if (elW) elW.value = w;
  if (elH) elH.value = h;
}

function onImageLoaded(img) {
  const elW = document.getElementById('resizeWidth');
  const elH = document.getElementById('resizeHeight');
  if (elW && elH) {
    elW.value = img.naturalWidth;
    elH.value = img.naturalHeight;
  }
}
