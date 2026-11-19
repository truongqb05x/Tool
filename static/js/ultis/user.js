/* =========================================================
   QUẢN LÝ PHIÊN & TRẠNG THÁI NGƯỜI DÙNG - USER.JS
   Quản lý session đăng nhập, dropdown menu và trang cá nhân
   ========================================================= */

const CURRENT_USER_KEY = 'toolhub_current_user';

function setLoggedIn(user) {
  const storage = user.remember ? localStorage : sessionStorage;
  storage.setItem(CURRENT_USER_KEY, JSON.stringify({
    name: user.name,
    email: user.email
  }));

  applyLoggedInUI(user);
  showUserPage();
}

function logout() {
  // Gọi API đăng xuất trên server
  try {
    fetch('/api/auth/logout', { method: 'POST' }).catch(function() {});
  } catch (e) {}

  localStorage.removeItem(CURRENT_USER_KEY);
  sessionStorage.removeItem(CURRENT_USER_KEY);
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) userDropdown.classList.remove('show');
  applyLoggedOutUI();
  showGuestPage();
}

function applyLoggedInUI(user) {
  // Thêm class logged-in vào thẻ body để kích hoạt bộ lọc CSS triệt để
  document.body.classList.add('logged-in');

  const guestActions = document.getElementById('guestActions');
  const userActions = document.getElementById('userActions');
  if (guestActions) guestActions.style.setProperty('display', 'none', 'important');
  if (userActions) userActions.style.setProperty('display', 'flex', 'important');

  const drawerGuestActions = document.getElementById('drawerGuestActions');
  const drawerUserActions = document.getElementById('drawerUserActions');
  if (drawerGuestActions) drawerGuestActions.style.setProperty('display', 'none', 'important');
  if (drawerUserActions) drawerUserActions.style.setProperty('display', 'flex', 'important');

  const displayName = user.name || user.username || (user.email ? user.email.split('@')[0] : 'Người dùng');
  const displayEmail = user.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const headerAvatar = document.getElementById('headerAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const pageAvatar = document.getElementById('pageAvatar');
  const pageUserName = document.getElementById('pageUserName');
  const drawerAvatar = document.getElementById('drawerAvatar');
  const drawerUserName = document.getElementById('drawerUserName');
  const drawerUserEmail = document.getElementById('drawerUserEmail');

  if (headerAvatar) headerAvatar.textContent = initial;
  if (headerUserName) headerUserName.textContent = displayName;
  if (dropdownName) dropdownName.textContent = displayName;
  if (dropdownEmail) dropdownEmail.textContent = displayEmail;

  if (pageAvatar) pageAvatar.textContent = initial;
  if (pageUserName) pageUserName.textContent = 'Xin chào, ' + displayName + '!';

  if (drawerAvatar) drawerAvatar.textContent = initial;
  if (drawerUserName) drawerUserName.textContent = displayName;
  if (drawerUserEmail) drawerUserEmail.textContent = displayEmail;
}

function applyLoggedOutUI() {
  document.body.classList.remove('logged-in');

  const guestActions = document.getElementById('guestActions');
  const userActions = document.getElementById('userActions');
  if (guestActions) guestActions.style.removeProperty('display');
  if (userActions) userActions.style.setProperty('display', 'none', 'important');

  const drawerGuestActions = document.getElementById('drawerGuestActions');
  const drawerUserActions = document.getElementById('drawerUserActions');
  if (drawerGuestActions) drawerGuestActions.style.removeProperty('display');
  if (drawerUserActions) drawerUserActions.style.setProperty('display', 'none', 'important');
}

function showUserPage() {
  const guestPage = document.getElementById('guestPage');
  const userPage = document.getElementById('userPage');
  if (guestPage) guestPage.style.display = 'none';
  if (userPage) userPage.classList.add('show');
}

function showGuestPage() {
  const guestPage = document.getElementById('guestPage');
  const userPage = document.getElementById('userPage');
  if (userPage) userPage.classList.remove('show');
  if (guestPage) guestPage.style.display = '';
}

function openUserHistory() {
  showUserPage();
}

function openUserSettings() {
  showUserPage();
}

function initUserSession() {
  const userMenuTrigger = document.getElementById('userMenuTrigger');
  const userDropdown = document.getElementById('userDropdown');

  if (userMenuTrigger && userDropdown) {
    userMenuTrigger.addEventListener('click', function(e) {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
      if (!userDropdown.contains(e.target) && !userMenuTrigger.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  // Khôi phục phiên đăng nhập từ Storage ngay lập tức để giao diện không bị giật
  const saved = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    try {
      const user = JSON.parse(saved);
      applyLoggedInUI(user);
      showUserPage();
    } catch (err) {}
  } else {
    applyLoggedOutUI();
  }

  // Đồng bộ phiên xác thực với Backend Server Flask
  try {
    fetch('/api/auth/me')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.success && data.user) {
          applyLoggedInUI(data.user);
          showUserPage();
          // Cập nhật lại storage với dữ liệu mới nhất từ DB
          const storage = localStorage.getItem(CURRENT_USER_KEY) ? localStorage : sessionStorage;
          storage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        } else if (!saved) {
          applyLoggedOutUI();
        }
      })
      .catch(function() {});
  } catch (e) {}
}
