/* =========================================================
   QUẢN LÝ TỆP TIN NGƯỜI DÙNG DÙNG CHUNG - USER-FILES.JS
   Dùng chung cho toàn bộ các công cụ (PDF, Ảnh, Chuyển đổi...)
   và hiển thị danh sách "File của bạn" trên trang chủ.
   ========================================================= */

const UserFiles = {
  /**
   * Lấy thông tin người dùng hiện tại đang lưu trong storage
   */
  getCurrentUser: function() {
    try {
      const saved = localStorage.getItem('toolhub_current_user') || sessionStorage.getItem('toolhub_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Kiểm tra người dùng đã đăng nhập hay chưa
   */
  isLoggedIn: function() {
    if (document.body && document.body.classList.contains('logged-in')) return true;
    const user = this.getCurrentUser();
    return !!(user && (user.id || user.email));
  },

  /**
   * Helper gửi request xử lý file dùng chung cho toàn bộ các trang công cụ
   * - Tự động đính kèm thông tin user (user_id) nếu đã đăng nhập
   * - Tự động giữ phiên cookie cùng nguồn (credentials: 'same-origin')
   */
  uploadAndProcess: function(url, formData) {
    const user = this.getCurrentUser();
    if (user && user.id) {
      if (!formData.has('user_id')) {
        formData.append('user_id', user.id);
      }
    }

    return fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  },

  /**
   * Tải danh sách file của người dùng từ Backend API
   */
  getFiles: function(limit) {
    limit = limit || 50;
    return fetch('/api/user/files?limit=' + limit, {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function(res) {
      if (!res.ok) throw new Error('Không thể tải danh sách tệp.');
      return res.json();
    });
  },

  /**
   * Hiển thị danh sách file vào vùng chứa HTML (vd: #userFileList trên index.html)
   */
  renderFilesList: function(containerId) {
    const container = document.getElementById(containerId || 'userFileList');
    if (!container) return;

    if (!this.isLoggedIn()) {
      container.innerHTML = `
        <p class="file-list-empty" style="padding: 18px 16px; margin: 0; text-align: center; color: #888; font-size: 0.86rem;">
          Vui lòng đăng nhập để xem và quản lý file của bạn.
        </p>
      `;
      return;
    }

    container.innerHTML = `
      <div class="file-list-loading" style="padding: 24px; text-align: center; color: #888;">
        <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang tải danh sách file của bạn...
      </div>
    `;

    const self = this;
    this.getFiles()
      .then(function(result) {
        if (!result || result.status !== 'success' || !result.files || result.files.length === 0) {
          container.innerHTML = `
            <p class="file-list-empty" style="padding: 18px 16px; margin: 0; text-align: center; color: #888; font-size: 0.86rem; line-height: 1.5;">
              Bạn chưa có file nào được lưu trữ. Khi bạn sử dụng các công cụ nén, gộp, chuyển đổi... file kết quả sẽ tự động lưu lại tại đây.
            </p>
          `;

          const recentContainer = document.getElementById('userRecentList');
          if (recentContainer) {
            recentContainer.innerHTML = '<p style="padding: 18px 16px; margin: 0; text-align: center; color: #888; font-size: 0.86rem;">Chưa có hoạt động nào gần đây.</p>';
          }
          return;
        }

        // Render Hoạt động gần đây từ dữ liệu thực tế
        const recentContainer = document.getElementById('userRecentList');
        if (recentContainer) {
          let recentHtml = '';
          const topActivities = result.files.slice(0, 4);
          topActivities.forEach(function(f) {
            const toolTitle = f.tool_title || 'Đã xử lý';
            const displayName = f.original_name || f.file_name || 'Tệp tài liệu';
            const timeAgo = self.formatTimeAgo(f.created_at);

            let iconClass = 'fa-compress-alt';
            if (f.tool_slug === 'gop-pdf') iconClass = 'fa-object-group';
            else if (f.tool_slug === 'tach-pdf') iconClass = 'fa-cut';
            else if (f.tool_slug === 'xoay-pdf') iconClass = 'fa-redo';
            else if (f.tool_slug === 'cat-anh') iconClass = 'fa-crop-alt';
            else if (f.tool_slug === 'tao-ma-qr') iconClass = 'fa-qrcode';

            let subInfo = f.file_size_formatted || '';
            if (f.meta && f.meta.saved_percent > 0) {
              subInfo = `${f.meta.original_size_formatted || ''} → ${f.file_size_formatted || ''} (tiết kiệm ${f.meta.saved_percent}%)`;
            } else if (f.meta && f.meta.saved_percent === 0) {
              subInfo = `Tối ưu hóa tối đa (${f.file_size_formatted || ''})`;
            }

            recentHtml += `
              <div class="recent-item">
                <div class="recent-icon"><i class="fas ${iconClass}"></i></div>
                <div class="recent-body">
                  <strong>${self.escapeHtml(toolTitle)}: ${self.escapeHtml(displayName)}</strong>
                  <span>${self.escapeHtml(subInfo)}</span>
                </div>
                <div class="recent-time">${timeAgo}</div>
              </div>
            `;
          });
          recentContainer.innerHTML = recentHtml;
        }

        let html = '';
        result.files.forEach(function(f) {
          const fileType = (f.file_type || 'pdf').toLowerCase();
          let iconClass = 'pdf';
          let iconFa = 'fas fa-file-pdf';

          if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'image'].includes(fileType)) {
            iconClass = 'img';
            iconFa = 'fas fa-file-image';
          } else if (['doc', 'docx', 'word'].includes(fileType)) {
            iconClass = 'doc';
            iconFa = 'fas fa-file-word';
          } else if (['xls', 'xlsx', 'excel'].includes(fileType)) {
            iconClass = 'doc';
            iconFa = 'fas fa-file-excel';
          } else if (['mp4', 'avi', 'mov', 'video'].includes(fileType)) {
            iconClass = 'vid';
            iconFa = 'fas fa-file-video';
          }

          const displayName = f.file_name || f.original_name || 'Tệp không tên';
          const timeAgo = self.formatTimeAgo(f.created_at);
          const expiryInfo = self.formatExpiryTime(f.created_at);
          const isExpired = expiryInfo.isExpired;

          const downloadBtnHtml = isExpired
            ? `<span class="btn-download" style="opacity: 0.6; cursor: not-allowed; border-color: #ccc; color: #888;" title="Tệp vật lý đã được dọn dẹp sau 30 ngày"><i class="fas fa-history"></i> Đã hết hạn</span>`
            : `<a href="${f.download_url}" class="btn-download" title="Tải file xuống máy"><i class="fas fa-download"></i> Tải xuống</a>`;

          html += `
            <div class="file-item" id="user-file-${f.id}">
              <div class="file-icon ${iconClass}"><i class="${iconFa}"></i></div>
              <div class="file-body">
                <strong title="${self.escapeHtml(displayName)}">${self.escapeHtml(displayName)}</strong>
                <div class="file-meta">
                  <span>${f.file_size_formatted || '0 B'}</span>
                  <span class="dot">•</span>
                  <span>${timeAgo}</span>
                  <span class="dot">•</span>
                  <p style="margin: 0;">${expiryInfo.text}</p>
                </div>
              </div>
              <div class="file-actions">
                ${downloadBtnHtml}
                <button type="button" class="btn-delete-file" title="Xóa file này" onclick="UserFiles.deleteFile(${f.id})">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          `;
        });

        container.innerHTML = html;
      })
      .catch(function(err) {
        console.error('Lỗi khi tải file người dùng:', err);
        container.innerHTML = `
          <div class="file-list-empty" style="padding: 24px; text-align: center; color: #c0392b;">
            <i class="fas fa-exclamation-triangle" style="margin-bottom: 8px; display: block; font-size: 1.5rem;"></i>
            Không thể tải danh sách tệp. Vui lòng thử lại sau.
          </div>
        `;
      });
  },

  /**
   * Xóa một file của người dùng
   */
  deleteFile: function(fileId) {
    if (!confirm('Bạn có chắc chắn muốn xóa file này khỏi danh sách và bộ nhớ máy chủ?')) {
      return;
    }

    const itemEl = document.getElementById('user-file-' + fileId);
    if (itemEl) {
      itemEl.style.opacity = '0.5';
      itemEl.style.pointerEvents = 'none';
    }

    const self = this;
    fetch('/api/user/files/' + fileId, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.status === 'success') {
          if (itemEl) {
            itemEl.style.transition = 'all 0.3s ease';
            itemEl.style.height = '0';
            itemEl.style.padding = '0 14px';
            itemEl.style.overflow = 'hidden';
            setTimeout(function() {
              if (itemEl.parentNode) itemEl.parentNode.removeChild(itemEl);
              // Kiểm tra nếu danh sách trống thì render lại trạng thái trống
              const container = document.getElementById('userFileList');
              if (container && container.querySelectorAll('.file-item').length === 0) {
                self.renderFilesList('userFileList');
              }
            }, 300);
          }
          // Cập nhật lại số liệu thống kê
          self.updateDashboardStats();
        } else {
          alert((data && data.message) ? data.message : 'Xóa file thất bại.');
          if (itemEl) {
            itemEl.style.opacity = '1';
            itemEl.style.pointerEvents = '';
          }
        }
      })
      .catch(function(err) {
        alert('Có lỗi xảy ra khi kết nối máy chủ.');
        if (itemEl) {
          itemEl.style.opacity = '1';
          itemEl.style.pointerEvents = '';
        }
      });
  },

  /**
   * Lấy số liệu thống kê thực tế cập nhật cho các thẻ Dashboard
   */
  updateDashboardStats: function() {
    if (!this.isLoggedIn()) return;

    fetch('/api/user/stats', {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data || data.status !== 'success' || !data.stats) return;
        const stats = data.stats;

        // Thẻ 1: Công cụ đã dùng
        const statToolsUsed = document.getElementById('statToolsUsed');
        if (statToolsUsed && stats.tools_used_count !== undefined) {
          statToolsUsed.textContent = stats.tools_used_count || '0';
        }

        // Thẻ 2: File đã xử lý
        const statFilesCount = document.getElementById('statProcessedFiles');
        const statFilesSub = document.getElementById('statProcessedSize');
        if (statFilesCount) statFilesCount.textContent = stats.total_files || '0';
        if (statFilesSub) statFilesSub.textContent = 'Tổng dung lượng ' + (stats.total_size_formatted || '0 B');

        // Thẻ 3: Tiết kiệm / Dung lượng lưu trữ
        const statSavedSize = document.getElementById('statSavedSize');
        if (statSavedSize) {
          statSavedSize.textContent = stats.total_saved_formatted || '0 B';
        }
      })
      .catch(function() {});
  },

  /**
   * Chuyển đổi chuỗi ISO sang đối tượng Date đảm bảo đồng bộ múi giờ UTC
   */
  parseDate: function(isoString) {
    if (!isoString) return new Date();
    let s = String(isoString).trim();
    // Nếu chuỗi thời gian chưa có định danh múi giờ, thêm 'Z' để JS parse chính xác theo UTC
    if (!s.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(s)) {
      s += 'Z';
    }
    return new Date(s);
  },

  /**
   * Định dạng thời gian tương đối thân thiện (VD: Vừa xong, 5 phút trước, Hôm qua)
   */
  formatTimeAgo: function(isoString) {
    if (!isoString) return 'Gần đây';
    try {
      const now = new Date();
      const past = this.parseDate(isoString);
      const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (diffSec < 60) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return diffMin + ' phút trước';
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return diffHour + ' giờ trước';
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay === 1) return 'Hôm qua';
      if (diffDay < 30) return diffDay + ' ngày trước';
      return past.toLocaleDateString('vi-VN');
    } catch (e) {
      return 'Gần đây';
    }
  },

  /**
   * Tính toán thời gian hết hạn lưu trữ thực tế (mốc 30 ngày kể từ lúc tạo)
   */
  formatExpiryTime: function(isoString) {
    if (!isoString) {
      return { text: 'sẽ bị xóa sau 30 ngày', isExpired: false };
    }
    try {
      const created = this.parseDate(isoString);
      // Hạn chót = thời điểm tạo + 30 ngày
      const expireDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffMs = expireDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        return { text: 'đã hết hạn lưu trữ', isExpired: true };
      }

      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays > 1) {
        return { text: `sẽ bị xóa sau ${diffDays} ngày`, isExpired: false };
      }

      const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
      if (diffHours > 1) {
        return { text: `sẽ bị xóa sau ${diffHours} giờ`, isExpired: false };
      }

      const diffMins = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
      return { text: `sẽ bị xóa sau ${diffMins} phút`, isExpired: false };
    } catch (e) {
      return { text: 'sẽ bị xóa sau 30 ngày', isExpired: false };
    }
  },

  /**
   * Chống XSS
   */
  escapeHtml: function(s) {
    return String(s || '').replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
};

// Đăng ký toàn cục để các script khác sử dụng trực tiếp
window.UserFiles = UserFiles;
