/* =========================================================
   SIDEBAR ACCORDION MENU - SIDEBAR.JS
   Quản lý đóng mở danh mục công cụ dạng accordion
   ========================================================= */

function initSidebar() {
  const toggles = document.querySelectorAll('.side-menu .menu-toggle');
  if (!toggles || toggles.length === 0) return;

  toggles.forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const parentLi = this.parentElement;
      const submenu = parentLi ? parentLi.querySelector('.submenu') : null;
      if (!submenu) return;

      const isOpen = this.classList.contains('open');

      // Đóng các menu con khác cùng cấp
      toggles.forEach(function(otherToggle) {
        if (otherToggle !== toggle) {
          otherToggle.classList.remove('open');
          const otherSubmenu = otherToggle.parentElement ? otherToggle.parentElement.querySelector('.submenu') : null;
          if (otherSubmenu) otherSubmenu.classList.remove('show');
        }
      });

      // Bật/tắt menu con hiện tại
      if (isOpen) {
        this.classList.remove('open');
        submenu.classList.remove('show');
      } else {
        this.classList.add('open');
        submenu.classList.add('show');
      }
    });
  });
}
