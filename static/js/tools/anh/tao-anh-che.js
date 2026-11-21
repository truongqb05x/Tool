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

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để tạo meme.');
    return;
  }

  const topEl = document.getElementById('memeTopText');
  const bottomEl = document.getElementById('memeBottomText');

  const topText = topEl ? topEl.value.trim() : '';
  const bottomText = bottomEl ? bottomEl.value.trim() : '';

  if (!topText && !bottomText) {
    alert('Vui lòng nhập ít nhất câu chữ phía trên hoặc phía dưới của Meme.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('top_text', topText);
  formData.append('bottom_text', bottomText);

  sendImageApi('/anh/api/tao-anh-che', formData, {
    successTitle: 'Meme của bạn đã được tạo thành công!',
    buildMeta: function(d) {
      return `Meme hài hước đã xuất thành công: <strong>${d.download_name}</strong>.`;
    }
  });
}
