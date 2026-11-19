const TOOL_DATA = [
  // TRANG TỔNG HỢP CÔNG CỤ PDF
  { name: 'Tất cả công cụ PDF', key: 'tat-ca-cong-cu-pdf', icon: 'fa-file-pdf', cat: 'Công cụ PDF', url: '/pdf' },

  // 24 CÔNG CỤ PDF ĐẦY ĐỦ
  { name: 'Nén PDF', key: 'nen-pdf', icon: 'fa-compress-alt', cat: 'Công cụ PDF', url: '/pdf/nen-pdf' },
  { name: 'Gộp PDF', key: 'gop-pdf', icon: 'fa-object-group', cat: 'Công cụ PDF', url: '/pdf/gop-pdf' },
  { name: 'Tách PDF', key: 'tach-pdf', icon: 'fa-cut', cat: 'Công cụ PDF', url: '/pdf/tach-pdf' },
  { name: 'Xoay PDF', key: 'xoay-pdf', icon: 'fa-redo', cat: 'Công cụ PDF', url: '/pdf/xoay-pdf' },
  { name: 'Xóa trang PDF', key: 'xoa-trang-pdf', icon: 'fa-trash-alt', cat: 'Công cụ PDF', url: '/pdf/xoa-trang-pdf' },
  { name: 'Sắp xếp trang PDF', key: 'sap-xep-trang-pdf', icon: 'fa-sort-amount-down', cat: 'Công cụ PDF', url: '/pdf/sap-xep-trang-pdf' },
  { name: 'Trích xuất trang PDF', key: 'trich-xuat-trang-pdf', icon: 'fa-file-export', cat: 'Công cụ PDF', url: '/pdf/trich-xuat-trang-pdf' },
  { name: 'Chuyển PDF sang Word', key: 'pdf-sang-word', icon: 'fa-file-word', cat: 'Công cụ PDF', url: '/pdf/pdf-sang-word' },
  { name: 'Chuyển PDF sang Excel', key: 'pdf-sang-excel', icon: 'fa-file-excel', cat: 'Công cụ PDF', url: '/pdf/pdf-sang-excel' },
  { name: 'Chuyển PDF sang PowerPoint', key: 'pdf-sang-powerpoint', icon: 'fa-file-powerpoint', cat: 'Công cụ PDF', url: '/pdf/pdf-sang-powerpoint' },
  { name: 'Chuyển Word sang PDF', key: 'word-sang-pdf', icon: 'fa-file-word', cat: 'Công cụ PDF', url: '/pdf/word-sang-pdf' },
  { name: 'Chuyển Excel sang PDF', key: 'excel-sang-pdf', icon: 'fa-file-excel', cat: 'Công cụ PDF', url: '/pdf/excel-sang-pdf' },
  { name: 'Chuyển PowerPoint sang PDF', key: 'powerpoint-sang-pdf', icon: 'fa-file-powerpoint', cat: 'Công cụ PDF', url: '/pdf/powerpoint-sang-pdf' },
  { name: 'PDF sang ảnh', key: 'pdf-sang-anh', icon: 'fa-file-image', cat: 'Công cụ PDF', url: '/pdf/pdf-sang-anh' },
  { name: 'Ảnh sang PDF', key: 'anh-sang-pdf', icon: 'fa-images', cat: 'Công cụ PDF', url: '/pdf/anh-sang-pdf' },
  { name: 'Chỉnh sửa PDF', key: 'chinh-sua-pdf', icon: 'fa-edit', cat: 'Công cụ PDF', url: '/pdf/chinh-sua-pdf' },
  { name: 'Thêm số trang PDF', key: 'them-so-trang-pdf', icon: 'fa-list-ol', cat: 'Công cụ PDF', url: '/pdf/them-so-trang-pdf' },
  { name: 'Thêm watermark PDF', key: 'them-watermark-pdf', icon: 'fa-stamp', cat: 'Công cụ PDF', url: '/pdf/them-watermark-pdf' },
  { name: 'Bảo vệ PDF bằng mật khẩu', key: 'bao-ve-pdf', icon: 'fa-lock', cat: 'Công cụ PDF', url: '/pdf/bao-ve-pdf' },
  { name: 'Mở khóa PDF', key: 'mo-khoa-pdf', icon: 'fa-unlock-alt', cat: 'Công cụ PDF', url: '/pdf/mo-khoa-pdf' },
  { name: 'Ký PDF', key: 'ky-pdf', icon: 'fa-signature', cat: 'Công cụ PDF', url: '/pdf/ky-pdf' },
  { name: 'So sánh PDF', key: 'so-sanh-pdf', icon: 'fa-columns', cat: 'Công cụ PDF', url: '/pdf/so-sanh-pdf' },
  { name: 'OCR PDF', key: 'ocr-pdf', icon: 'fa-eye', cat: 'Công cụ PDF', url: '/pdf/ocr-pdf' },
  { name: 'Đọc thông tin PDF', key: 'doc-thong-tin-pdf', icon: 'fa-info-circle', cat: 'Công cụ PDF', url: '/pdf/doc-thong-tin-pdf' },

  // CÁC CÔNG CỤ DANH MỤC KHÁC
  { name: 'Cắt & xoay ảnh', key: 'cat-xoay-anh', icon: 'fa-crop-alt', cat: 'Chỉnh sửa ảnh', url: '/anh/cat-anh' },
  { name: 'Ghép ảnh', key: 'ghep-anh', icon: 'fa-images', cat: 'Chỉnh sửa ảnh', url: '/anh/cat-anh' },
  { name: 'Xóa phông nền', key: 'xoa-phong-nen', icon: 'fa-magic', cat: 'Chỉnh sửa ảnh', url: '/anh/cat-anh' },
  { name: 'Chỉnh màu ảnh', key: 'chinh-mau-anh', icon: 'fa-adjust', cat: 'Chỉnh sửa ảnh', url: '/anh/cat-anh' },
  { name: 'Tạo mã QR', key: 'tao-ma-qr', icon: 'fa-qrcode', cat: 'Ứng dụng App', url: '/tien-ich/tao-ma-qr' },
  { name: 'Máy tính online', key: 'may-tinh-online', icon: 'fa-calculator', cat: 'Ứng dụng App', url: '#' },
  { name: 'Đồng hồ đếm ngược', key: 'dong-ho-dem-nguoc', icon: 'fa-clock', cat: 'Ứng dụng App', url: '#' },
  { name: 'Kiểm tra chính tả', key: 'kiem-tra-chinh-ta', icon: 'fa-spell-check', cat: 'Văn bản', url: '#' },
  { name: 'Đếm ký tự', key: 'dem-ky-tu', icon: 'fa-text-width', cat: 'Văn bản', url: '#' },
  { name: 'Dịch văn bản', key: 'dich-van-ban', icon: 'fa-language', cat: 'Văn bản', url: '#' },
  { name: 'Cắt video', key: 'cat-video', icon: 'fa-cut', cat: 'Video', url: '#' },
  { name: 'Nén video', key: 'nen-video', icon: 'fa-compress', cat: 'Video', url: '#' },
  { name: 'Chuyển đổi định dạng video', key: 'chuyen-doi-video', icon: 'fa-exchange-alt', cat: 'Video', url: '#' },
  { name: 'Chuyển đổi đơn vị', key: 'chuyen-doi-don-vi', icon: 'fa-ruler', cat: 'Tiện ích khác', url: '#' },
  { name: 'Tạo mật khẩu', key: 'tao-mat-khau', icon: 'fa-key', cat: 'Tiện ích khác', url: '#' },
  { name: 'Tạo số ngẫu nhiên', key: 'tao-so-ngau-nhien', icon: 'fa-random', cat: 'Tiện ích khác', url: '#' }
];

let activeSuggestionIndex = -1;
let currentSuggestions = [];

function highlightMatch(text, query) {
  if (!query) return text;
  const normText = removeDiacritics(text).toLowerCase();
  const normQuery = removeDiacritics(query).toLowerCase();
  const idx = normText.indexOf(normQuery);
  if (idx === -1) return text;
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
}

function buildSuggestions(query) {
  const normQuery = removeDiacritics(query).toLowerCase().trim();
  if (!normQuery) return [];

  return TOOL_DATA.filter(function(tool) {
    const n = removeDiacritics(tool.name).toLowerCase();
    const c = removeDiacritics(tool.cat).toLowerCase();
    return n.indexOf(normQuery) !== -1 || c.indexOf(normQuery) !== -1;
  }).slice(0, 8);
}

function renderSuggestions(query, suggestionsBox) {
  if (!suggestionsBox) return;
  currentSuggestions = buildSuggestions(query);
  activeSuggestionIndex = -1;

  if (!query.trim()) {
    suggestionsBox.classList.remove('show');
    suggestionsBox.innerHTML = '';
    return;
  }

  if (currentSuggestions.length === 0) {
    suggestionsBox.innerHTML = '<div class="suggestion-empty"><i class="fas fa-search" style="margin-right:6px;"></i>Không tìm thấy công cụ phù hợp với "' + escapeHtml(query) + '"</div>';
    suggestionsBox.classList.add('show');
    return;
  }

  let html = '';
  currentSuggestions.forEach(function(tool, i) {
    html += '<div class="suggestion-item" data-index="' + i + '" data-name="' + escapeHtml(tool.name) + '" data-url="' + (tool.url || '#') + '">'
          +   '<div class="s-icon"><i class="fas ' + tool.icon + '"></i></div>'
          +   '<div class="s-body">'
          +     '<strong>' + highlightMatch(tool.name, query) + '</strong>'
          +     '<span>' + escapeHtml(tool.cat) + '</span>'
          +   '</div>'
          +   '<i class="fas fa-arrow-right s-arrow"></i>'
          + '</div>';
  });
  html += '<div class="suggestion-footer"><kbd>↑</kbd> <kbd>↓</kbd> để chọn · <kbd>Enter</kbd> để mở · <kbd>Esc</kbd> để đóng</div>';

  suggestionsBox.innerHTML = html;
  suggestionsBox.classList.add('show');

  suggestionsBox.querySelectorAll('.suggestion-item').forEach(function(item) {
    item.addEventListener('click', function() {
      selectSuggestion(this.getAttribute('data-name'), this.getAttribute('data-url'));
    });
  });
}

function resolveToolUrl(url) {
  if (!url || url === '#' || url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return '/' + url.replace(/^\.\.\//, '').replace(/\.html$/, '');
}

function selectSuggestion(name, url) {
  const searchInput = document.getElementById('searchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');
  if (searchInput) searchInput.value = name;
  if (suggestionsBox) {
    suggestionsBox.classList.remove('show');
    suggestionsBox.innerHTML = '';
  }
  if (url && url !== '#') {
    window.location.href = resolveToolUrl(url);
  }
}

function updateActiveItem(suggestionsBox) {
  if (!suggestionsBox) return;
  const items = suggestionsBox.querySelectorAll('.suggestion-item');
  items.forEach(function(it, i) {
    it.classList.toggle('active', i === activeSuggestionIndex);
  });
  if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
    items[activeSuggestionIndex].scrollIntoView({ block: 'nearest' });
  }
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  if (!searchInput) return;

  searchInput.addEventListener('input', function() {
    renderSuggestions(this.value, suggestionsBox);
  });

  searchInput.addEventListener('keydown', function(e) {
    if (!suggestionsBox) return;
    const isOpen = suggestionsBox.classList.contains('show');
    const items = suggestionsBox.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
      if (!isOpen) { renderSuggestions(this.value, suggestionsBox); return; }
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      updateActiveItem(suggestionsBox);
    } else if (e.key === 'ArrowUp') {
      if (!isOpen) return;
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
      updateActiveItem(suggestionsBox);
    } else if (e.key === 'Enter') {
      if (isOpen && activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
        e.preventDefault();
        selectSuggestion(items[activeSuggestionIndex].getAttribute('data-name'), items[activeSuggestionIndex].getAttribute('data-url'));
      } else if (isOpen && items.length > 0) {
        e.preventDefault();
        selectSuggestion(items[0].getAttribute('data-name'), items[0].getAttribute('data-url'));
      }
    } else if (e.key === 'Escape') {
      suggestionsBox.classList.remove('show');
      activeSuggestionIndex = -1;
    }
  });

  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', function() {
      if (suggestionsBox && suggestionsBox.classList.contains('show') && currentSuggestions.length > 0) {
        const idx = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
        selectSuggestion(currentSuggestions[idx].name, currentSuggestions[idx].url);
      }
    });
  }

  document.addEventListener('click', function(e) {
    if (suggestionsBox && !suggestionsBox.contains(e.target) && e.target !== searchInput) {
      suggestionsBox.classList.remove('show');
      activeSuggestionIndex = -1;
    }
  });

  searchInput.addEventListener('focus', function() {
    if (this.value.trim() && suggestionsBox) renderSuggestions(this.value, suggestionsBox);
  });

  // Tự động tìm kiếm nếu URL có tham số ?search=...
  const params = new URLSearchParams(window.location.search);
  const q = params.get('search');
  if (q) {
    searchInput.value = q;
    if (suggestionsBox) renderSuggestions(q, suggestionsBox);
  }
}
