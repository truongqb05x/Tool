/* =========================================================
   PDF THUMBNAIL RENDERER - PDF-PREVIEW.JS
   Sử dụng PDF.js để hiển thị bản xem trước trang đầu tiên của file PDF
   ========================================================= */

if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
}

let currentLoadedPdfDoc = null;
let currentLoadedFile = null;
let currentPreviewRotation = 0;

function renderPdfFirstPageThumbnail(file, containerId) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container || !file) return;

  currentLoadedFile = file;
  currentLoadedPdfDoc = null;
  currentPreviewRotation = 0;

  // Nếu file là hình ảnh (JPG, PNG, WEBP, v.v.)
  if (file.type && file.type.startsWith('image/')) {
    const imgUrl = URL.createObjectURL(file);
    container.innerHTML = `
      <img src="${imgUrl}" alt="Xem trước ảnh" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:2px; box-shadow:0 2px 8px rgba(0,0,0,0.12); display:block; margin:auto;" onload="URL.revokeObjectURL(this.src)">
    `;
    return;
  }

  // Hiển thị loading spinner
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; height:100%; color:#1e5b9c;">
      <i class="fas fa-spinner fa-spin" style="font-size:1.8rem;"></i>
      <span style="font-size:0.75rem; color:#888;">Đang tạo bản xem trước...</span>
    </div>
  `;

  // Kiểm tra thư viện pdfjsLib
  if (typeof pdfjsLib === 'undefined') {
    console.warn('Thư viện PDF.js chưa sẵn sàng.');
    restoreDefaultMockup(container);
    return;
  }

  // Đảm bảo worker được cấu hình
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const typedarray = new Uint8Array(e.target.result);

    pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
      currentLoadedPdfDoc = pdf;
      // Lấy trang đầu tiên (trang 1)
      return pdf.getPage(1);
    }).then(function(page) {
      // Tính toán kích thước vừa vặn khung xem trước
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetHeight = 220;
      const scale = targetHeight / unscaledViewport.height;
      const viewport = page.getViewport({ scale: scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.display = 'block';
      canvas.style.margin = 'auto';
      canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      canvas.style.borderRadius = '2px';
      canvas.style.backgroundColor = '#ffffff';

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };

      page.render(renderContext).promise.then(function() {
        container.innerHTML = '';
        container.appendChild(canvas);
      }).catch(function(err) {
        console.error('Lỗi render trang PDF:', err);
        restoreDefaultMockup(container);
      });
    }).catch(function(err) {
      console.error('Lỗi đọc file PDF:', err);
      restoreDefaultMockup(container);
    });
  };

  reader.onerror = function() {
    restoreDefaultMockup(container);
  };

  reader.readAsArrayBuffer(file);
}

function rotatePreview(degrees = 90) {
  currentPreviewRotation = (currentPreviewRotation + degrees) % 360;
  if (currentPreviewRotation < 0) currentPreviewRotation += 360;

  const fileCard = document.getElementById('fileCard');
  if (fileCard) {
    fileCard.dataset.rotation = currentPreviewRotation;
  }

  const previewEl = document.getElementById('filePreview');
  if (previewEl) {
    const targetEl = previewEl.querySelector('canvas') || previewEl.querySelector('img') || previewEl.querySelector('.paper-mockup');
    if (targetEl) {
      targetEl.style.transition = 'transform 0.3s ease';
      targetEl.style.transform = `rotate(${currentPreviewRotation}deg)`;
    }
  }

  // Cập nhật cả trong lightbox nếu đang mở
  const modalTarget = document.querySelector('#zoomModalContent canvas') || document.querySelector('#zoomModalContent img');
  if (modalTarget) {
    modalTarget.style.transition = 'transform 0.3s ease';
    modalTarget.style.transform = `rotate(${currentPreviewRotation}deg)`;
  }
}

function ensurePdfZoomModal() {
  if (document.getElementById('pdfZoomModal')) return;

  const modalHtml = `
    <div class="pdf-lightbox-overlay" id="pdfZoomModal" onclick="closePdfZoomModal(event)">
      <div class="pdf-lightbox-wrapper" onclick="event.stopPropagation()">
        <button type="button" class="pdf-lightbox-close" onclick="closePdfZoomModal()" title="Đóng">
          <i class="fas fa-times"></i>
        </button>
        <div id="zoomModalContent" class="pdf-lightbox-content"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openPdfZoomModal(rotation) {
  ensurePdfZoomModal();

  const modal = document.getElementById('pdfZoomModal');
  const content = document.getElementById('zoomModalContent');
  const previewEl = document.getElementById('filePreview');

  if (!modal || !content) return;

  // Tự động phát hiện góc xoay chính xác từ tham số, data-rotation trên DOM, hoặc biến toàn cục
  let rot = typeof rotation === 'number' ? rotation : null;
  if (rot === null) {
    const fileCard = document.getElementById('fileCard');
    if (fileCard && fileCard.dataset.rotation !== undefined) {
      rot = parseInt(fileCard.dataset.rotation, 10) || 0;
    } else if (typeof currentRotationAngle !== 'undefined') {
      rot = currentRotationAngle || 0;
    } else {
      rot = currentPreviewRotation || 0;
    }
  }
  currentPreviewRotation = rot;

  content.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; padding: 40px; color:#fff;">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-right:12px;"></i> Đang tải trang rõ nét...
    </div>
  `;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Trường hợp 1: Có PDF document đã nạp -> render lại trang 1 với độ phân giải lớn, sắc nét
  if (currentLoadedPdfDoc) {
    currentLoadedPdfDoc.getPage(1).then(function(page) {
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetHeight = Math.min(window.innerHeight * 0.88, 1400);
      const scale = targetHeight / unscaledViewport.height;
      const viewport = page.getViewport({ scale: scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.transform = `rotate(${currentPreviewRotation}deg)`;
      canvas.style.transition = 'transform 0.3s ease';

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };

      page.render(renderContext).promise.then(function() {
        content.innerHTML = '';
        content.appendChild(canvas);
      }).catch(function(err) {
        console.error('Lỗi render zoom PDF:', err);
        fallbackZoomContent(content, previewEl);
      });
    }).catch(function(err) {
      console.error('Lỗi getPage PDF zoom:', err);
      fallbackZoomContent(content, previewEl);
    });
  } 
  // Trường hợp 2: Là file ảnh
  else if (currentLoadedFile && currentLoadedFile.type && currentLoadedFile.type.startsWith('image/')) {
    const zoomImg = document.createElement('img');
    const objectUrl = URL.createObjectURL(currentLoadedFile);
    zoomImg.src = objectUrl;
    zoomImg.onload = function() {
      URL.revokeObjectURL(objectUrl);
    };
    zoomImg.style.transform = `rotate(${currentPreviewRotation}deg)`;
    zoomImg.style.transition = 'transform 0.3s ease';
    content.innerHTML = '';
    content.appendChild(zoomImg);
  } 
  // Trường hợp 3: Fallback lấy ảnh từ canvas hoặc preview hiện có
  else {
    fallbackZoomContent(content, previewEl);
  }
}

function fallbackZoomContent(content, previewEl) {
  if (!previewEl) {
    content.innerHTML = '<div style="padding:40px; color:#fff;">Chưa có bản xem trước tài liệu.</div>';
    return;
  }
  const canvas = previewEl.querySelector('canvas');
  const img = previewEl.querySelector('img');

  if (canvas) {
    const zoomImg = document.createElement('img');
    zoomImg.src = canvas.toDataURL();
    zoomImg.style.transform = `rotate(${currentPreviewRotation}deg)`;
    zoomImg.style.transition = 'transform 0.3s ease';
    content.innerHTML = '';
    content.appendChild(zoomImg);
  } else if (img) {
    const zoomImg = document.createElement('img');
    zoomImg.src = img.src;
    zoomImg.style.transform = `rotate(${currentPreviewRotation}deg)`;
    zoomImg.style.transition = 'transform 0.3s ease';
    content.innerHTML = '';
    content.appendChild(zoomImg);
  } else {
    content.innerHTML = '<div style="padding:40px; color:#fff;">Chưa có bản xem trước tài liệu.</div>';
  }
}

function closePdfZoomModal(e) {
  const modal = document.getElementById('pdfZoomModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Bấm phím Escape để đóng modal zoom
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closePdfZoomModal();
  }
});

function restoreDefaultMockup(containerId) {
  currentPreviewRotation = 0;
  currentLoadedPdfDoc = null;
  currentLoadedFile = null;
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;
  container.innerHTML = `
    <div class="paper-mockup" style="position:relative; display:flex; flex-direction:column;">
      <div style="position:absolute; bottom:8px; right:8px; font-size:1.8rem; color:#e74c3c; opacity:0.3;"><i class="fas fa-file-pdf"></i></div>
      <div class="line title"></div>
      <div class="line"></div>
      <div class="line short"></div>
      <div class="line"></div>
      <div class="line block"></div>
      <div class="line"></div>
      <div class="line short"></div>
    </div>
  `;
}
