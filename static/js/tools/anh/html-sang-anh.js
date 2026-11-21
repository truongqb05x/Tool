/* =========================================================
   CÔNG CỤ CHUYỂN HTML SANG ẢNH - HTML-SANG-ANH.JS
   Logic chuyên biệt: Khung nhìn Desktop/Mobile, nhập URL hoặc file HTML
   ========================================================= */

currentToolSlug = 'html-sang-anh';
let currentViewport = 'desktop';

function selectViewport(el, vp) {
  currentViewport = vp;
  selectRadio(el);
}

function executeToolAction() {
  const urlInput = document.getElementById('webUrlInput');
  const url = urlInput ? urlInput.value.trim() : '';

  if (!url && !currentImageFile) {
    alert('Vui lòng nhập đường dẫn URL hoặc chọn tệp HTML cần chuyển đổi.');
    return;
  }

  const formData = new FormData();
  if (currentImageFile) {
    formData.append('file', currentImageFile);
  }
  if (url) {
    formData.append('url', url);
  }
  formData.append('viewport', currentViewport);
  formData.append('format', 'PNG');

  sendImageApi('/anh/api/html-sang-anh', formData, {
    successTitle: 'Đã chuyển đổi HTML sang ảnh thành công!',
    buildMeta: function(d) {
      return `Ảnh chụp xuất: <strong>${d.download_name}</strong>.`;
    }
  });
}
