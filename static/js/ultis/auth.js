/* =========================================================
   XÁC THỰC & HỘP THOẠI ĐĂNG NHẬP / ĐĂNG KÝ - AUTH.JS
   Quản lý modal popup, đăng ký, đăng nhập và thông báo lỗi
   ========================================================= */

function openModal(mode) {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    switchTab(mode || 'login');
    clearError();
  } else {
    // Nếu trang hiện tại chưa có authModal, chuyển hướng về trang chủ kèm tham số để tự mở modal
    window.location.href = 'index.html?auth=' + encodeURIComponent(mode || 'login');
  }
}

function closeModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.remove('show');
    document.body.style.overflow = '';
    clearError();
  }
}

function switchTab(mode) {
  clearError();
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const modalTabs = document.querySelector('.modal-tabs');
  const modalDivider = document.querySelector('.modal-divider');
  const socialLogin = document.querySelector('.social-login');
  const modalTitleText = document.getElementById('modalTitleText');
  const modalTitleIcon = document.querySelector('#modalTitle i');
  if (!tabLogin || !tabRegister) return;

  if (mode === 'forgot') {
    if (modalTabs) modalTabs.style.display = 'none';
    if (modalDivider) modalDivider.style.display = 'none';
    if (socialLogin) socialLogin.style.display = 'none';
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = '';
    if (modalTitleText) modalTitleText.textContent = 'Khôi phục mật khẩu';
    if (modalTitleIcon) modalTitleIcon.className = 'fas fa-key';
  } else if (mode === 'login') {
    if (modalTabs) modalTabs.style.display = 'flex';
    if (modalDivider) modalDivider.style.display = '';
    if (socialLogin) socialLogin.style.display = '';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    if (loginForm) loginForm.style.display = '';
    if (registerForm) registerForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (modalTitleText) modalTitleText.textContent = 'Đăng nhập';
    if (modalTitleIcon) modalTitleIcon.className = 'fas fa-user-circle';
  } else {
    if (modalTabs) modalTabs.style.display = 'flex';
    if (modalDivider) modalDivider.style.display = '';
    if (socialLogin) socialLogin.style.display = '';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    if (registerForm) registerForm.style.display = '';
    if (loginForm) loginForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (modalTitleText) modalTitleText.textContent = 'Đăng ký';
    if (modalTitleIcon) modalTitleIcon.className = 'fas fa-user-circle';
  }
}

function openForgotPassword(e) {
  if (e) e.preventDefault();
  switchTab('forgot');
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

function showError(msg) {
  const box = document.getElementById('formError');
  if (box) {
    box.textContent = msg;
    box.classList.add('show');
  }
}

function clearError() {
  const box = document.getElementById('formError');
  if (box) {
    box.textContent = '';
    box.classList.remove('show');
  }
}

function handleLogin(e) {
  if (e) e.preventDefault();
  clearError();

  const emailEl = document.getElementById('loginEmail');
  const passEl = document.getElementById('loginPassword');
  const rememberEl = document.getElementById('rememberMe');
  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const password = passEl.value;
  const remember = rememberEl ? rememberEl.checked : true;

  if (!email) { showError('Vui lòng nhập email hoặc tên đăng nhập.'); return; }
  if (!password) { showError('Vui lòng nhập mật khẩu.'); return; }
  if (password.length < 6) { showError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }

  const users = JSON.parse(localStorage.getItem('toolhub_users') || '{}');
  let displayName;

  if (users[email.toLowerCase()]) {
    if (users[email.toLowerCase()].password !== password) {
      showError('Mật khẩu không đúng. Vui lòng thử lại.');
      return;
    }
    displayName = users[email.toLowerCase()].name;
  } else {
    displayName = email.split('@')[0];
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }

  const btn = document.getElementById('loginSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
  }

  setTimeout(function() {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập';
    }
    if (typeof setLoggedIn === 'function') {
      setLoggedIn({ name: displayName, email: email, remember: remember });
    }
    closeModal();
    const form = document.getElementById('loginForm');
    if (form) form.reset();
  }, 500);
}

function handleRegister(e) {
  if (e) e.preventDefault();
  clearError();

  const nameEl = document.getElementById('regName');
  const emailEl = document.getElementById('regEmail');
  const passEl = document.getElementById('regPassword');
  const confEl = document.getElementById('regPasswordConfirm');
  const agreeEl = document.getElementById('agreeTerms');
  if (!emailEl || !passEl) return;

  const rawName = nameEl ? nameEl.value.trim() : '';
  const email = emailEl.value.trim();
  const password = passEl.value;
  const confirm = confEl ? confEl.value : '';
  const agree = agreeEl ? agreeEl.checked : true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Vui lòng nhập email hợp lệ.'); return;
  }
  if (password.length < 6) { showError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
  if (password !== confirm) { showError('Mật khẩu xác nhận không khớp.'); return; }
  if (!agree) { showError('Bạn cần đồng ý với điều khoản để tiếp tục.'); return; }

  const users = JSON.parse(localStorage.getItem('toolhub_users') || '{}');
  if (users[email.toLowerCase()]) {
    showError('Email này đã được đăng ký. Vui lòng đăng nhập.');
    return;
  }

  // Tên hiển thị (nếu để trống thì trích xuất từ email)
  let name = rawName;
  if (!name) {
    const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  const btn = document.getElementById('registerSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang xử lý đăng ký...';
  }

  setTimeout(function() {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tạo tài khoản';
    }
    users[email.toLowerCase()] = { name: name, email: email, password: password };
    localStorage.setItem('toolhub_users', JSON.stringify(users));

    if (typeof setLoggedIn === 'function') {
      setLoggedIn({ name: name, email: email, remember: true });
    }
    closeModal();
    const form = document.getElementById('registerForm');
    if (form) form.reset();

    // Hiển thị hộp thoại thông báo đăng ký thành công phong cách cổ điển
    showClassicRegisterNotice(name, email);
  }, 600);
}

/**
 * Xử lý yêu cầu Quên mật khẩu (Giả lập hệ thống)
 */
function handleForgotPassword(e) {
  if (e) e.preventDefault();
  clearError();

  const emailEl = document.getElementById('forgotEmail');
  if (!emailEl) return;
  const email = emailEl.value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Vui lòng nhập địa chỉ email hợp lệ.');
    return;
  }

  const btn = document.getElementById('forgotSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang xử lý yêu cầu...';
  }

  setTimeout(function() {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Gửi yêu cầu khôi phục';
    }

    closeModal();
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) forgotForm.reset();

    // Hiển thị hộp thoại khôi phục mật khẩu phong cách cổ điển
    showClassicForgotNotice(email);
  }, 600);
}

/**
 * Hộp thoại thông báo khôi phục mật khẩu phong cách cổ điển
 */
function showClassicForgotNotice(email) {
  let overlay = document.getElementById('classicDialogOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'classicDialogOverlay';
    overlay.className = 'classic-dialog-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeClassicDialog();
    });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="classic-dialog" role="alertdialog" aria-modal="true">
      <div class="classic-dialog-header">
        <span><i class="fas fa-key"></i> HỆ THỐNG TOOLHUB — KHÔI PHỤC MẬT KHẨU</span>
      </div>
      <div class="classic-dialog-body">
        <div class="classic-dialog-icon" style="background:#eef4fa; border-color:#bcd5ee; color:#1e5b9c;">
          <i class="fas fa-envelope-open-text"></i>
        </div>
        <div class="classic-dialog-main">
          <h4>Yêu cầu khôi phục đã gửi!</h4>
          <p>Hệ thống đã gửi đường dẫn đặt lại mật khẩu và mã xác thực tạm thời tới địa chỉ: <strong>${escapeHtml(email)}</strong>.</p>
          <div class="classic-dialog-sim">
            <i class="fas fa-lock" style="color:#1e5b9c;"></i>
            <div>
              <strong>Mô phỏng khôi phục tài khoản:</strong> Mật khẩu tạm thời được cấp là <code style="background:#f4ebd0; padding:1px 5px; border-radius:2px; font-weight:700; color:#854b00;">ToolHub@2025</code> (hiệu lực trong 15 phút).
            </div>
          </div>
        </div>
      </div>
      <div class="classic-dialog-footer">
        <button type="button" class="classic-dialog-btn" onclick="closeClassicDialog(); openModal('login'); fillLoginCredentials('${escapeHtml(email)}', 'ToolHub@2025');">Đến trang Đăng nhập</button>
      </div>
    </div>
  `;

  overlay.classList.add('show');
}

function fillLoginCredentials(email, password) {
  const loginEmail = document.getElementById('loginEmail');
  const loginPass = document.getElementById('loginPassword');
  if (loginEmail) loginEmail.value = email;
  if (loginPass) {
    loginPass.value = password;
    loginPass.focus();
  }
}

/**
 * Hộp thoại thông báo đăng ký thành công phong cách cổ điển (Classic Dialog)
 */
function showClassicRegisterNotice(name, email) {
  let overlay = document.getElementById('classicDialogOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'classicDialogOverlay';
    overlay.className = 'classic-dialog-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeClassicDialog();
    });
    document.body.appendChild(overlay);
  }

  const displayName = (name && name.toLowerCase() !== email.toLowerCase()) ? `${escapeHtml(name)} (<em>${escapeHtml(email)}</em>)` : `<strong>${escapeHtml(email)}</strong>`;

  overlay.innerHTML = `
    <div class="classic-dialog" role="alertdialog" aria-modal="true">
      <div class="classic-dialog-header">
        <span><i class="fas fa-shield-alt"></i> HỆ THỐNG TOOLHUB — THÔNG BÁO ĐĂNG KÝ</span>
      </div>
      <div class="classic-dialog-body">
        <div class="classic-dialog-icon">
          <i class="fas fa-check"></i>
        </div>
        <div class="classic-dialog-main">
          <h4>Đăng ký tài khoản thành công!</h4>
          <p>Xin chúc mừng tài khoản ${displayName} đã đăng ký thành công trên nền tảng ToolHub.</p>
        </div>
      </div>
      <div class="classic-dialog-footer">
        <button type="button" class="classic-dialog-btn" onclick="closeClassicDialog()">Đồng ý &amp; Bắt đầu</button>
      </div>
    </div>
  `;

  overlay.classList.add('show');
}

function closeClassicDialog() {
  const overlay = document.getElementById('classicDialogOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

/**
 * Toast thông báo cổ điển góc màn hình (dùng cho live notification hoặc thông báo nhanh)
 */
function showClassicToast(title, message, isSuccess) {
  let container = document.getElementById('classicToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'classicToastContainer';
    container.className = 'classic-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'classic-toast';
  const icon = isSuccess !== false ? 'fa-check-circle' : 'fa-info-circle';
  const iconColor = isSuccess !== false ? '#27ae60' : '#1e5b9c';

  toast.innerHTML = `
    <div class="classic-toast-head">
      <span><i class="fas fa-bell" style="margin-right:5px; color:#1e5b9c;"></i> ${escapeHtml(title || 'HỆ THỐNG')}</span>
      <button type="button" class="classic-toast-close" onclick="this.closest('.classic-toast').remove()" aria-label="Đóng">&times;</button>
    </div>
    <div class="classic-toast-body">
      <i class="fas ${icon}" style="color:${iconColor};"></i>
      <div>${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('fade-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 4500);
}

/**
 * Khởi chạy giả lập thông báo thành viên đăng ký theo chu kỳ (Social Proof phong cách cổ điển)
 */
function initLiveSimulatedRegistrations() {
  const demoUsers = [
    'nguyen.v***@gmail.com',
    'tran.ha***@yahoo.com',
    'le.minh***@gmail.com',
    'pham.thanh***@outlook.com',
    'vu.hoang***@gmail.com'
  ];
  let index = 0;

  // Lần đầu xuất hiện sau 5 giây để tạo cảm giác chân thực
  setTimeout(function() {
    showSimulatedNotice();
    // Sau đó lặp lại mỗi 32 giây
    setInterval(showSimulatedNotice, 32000);
  }, 5000);

  function showSimulatedNotice() {
    const authModal = document.getElementById('authModal');
    if (authModal && authModal.classList.contains('show')) return;
    const classicDialog = document.getElementById('classicDialogOverlay');
    if (classicDialog && classicDialog.classList.contains('show')) return;

    const email = demoUsers[index % demoUsers.length];
    index++;
    showClassicToast(
      'THÀNH VIÊN MỚI',
      `Thành viên <strong>${email}</strong> vừa đăng ký tài khoản ToolHub.`
    );
  }
}

function fakeSocialLogin(provider) {
  const demoName = provider === 'Google' ? 'Google User' : 'Facebook User';
  const demoEmail = provider.toLowerCase() + '.user@example.com';
  if (typeof setLoggedIn === 'function') {
    setLoggedIn({ name: demoName, email: demoEmail, remember: true });
  }
  closeModal();
}

function initAuthModal() {
  const authModal = document.getElementById('authModal');
  if (!authModal) return;

  // Tự động mở modal nếu URL có tham số ?auth=login hoặc ?auth=register
  const params = new URLSearchParams(window.location.search);
  const authMode = params.get('auth');
  if (authMode === 'login' || authMode === 'register') {
    openModal(authMode);
    // Xóa query param trên thanh URL mà không reload trang
    const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]auth=[^&]+/, '').replace(/^&/, '?');
    window.history.replaceState({}, '', cleanUrl);
  }

  authModal.addEventListener('click', function(e) {
    if (e.target === authModal) closeModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (authModal.classList.contains('show')) closeModal();
      closeClassicDialog();
    }
  });

  // Khởi chạy thông báo giả lập thành viên mới (Live Social Proof phong cách cổ điển)
  initLiveSimulatedRegistrations();
}
