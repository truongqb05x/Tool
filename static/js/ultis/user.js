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
  localStorage.removeItem(CURRENT_USER_KEY);
  sessionStorage.removeItem(CURRENT_USER_KEY);
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) userDropdown.classList.remove('show');
  applyLoggedOutUI();
  showGuestPage();
}

function applyLoggedInUI(user) {
  const guestActions = document.getElementById('guestActions');
  const userActions = document.getElementById('userActions');
  if (guestActions) guestActions.style.display = 'none';
  if (userActions) userActions.style.display = '';

  const initial = (user.name || 'U').charAt(0).toUpperCase();
  const headerAvatar = document.getElementById('headerAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const pageAvatar = document.getElementById('pageAvatar');
  const pageUserName = document.getElementById('pageUserName');

  if (headerAvatar) headerAvatar.textContent = initial;
  if (headerUserName) headerUserName.textContent = user.name;
  if (dropdownName) dropdownName.textContent = user.name;
  if (dropdownEmail) dropdownEmail.textContent = user.email;

  if (pageAvatar) pageAvatar.textContent = initial;
  if (pageUserName) pageUserName.textContent = 'Xin chào, ' + user.name + '!';
}

function applyLoggedOutUI() {
  const guestActions = document.getElementById('guestActions');
  const userActions = document.getElementById('userActions');
  if (guestActions) guestActions.style.display = 'flex';
  if (userActions) userActions.style.display = 'none';
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

  // Khôi phục phiên đăng nhập từ Storage khi tải trang
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
}
