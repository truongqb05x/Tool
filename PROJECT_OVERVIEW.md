# TOOLHUB — TÀI LIỆU KIẾN TRÚC & HƯỚNG DẪN DỰ ÁN

> **Tài liệu bàn giao & quy chuẩn kiến trúc hệ thống**  
> Dành cho các phiên làm việc tiếp theo, lập trình viên và trợ lý AI để nắm bắt toàn diện dự án.

---

## 1. TỔNG QUAN DỰ ÁN

* **Tên dự án:** ToolHub (Nền tảng công cụ tiện ích trực tuyến tổng hợp).
* **Phân hệ công cụ:** Công cụ PDF, Chỉnh sửa ảnh, Chuyển đổi định dạng, Ứng dụng & Tiện ích web.
* **Phong cách giao diện (Design Language):** Classic Web / Vintage UI (tông màu trung tính `#e8e8e0`, viền `#ccc`, màu điểm nhấn xanh navy `#1e5b9c`, xanh lá `#27ae60`, hộp thoại kiểu cổ điển, responsive đầy đủ trên điện thoại và máy tính).
* **Tối ưu hóa:** 100% chuẩn On-page SEO (URL tĩnh thân thiện, thẻ H1/H2, meta tags, FAQ Schema, bài viết hướng dẫn tích hợp).

---

## 2. KIẾN TRÚC THƯ MỤC & PHÂN BỔ TRÁCH NHIỆM

```text
d:\starup\web\Tools\
│
├── PROJECT_OVERVIEW.md                    # File này (Tài liệu tổng quan hệ thống)
│
├── templates/                             # Thư mục giao diện HTML
│   ├── index.html                         # Trang chủ (Sidebar danh mục, Bảng công cụ, Giao diện Dashboard thành viên)
│   ├── trogiup.html                       # Trung tâm trợ giúp (FAQ accordion, scroll spy mục lục, tìm kiếm hướng dẫn)
│   ├── dieukhoan.html                     # Điều khoản sử dụng & Chính sách bảo mật (Scroll spy, xác nhận chấp thuận)
│   ├── chon-file.html                     # Trang chọn file cơ bản (dự phòng)
│   ├── xuly.html                          # Trang xử lý workspace mẫu (dự phòng)
│   │
│   ├── pdf/                               # 📁 CHUYÊN MỤC CÔNG CỤ PDF (Chuẩn SEO)
│   │   ├── nen-pdf.html                   # Nén file PDF trực tuyến (1-Page Workflow)
│   │   ├── gop-pdf.html                   # Gộp nhiều file PDF thành một tệp
│   │   ├── tach-pdf.html                  # (Kế thừa template chuẩn)
│   │   └── pdf-sang-word.html             # (Kế thừa template chuẩn)
│   │
│   ├── anh/                               # 📁 CHUYÊN MỤC CHỈNH SỬA ẢNH
│   │   ├── cat-anh.html                   # Cắt & Xoay góc ảnh (Tỉ lệ 1:1, 16:9, 4:3)
│   │   ├── ghep-anh.html                  # Ghép nhiều ảnh thành bố cục
│   │   └── xoa-phong-nen.html             # Tách / xóa nền ảnh tự động
│   │
│   ├── tien-ich/                          # 📁 CHUYÊN MỤC TIỆN ÍCH & APP
│   │   ├── tao-ma-qr.html                 # Tạo mã QR tùy biến màu sắc, xuất PNG
│   │   └── may-tinh-online.html           # Máy tính tính toán trực tuyến
│   │
│   └── chuyen-doi/                        # 📁 CHUYÊN MỤC CHUYỂN ĐỔI ĐỊNH DẠNG
│       ├── word-sang-pdf.html
│       ├── excel-sang-pdf.html
│       └── anh-sang-pdf.html
│
└── static/
    ├── css/
    │   ├── layout/                        # CSS bố cục dùng chung toàn hệ thống
    │   │   ├── base.css                   # Reset, container, button và utility .sr-only
    │   │   ├── header.css                 # Header đồng nhất, logo, search input, dropdown user
    │   │   ├── footer.css                 # Footer 4 cột & bottom bar bản quyền
    │   │   ├── modal.css                  # Modal auth + Classic System Dialog + Classic Toast
    │   │   ├── topbar.css                 # Thanh thông báo trên cùng
    │   │   └── workspace.css              # Khung chia 2 cột (File preview trái + Sidebar tùy chọn phải)
    │   │
    │   ├── pages/                         # CSS riêng biệt cho từng trang tĩnh
    │   │   ├── index.css                  # Bố cục trang chủ, sidebar menu, card công cụ
    │   │   ├── trogiup.css                # Mục lục trợ giúp, callout ghi chú
    │   │   └── dieukhoan.css              # Bảng biểu điều khoản, khung chấp thuận
    │   │
    │   └── tools/                         # CSS chuyên dùng cho các trang công cụ
    │       └── tool-page.css              # Breadcrumb, Hero, Drop zone, 1-Page Workspace, SEO sections
    │
    └── js/
        ├── app.js                         # File điều phối trung tâm (Tự tính đường dẫn tương đối để nạp ultis)
        │
        ├── ultis/                         # Các module tiện ích dùng chung
        │   ├── helpers.js                 # Chuẩn hóa tiếng Việt bỏ dấu (removeDiacritics), chống XSS (escapeHtml), fakeDownload
        │   ├── sidebar.js                 # Accordion mở/đóng danh mục bên trái (initSidebar)
        │   ├── search.js                  # Dữ liệu TOOL_DATA, gợi ý Autocomplete, resolveToolUrl
        │   ├── auth.js                    # Quản lý Đăng nhập / Đăng ký / Quên mật khẩu / Classic Dialog / Live Toast
        │   └── user.js                    # Quản lý phiên đăng nhập (LocalStorage/SessionStorage), avatar, dropdown
        │
        └── tools/                         # Logic xử lý chuyên biệt cho từng công cụ
            ├── pdf/
            │   ├── nen-pdf.js             # Kéo thả file PDF, 3 mức nén, tính toán % giảm dung lượng, tải file
            │   └── gop-pdf.js             # Quản lý mảng nhiều file, nút đổi thứ tự ↑/↓, xóa file, gộp PDF
            ├── anh/
            │   └── cat-anh.js             # Đọc ảnh FileReader, xem trước, xoay 90°, chọn tỉ lệ khung hình
            └── tien-ich/
                └── tao-ma-qr.js           # Sinh mã QR SVG thời gian thực, bảng 4 màu, tải ảnh PNG
```

---

## 3. NGUYÊN TẮC HOẠT ĐỘNG & QUY CHUẨN THIẾT KẾ

### 3.1. Mô hình 1-Page Workflow (Tối ưu SEO & UX)
Mỗi trang công cụ (ví dụ `templates/pdf/nen-pdf.html`) không chuyển hướng sang trang trắng rời rạc mà tích hợp cả 3 trạng thái ngay trên một URL duy nhất:
1. **Trạng thái 1 (`#uploadPanel`)**: Hiển thị Hero title, vùng kéo thả file (`#dropZone`) và toàn bộ bài viết chuẩn SEO phía dưới.
2. **Trạng thái 2 (`#toolWorkspace`)**: Xuất hiện ngay khi người dùng chọn/kéo thả file. Cột trái hiển thị thông tin/xem trước file; cột phải hiển thị bảng tùy chọn chuyên biệt của công cụ đó.
3. **Trạng thái 3 (`#downloadCard`)**: Xuất hiện khi bấm nút thực hiện (sau khoảng thời gian mô phỏng tiến trình 1.2s), hiển thị thông số kết quả kèm nút tải file và nút làm lại file khác.

### 3.2. Bộ nạp động thông minh `app.js`
Do các trang HTML nằm ở các độ sâu thư mục khác nhau (`templates/index.html` vs `templates/pdf/nen-pdf.html`), file `static/js/app.js` được lập trình để tự động dò tìm vị trí của chính nó thông qua thẻ `<script src="...app.js">`:
* Nếu trang ở `templates/*.html`: nạp `../static/js/ultis/*.js`
* Nếu trang ở `templates/*/*.html`: nạp `../../static/js/ultis/*.js`
* Cơ chế dùng `document.write` tuần tự đảm bảo tương thích 100% với giao thức mở file cục bộ (`file://`) mà không bị rào cản CORS của trình duyệt như ES modules.

### 3.3. Điều hướng tìm kiếm thông minh `resolveToolUrl()`
Trong `static/js/ultis/search.js`, danh sách `TOOL_DATA` định nghĩa đường dẫn tĩnh (ví dụ: `pdf/nen-pdf.html`). Hàm `resolveToolUrl()` sẽ tự kiểm tra `window.location.pathname`:
* Nếu đang ở trang con (trong thư mục `/pdf/`, `/anh/`...): tự động thêm tiền tố `../` để link không bị gãy.

### 3.4. Hệ thống thông báo cổ điển (Classic Notice System)
* **Classic Dialog (`.classic-dialog-overlay`)**: Hộp thoại thông báo mô phỏng gửi email kích hoạt, khôi phục mật khẩu tạm thời `ToolHub@2025`.
* **Classic Live Toast (`.classic-toast-container`)**: Thông báo nhỏ góc dưới bên phải màn hình trượt vào định kỳ (~32s) mô phỏng người dùng mới đăng ký, tăng tính sống động cho website.
* **Đóng mở linh hoạt**: Hỗ trợ phím `Escape`, click vùng tối bên ngoài overlay hoặc nút bấm hành động.

---

## 4. HƯỚNG DẪN TẠO THÊM CÔNG CỤ MỚI (TEMPLATE CHUẨN)

Khi cần tạo một công cụ mới trong tương lai (ví dụ: `templates/pdf/tach-pdf.html`):

1. **Bước 1: Tạo file HTML** tại thư mục danh mục tương ứng (ví dụ `templates/pdf/tach-pdf.html`):
   * Kế thừa cấu trúc từ [nen-pdf.html](file:///d:/starup/web/Tools/templates/pdf/nen-pdf.html).
   * Thay đổi thẻ `<title>`, `<meta name="description">`, `<h1>`, nội dung 3 bước và FAQ chuẩn SEO.
   * Nhúng CSS:
     ```html
     <link rel="stylesheet" href="../../static/css/layout/base.css">
     <link rel="stylesheet" href="../../static/css/layout/header.css">
     <link rel="stylesheet" href="../../static/css/layout/footer.css">
     <link rel="stylesheet" href="../../static/css/layout/modal.css">
     <link rel="stylesheet" href="../../static/css/tools/tool-page.css">
     ```
   * Cuối thẻ `<body>`:
     ```html
     <script src="../../static/js/app.js"></script>
     <script src="../../static/js/tools/pdf/tach-pdf.js"></script>
     ```

2. **Bước 2: Tạo file JavaScript chuyên biệt** tại `static/js/tools/pdf/tach-pdf.js`:
   * Viết logic lắng nghe file, hiển thị workspace, các nút tùy chọn riêng của tính năng tách trang và gọi `fakeDownload` khi hoàn tất.

3. **Bước 3: Đăng ký vào thanh tìm kiếm**:
   * Mở [static/js/ultis/search.js](file:///d:/starup/web/Tools/static/js/ultis/search.js) và cập nhật thuộc tính `url` của công cụ đó trong mảng `TOOL_DATA`.

4. **Bước 4: Kiểm tra tính hợp lệ thẻ HTML**:
   * Đảm bảo tất cả các thẻ mở đều có thẻ đóng tương ứng, không có lỗi cấu trúc (`Unclosed: [], Errors: 0`).
