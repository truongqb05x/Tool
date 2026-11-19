/**
 * =========================================================
 * TOOLHUB - MAIN APPLICATION ENTRY POINT (APP.JS)
 * Nạp & điều phối các module nghiệp vụ từ thư mục static/js/ultis/
 * =========================================================
 */
(function() {
  // Tự động xác định đường dẫn tương đối dựa trên thẻ nhúng app.js
  let basePath = '../static/js/ultis/';
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('app.js') !== -1) {
      const idx = src.lastIndexOf('app.js');
      basePath = src.substring(0, idx) + 'ultis/';
      break;
    }
  }

  // Danh sách các file logic chuyên biệt trong thư mục ultis
  const modules = [
    basePath + 'helpers.js',
    basePath + 'sidebar.js',
    basePath + 'search.js',
    basePath + 'auth.js',
    basePath + 'user.js',
    basePath + 'user-files.js'
  ];

  // Nạp tuần tự các module vào trang
  modules.forEach(function(src) {
    document.write('<script src="' + src + '"><\/script>');
  });

  // Tự động khởi tạo tất cả thành phần khi trang đã sẵn sàng
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof initSearch === 'function') initSearch();
    if (typeof initAuthModal === 'function') initAuthModal();
    if (typeof initUserSession === 'function') initUserSession();
  });
})();
