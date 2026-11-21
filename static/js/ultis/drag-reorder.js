/* =========================================================
   DRAG & DROP REORDER UTILITY - DRAG-REORDER.JS
   Hỗ trợ kéo thả sắp xếp các thẻ (File Cards) trực quan, mượt mà
   Tái sử dụng cho: Gộp PDF, Ghép ảnh, Tách trang PDF, v.v.
   ========================================================= */

(function(global) {
  'use strict';

  /**
   * Khởi tạo tính năng kéo thả sắp xếp cho danh sách card
   * @param {Object} options
   *   - container: selector (chuỗi) hoặc HTMLElement
   *   - itemSelector: selector của từng card con (mặc định: '.file-card')
   *   - updateBadgeOrders: boolean, tự động đánh số lại .file-card-order nếu có (mặc định: true)
   *   - onReorder: callback(oldIndex, newIndex) khi người dùng hoàn thành việc kéo thả
   */
  function initDragReorder(options) {
    const config = Object.assign({
      container: '#fileCardWrap',
      itemSelector: '.file-card',
      updateBadgeOrders: true,
      onReorder: null
    }, options);

    const container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;

    if (!container) return null;

    let draggedItem = null;
    let initialIndex = -1;

    // Cập nhật lại số thứ tự hiển thị của các thẻ (.file-card-order)
    function updateBadgeOrders() {
      if (!config.updateBadgeOrders) return;
      const items = container.querySelectorAll(config.itemSelector);
      items.forEach((item, index) => {
        item.dataset.dragIndex = index;
        const badge = item.querySelector('.file-card-order');
        if (badge) {
          badge.textContent = index + 1;
        }
      });
    }

    // Đảm bảo tất cả các thẻ có thuộc tính draggable="true"
    function bindDraggable() {
      const items = container.querySelectorAll(config.itemSelector);
      items.forEach((item, index) => {
        item.setAttribute('draggable', 'true');
        item.dataset.dragIndex = index;
      });
    }

    function onDragStart(e) {
      // Bỏ qua nếu bấm vào các nút hành động, nút xóa, input hoặc link
      const interactive = e.target.closest('button, a, input, select, textarea, .btn-remove-file, .btn-card-action, .file-card-actions');
      if (interactive) {
        e.preventDefault();
        return;
      }

      const item = e.target.closest(config.itemSelector);
      if (!item || !container.contains(item)) return;

      draggedItem = item;
      const allItems = Array.from(container.querySelectorAll(config.itemSelector));
      initialIndex = allItems.indexOf(draggedItem);

      e.dataTransfer.effectAllowed = 'move';
      // Đặt data để tương thích mọi trình duyệt (kể cả Firefox/Safari)
      e.dataTransfer.setData('text/plain', String(initialIndex));

      // Thêm class dragging sau 1 frame nhỏ để browser kịp render drag-ghost
      requestAnimationFrame(() => {
        if (draggedItem) {
          draggedItem.classList.add('dragging');
        }
      });
    }

    function onDragOver(e) {
      if (!draggedItem) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const target = e.target.closest(config.itemSelector);
      if (!target || target === draggedItem || !container.contains(target)) return;

      const allItems = Array.from(container.querySelectorAll(config.itemSelector));
      const draggedPos = allItems.indexOf(draggedItem);
      const targetPos = allItems.indexOf(target);

      if (draggedPos === -1 || targetPos === -1) return;

      // Di chuyển DOM node
      if (draggedPos < targetPos) {
        // Đang kéo từ trước ra sau -> chèn sau target
        container.insertBefore(draggedItem, target.nextSibling);
      } else {
        // Đang kéo từ sau lên trước -> chèn trước target
        container.insertBefore(draggedItem, target);
      }

      updateBadgeOrders();
    }

    function onDrop(e) {
      e.preventDefault();
    }

    function onDragEnd(e) {
      if (!draggedItem) return;

      draggedItem.classList.remove('dragging');

      const allItems = Array.from(container.querySelectorAll(config.itemSelector));
      const finalIndex = allItems.indexOf(draggedItem);

      updateBadgeOrders();

      if (initialIndex !== -1 && finalIndex !== -1 && initialIndex !== finalIndex) {
        if (typeof config.onReorder === 'function') {
          config.onReorder(initialIndex, finalIndex);
        }
      }

      draggedItem = null;
      initialIndex = -1;
    }

    // Xóa listener cũ nếu đã từng bind trên container này
    if (container._dragReorderCleanup) {
      container._dragReorderCleanup();
    }

    container.addEventListener('dragstart', onDragStart);
    container.addEventListener('dragover', onDragOver);
    container.addEventListener('drop', onDrop);
    container.addEventListener('dragend', onDragEnd);

    container._dragReorderCleanup = function() {
      container.removeEventListener('dragstart', onDragStart);
      container.removeEventListener('dragover', onDragOver);
      container.removeEventListener('drop', onDrop);
      container.removeEventListener('dragend', onDragEnd);
    };

    bindDraggable();
    updateBadgeOrders();

    return {
      refresh: function() {
        bindDraggable();
        updateBadgeOrders();
      },
      updateBadges: updateBadgeOrders,
      destroy: function() {
        if (container._dragReorderCleanup) {
          container._dragReorderCleanup();
          delete container._dragReorderCleanup;
        }
      }
    };
  }

  global.DragReorder = {
    init: initDragReorder
  };

})(typeof window !== 'undefined' ? window : this);
