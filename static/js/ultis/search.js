/* =========================================================
   TÌM KIẾM & GỢI Ý AUTOCOMPLETE - SEARCH.JS
   Quản lý danh sách công cụ, tìm kiếm nhanh và phím tắt
   ========================================================= */

const TOOL_DATA = [
  { name: 'Nén PDF', key: 'nen-pdf', icon: 'fa-compress-alt', cat: 'Công cụ PDF', url: 'pdf/nen-pdf.html' },
  { name: 'Gộp nhiều PDF', key: 'gop-pdf', icon: 'fa-object-group', cat: 'Công cụ PDF', url: 'pdf/gop-pdf.html' },
  { name: 'Chuyển PDF sang Word', key: 'pdf-sang-word', icon: 'fa-file-signature', cat: 'Công cụ PDF', url: 'pdf/nen-pdf.html' },
  { name: 'Tách PDF', key: 'tach-pdf', icon: 'fa-cut', cat: 'Công cụ PDF', url: 'pdf/nen-pdf.html' },
  { name: 'Bảo vệ PDF', key: 'bao-ve-pdf', icon: 'fa-lock', cat: 'Công cụ PDF', url: 'pdf/nen-pdf.html' },
  { name: 'Cắt & xoay ảnh', key: 'cat-xoay-anh', icon: 'fa-crop-alt', cat: 'Chỉnh sửa ảnh', url: 'anh/cat-anh.html' },
  { name: 'Ghép ảnh', key: 'ghep-anh', icon: 'fa-images', cat: 'Chỉnh sửa ảnh', url: 'anh/cat-anh.html' },
  { name: 'Xóa phông nền', key: 'xoa-phong-nen', icon: 'fa-magic', cat: 'Chỉnh sửa ảnh', url: 'anh/cat-anh.html' },
  { name: 'Chỉnh màu ảnh', key: 'chinh-mau-anh', icon: 'fa-adjust', cat: 'Chỉnh sửa ảnh', url: 'anh/cat-anh.html' },
  { name: 'Tạo mã QR', key: 'tao-ma-qr', icon: 'fa-qrcode', cat: 'Ứng dụng App', url: 'tien-ich/tao-ma-qr.html' },
  { name: 'Máy tính online', key: 'may-tinh-online', icon: 'fa-calculator', cat: 'Ứng dụng App', url: '#' },
  { name: 'Đồng hồ đếm ngược', key: 'dong-ho-dem-nguoc', icon: 'fa-clock', cat: 'Ứng dụng App', url: '#' },
  { name: 'Word sang PDF', key: 'word-sang-pdf', icon: 'fa-file-word', cat: 'Chuyển đổi', url: 'pdf/nen-pdf.html' },
  { name: 'Excel sang PDF', key: 'excel-sang-pdf', icon: 'fa-file-excel', cat: 'Chuyển đổi', url: 'pdf/nen-pdf.html' },
  { name: 'Ảnh sang PDF', key: 'anh-sang-pdf', icon: 'fa-file-image', cat: 'Chuyển đổi', url: 'pdf/nen-pdf.html' },
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
  const isSubfolder = window.location.pathname.indexOf('/pdf/') !== -1 ||
                      window.location.pathname.indexOf('/anh/') !== -1 ||
                      window.location.pathname.indexOf('/tien-ich/') !== -1 ||
                      window.location.pathname.indexOf('/chuyen-doi/') !== -1;
  return isSubfolder ? ('../' + url) : url;
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
