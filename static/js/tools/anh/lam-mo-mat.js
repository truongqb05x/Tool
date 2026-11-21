/* =========================================================
   CÔNG CỤ LÀM MỜ KHUÔN MẶT - LAM-MO-MAT.JS
   Logic chuyên biệt: Kiểu làm mờ (Gaussian/Pixelate/Blackout), cường độ
   ========================================================= */

currentToolSlug = 'lam-mo-mat';
let currentBlurStyle = 'gaussian';

function selectBlurStyle(el, style) {
  currentBlurStyle = style;
  selectRadio(el);
}

function updateBlurLabel(val) {
  const label = document.getElementById('blurIntensityVal');
  if (label) {
    label.textContent = val == 1 ? 'Nhẹ' : (val == 2 ? 'Vừa phải' : 'Cực mạnh');
  }
}

function executeToolAction() {
  if (!currentImageFile) {
    alert('Vui lòng chọn hình ảnh để làm mờ khuôn mặt.');
    return;
  }

  const slider = document.getElementById('sliderBlurStrength');
  const level = slider ? parseInt(slider.value) : 2;
  const strengthMap = { 1: 15, 2: 30, 3: 50 };
  const blurStrength = strengthMap[level] || 30;

  const formData = new FormData();
  formData.append('file', currentImageFile);
  formData.append('blur_type', currentBlurStyle);
  formData.append('blur_strength', blurStrength);

  sendImageApi('/anh/api/lam-mo-mat', formData, {
    successTitle: 'Đã làm mờ khuôn mặt thành công!',
    buildMeta: function(d) {
      const count = d.faces_detected !== undefined ? d.faces_detected : 0;
      return `Đã phát hiện và bảo vệ <strong>${count} khuôn mặt</strong> trên bức ảnh của bạn.`;
    }
  });
}
