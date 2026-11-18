/* =========================================================
   TRANG ĐIỀU KHOẢN - DIEUKHOAN.JS
   Scroll spy mục lục điều khoản, cuộn mượt và xác nhận chấp thuận
   ========================================================= */

function acceptTerms() {
  const btn = document.getElementById('acceptBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-check-circle"></i> Đã đồng ý';

  // Lưu trạng thái đã chấp thuận
  try {
    localStorage.setItem('toolhub_terms_accepted', JSON.stringify({
      version: '1.2',
      acceptedAt: new Date().toISOString()
    }));
  } catch (e) {}

  setTimeout(function() {
    alert('Cảm ơn bạn đã đồng ý với Điều khoản sử dụng của ToolHub.\nBạn có thể tiếp tục sử dụng dịch vụ.');
  }, 200);
}

function initDieuKhoan() {
  // Scroll spy mục lục điều khoản
  const sections = document.querySelectorAll('.terms-section');
  const tocLinks = document.querySelectorAll('.toc-menu a[data-toc]');

  function updateTocActive() {
    let currentId = null;
    const scrollPos = window.scrollY + 130;

    sections.forEach(function(sec) {
      if (sec.offsetTop <= scrollPos) {
        currentId = sec.id;
      }
    });

    tocLinks.forEach(function(link) {
      link.classList.toggle('active', link.getAttribute('data-toc') === currentId);
    });
  }

  window.addEventListener('scroll', updateTocActive);
  updateTocActive();

  // Click mục lục cuộn mượt
  tocLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.getElementById(this.getAttribute('data-toc'));
      if (target) {
        window.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
      }
    });
  });

  // Nút Back to top
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    });
  }

  // Khôi phục trạng thái đã đồng ý từ trước
  try {
    const saved = localStorage.getItem('toolhub_terms_accepted');
    if (saved) {
      const data = JSON.parse(saved);
      if (data && data.version === '1.2') {
        const btn = document.getElementById('acceptBtn');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-check-circle"></i> Đã đồng ý';
        }
      }
    }
  } catch (e) {}
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDieuKhoan);
} else {
  initDieuKhoan();
}
