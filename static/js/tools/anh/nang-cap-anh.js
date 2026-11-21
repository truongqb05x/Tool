/* =========================================================
   CÔNG CỤ NÂNG CẤP CHẤT LƯỢNG ẢNH AI - NANG-CAP-ANH.JS
   Logic chuyên biệt: Chọn mô hình AI 2x, 4x, khử nhiễu chân dung
   ========================================================= */

currentToolSlug = 'nang-cap-anh';
let currentAiModel = '2x';

function selectAiModel(el, model) {
  currentAiModel = model;
  selectRadio(el);
}
