/* =========================================================
   CÔNG CỤ LÀM MỜ KHUÔN MẶT - LAM-MO-MAT.JS
   Logic chuyên biệt: Kiểu làm mờ (Blur/Pixelate/Blackout), cường độ
   ========================================================= */

currentToolSlug = 'lam-mo-mat';

function updateBlurLabel(val) {
  const label = document.getElementById('blurIntensityVal');
  if (label) {
    label.textContent = val == 1 ? 'Nhẹ' : (val == 2 ? 'Vừa phải' : 'Cực mạnh');
  }
}
