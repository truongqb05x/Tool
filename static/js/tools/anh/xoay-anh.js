/* =========================================================
   CÔNG CỤ XOAY & LẬT ẢNH - XOAY-ANH.JS
   Logic chuyên biệt: Xoay 90/180/270 độ, lật ảnh đối xứng ngang/dọc
   ========================================================= */

currentToolSlug = 'xoay-anh';
let currentRotateAngle = 0;
let currentFlipAxis = 'none';

function rotatePreview(deg) {
  currentRotateAngle = (currentRotateAngle + deg + 360) % 360;
  updateImageTransform();
}

function flipPreview(axis) {
  if (currentFlipAxis === axis) {
    currentFlipAxis = 'none';
  } else {
    currentFlipAxis = axis;
  }
  updateImageTransform();
}

function updateImageTransform() {
  const img = document.getElementById('imagePreview');
  if (!img) return;

  let scaleX = 1;
  let scaleY = 1;
  if (currentFlipAxis === 'h') scaleX = -1;
  if (currentFlipAxis === 'v') scaleY = -1;

  img.style.transform = `rotate(${currentRotateAngle}deg) scale(${scaleX}, ${scaleY})`;
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để xoay hoặc lật.');
    return;
  }

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('angle', currentRotateAngle);
  formData.append('flip', currentFlipAxis === 'h' ? 'horizontal' : (currentFlipAxis === 'v' ? 'vertical' : 'none'));

  sendImageApi('/anh/api/xoay-anh', formData, {
    successTitle: 'Đã xoay hình ảnh thành công!',
    buildMeta: function(d) {
      return `Bức ảnh mới đã xoay <strong>${currentRotateAngle}°</strong> và sẵn sàng tải về.`;
    }
  });
}
