/* =========================================================
   SIDEBAR ACCORDION MENU & MOBILE DRAWER - SIDEBAR.JS
   Quản lý đóng mở danh mục công cụ dạng accordion và ngăn kéo Mobile
   ========================================================= */

function initSidebar() {
  // 1. Quản lý mở/đóng ngăn kéo (Drawer) trên thiết bị di động
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Đưa hàm ra phạm vi toàn cục để các nút bấm inline có thể gọi
  window.openMobileSidebar = openMobileSidebar;
  window.closeMobileSidebar = closeMobileSidebar;

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (sidebar.classList.contains('mobile-open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeMobileSidebar();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Đóng drawer khi nhấn phím Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('mobile-open')) {
      closeMobileSidebar();
    }
  });

  // Tự động khôi phục thanh cuộn khi xoay ngang màn hình lớn hơn 992px
  window.addEventListener('resize', function() {
    if (window.innerWidth > 992 && sidebar && sidebar.classList.contains('mobile-open')) {
      closeMobileSidebar();
    }
  });

  // 2. Quản lý Accordion danh mục công cụ
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
