/* =========================================================
   TRANG TRỢ GIÚP - TROGIUP.JS
   Hỏi đáp FAQ, tìm kiếm nội dung trợ giúp và thanh mục lục cuộn
   ========================================================= */

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');

  // Đóng tất cả item khác (chỉ mở 1 tại 1 thời điểm)
  document.querySelectorAll('.faq-item.open').forEach(function(el) {
    if (el !== item) el.classList.remove('open');
  });

  item.classList.toggle('open', !isOpen);
}

function openFaq(id) {
  const item = document.getElementById(id);
  if (!item) return;

  document.querySelectorAll('.faq-item.open').forEach(function(el) {
    el.classList.remove('open');
  });
  item.classList.add('open');

  const faqSection = document.getElementById('faq');
  if (faqSection) {
    setTimeout(function() {
      faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

function doHelpSearch() {
  const input = document.getElementById('helpSearchInput');
  if (!input) return;
  const q = input.value.trim();
  if (!q) {
    alert('Vui lòng nhập từ khóa tìm kiếm.');
    return;
  }

  const lower = q.toLowerCase();
  let matchedFaq = null;

  document.querySelectorAll('.faq-item').forEach(function(item) {
    const text = item.textContent.toLowerCase();
    if (!matchedFaq && text.indexOf(lower) !== -1) {
      matchedFaq = item;
    }
  });

  let matchedSection = null;
  document.querySelectorAll('.help-section').forEach(function(sec) {
    if (!matchedSection && sec.textContent.toLowerCase().indexOf(lower) !== -1) {
      matchedSection = sec;
    }
  });

  if (matchedFaq) {
    openFaq(matchedFaq.id);
  } else if (matchedSection) {
    matchedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    alert('Không tìm thấy kết quả cho "' + q + '".\nVui lòng thử từ khóa khác hoặc liên hệ hotro@toolhub.vn.');
  }
}

function initTroGiup() {
  // Enter trong ô tìm kiếm trợ giúp
  const helpInput = document.getElementById('helpSearchInput');
  if (helpInput) {
    helpInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doHelpSearch();
      }
    });
  }

  // Scroll spy cập nhật active link trong mục lục
  const sections = document.querySelectorAll('.help-section');
  const tocLinks = document.querySelectorAll('.toc-menu a[data-toc]');

  function updateTocActive() {
    let currentId = null;
    const scrollPos = window.scrollY + 120;

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

  // Cuộn mượt khi click mục lục
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
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTroGiup);
} else {
  initTroGiup();
}
