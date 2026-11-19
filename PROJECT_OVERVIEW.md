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
├── app.py                                 # 🚀 Backend Entry Point: Khởi chạy Flask App từ package src
├── .gitignore                             # Cấu hình bỏ qua cache, file tạm tải lên
│
├── src/                                   # 📦 TOÀN BỘ MÃ NGUỒN BACKEND
│   ├── __init__.py                        # Factory Pattern: create_app() cấu hình Flask, nạp routes
│   ├── config.py                          # ⚙️ Cấu hình Backend: Secret Key, Upload Folder, Max Content Length
│   │
│   ├── routes/                            # 🌐 TẦNG PAGE ROUTES & API BLUEPRINTS
│   │   ├── __init__.py                    # Hàm register_routes(app) gom toàn bộ blueprints
│   │   ├── main_routes.py                 # Route trang chủ (/), trợ giúp (/trogiup), điều khoản (/dieukhoan)
│   │   ├── pdf_routes.py                  # Route 24 công cụ PDF (/pdf/<slug> & /pdf/<slug>.html) + API (/pdf/api/<action>)
│   │   ├── image_routes.py                # Route chuyên mục Ảnh (/anh/cat-anh, /anh/xoa-phong-nen, ...)
│   │   ├── utility_routes.py              # Route chuyên mục Tiện ích (/tien-ich/tao-ma-qr, ...)
│   │   └── conversion_routes.py           # Route chuyên mục Chuyển đổi (/chuyen-doi/word-sang-pdf, ...)
│   │
│   ├── services/                          # ⚙️ TẦNG LOGIC NGHIỆP VỤ (SERVICE LAYER)
│   │   ├── __init__.py
│   │   ├── pdf_service.py                 # PdfService: Đầy đủ 24 method xử lý file PDF sẵn sàng tích hợp thư viện
│   │   ├── image_service.py               # Xử lý cắt, ghép, xoay, tách nền ảnh (Pillow, rembg)
│   │   └── qr_service.py                  # Sinh mã QR code, xuất file (qrcode)
│   │
│   └── utils/                             # 🛠️ TẦNG TIỆN ÍCH BACKEND
│       ├── __init__.py
│       └── file_handler.py                # Kiểm tra đuôi file (allowed_file), làm sạch tên file
│
├── uploads/                               # 📁 Thư mục lưu trữ tạm thời các file tải lên
│
├── templates/                             # Thư mục giao diện HTML
│   ├── index.html                         # Trang chủ (Sidebar 24 công cụ PDF, Bảng công cụ, Dashboard)
│   ├── trogiup.html                       # Trung tâm trợ giúp
│   ├── dieukhoan.html                     # Điều khoản sử dụng & Chính sách bảo mật
│   │
│   ├── pdf/                               # 📁 CHUYÊN MỤC CÔNG CỤ PDF (Trang danh mục + 24 file template chuẩn SEO 1-Page Workflow)
│   │   ├── index.html                     # 🌟 Trang danh mục tất cả 24 công cụ PDF (Bộ lọc tìm kiếm, 5 nhóm chức năng)
│   │   ├── nen-pdf.html                   # 1. Nén PDF
│   │   ├── gop-pdf.html                   # 2. Gộp PDF
│   │   ├── tach-pdf.html                  # 3. Tách PDF
│   │   ├── xoay-pdf.html                  # 4. Xoay PDF
│   │   ├── xoa-trang-pdf.html             # 5. Xóa trang PDF
│   │   ├── sap-xep-trang-pdf.html         # 6. Sắp xếp trang PDF
│   │   ├── trich-xuat-trang-pdf.html      # 7. Trích xuất trang PDF
│   │   ├── pdf-sang-word.html             # 8. Chuyển PDF sang Word
│   │   ├── pdf-sang-excel.html            # 9. Chuyển PDF sang Excel
│   │   ├── pdf-sang-powerpoint.html       # 10. Chuyển PDF sang PowerPoint
│   │   ├── word-sang-pdf.html             # 11. Chuyển Word sang PDF
│   │   ├── excel-sang-pdf.html            # 12. Chuyển Excel sang PDF
│   │   ├── powerpoint-sang-pdf.html       # 13. Chuyển PowerPoint sang PDF
│   │   ├── pdf-sang-anh.html              # 14. PDF sang ảnh
│   │   ├── anh-sang-pdf.html              # 15. Ảnh sang PDF
│   │   ├── chinh-sua-pdf.html             # 16. Chỉnh sửa PDF
│   │   ├── them-so-trang-pdf.html         # 17. Thêm số trang PDF
│   │   ├── them-watermark-pdf.html        # 18. Thêm watermark PDF
│   │   ├── bao-ve-pdf.html                # 19. Bảo vệ PDF bằng mật khẩu
│   │   ├── mo-khoa-pdf.html               # 20. Mở khóa PDF
│   │   ├── ky-pdf.html                    # 21. Ký PDF
│   │   ├── so-sanh-pdf.html               # 22. So sánh PDF
│   │   ├── ocr-pdf.html                   # 23. OCR PDF
│   │   └── doc-thong-tin-pdf.html         # 24. Đọc thông tin PDF
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
    ├── img/
    │   └── logo.png                       # 🖼️ Logo chính thức của ToolHub (Favicon & Brand Header/Footer)
    │
    ├── css/
    │   ├── layout/                        # CSS bố cục dùng chung toàn hệ thống
    │   ├── pages/                         # CSS riêng biệt cho từng trang tĩnh
    │   └── tools/                         # CSS chuyên dùng cho các trang công cụ
    │
    └── js/
        ├── app.js                         # File điều phối trung tâm
        ├── ultis/                         # Helpers, sidebar, search (chứa TOOL_DATA 24 công cụ), auth, user
        └── tools/                         # Logic xử lý chuyên biệt cho từng công cụ
            ├── pdf/                       # 📁 Đầy đủ 24 file JS chuyên biệt cho 24 công cụ PDF
            ├── anh/
            └── tien-ich/
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
* **Đóng mở linh hoạt**: Hỗ trợ phím `Escape`, click vùng tối bên ngoài overlay hoặc nút bấm hành động.

### 3.5. Quy chuẩn Header, Footer & Auth Modal đồng bộ
Toàn bộ 32 trang HTML trong hệ thống tuân thủ 100% cấu trúc đồng nhất:
1. **Header chuẩn (`.header`)**:
   - Logo thương hiệu + Tên dự án ToolHub (tự tính đường dẫn tương đối `../` hoặc `../../` về trang chủ).
   - Thanh tìm kiếm trung tâm (`#searchInput`) tích hợp gợi ý autocomplete toàn hệ thống.
   - Khối người dùng: Trạng thái Khách (`#guestActions` - Đăng nhập/Đăng ký) và Người dùng (`#userActions` - Avatar, Name, Dropdown Lịch sử/Cài đặt/Đăng xuất).
2. **Footer chuẩn 4 cột (`.footer`)**:
   - Cột 1: Thông tin thương hiệu ToolHub, cam kết bảo mật & miễn phí.
   - Cột 2: Danh mục Công cụ PDF tiêu biểu (Nén PDF, Gộp PDF, Tách PDF, PDF sang Word).
   - Cột 3: Danh mục Chỉnh sửa ảnh & Tiện ích web.
   - Cột 4: Hỗ trợ, Điều khoản, Bảo mật và FAQ.
   - Thanh Bottom Bar: Bản quyền `© 2025 ToolHub` và liên kết ngôn ngữ/pháp lý.
3. **Cơ chế xác thực tập trung (Centralized Auth Modal Architecture)**:
   - Khối `#authModal` được tập trung duy nhất tại trang chủ [templates/index.html](file:///d:/starup/web/Tools/templates/index.html), giúp giảm tải dung lượng và tránh phân mảnh logic trên các trang con.
   - Tại tất cả các trang con (31 template), các nút Đăng nhập / Đăng ký trong `#guestActions` là các liên kết thẻ `<a>` trỏ trực tiếp về trang chủ kèm cờ tham số:
     + Trang cấp 1 (`trogiup.html`, `dieukhoan.html`,...): `href="index.html?auth=login"` / `href="index.html?auth=register"`.
     + Trang con cấp 2 (`pdf/*.html`, `anh/*.html`,...): `href="../index.html?auth=login"` / `href="../index.html?auth=register"`.
   - Hàm `initAuthModal()` trong [static/js/ultis/auth.js](file:///d:/starup/web/Tools/static/js/ultis/auth.js) khi khởi chạy tại `index.html` sẽ tự động đọc tham số URL (`?auth=login` hoặc `?auth=register`), mở ngay modal tương ứng và tự động dọn dẹp URL bằng `window.history.replaceState`.
   - Hàm `openModal(mode)` trong `auth.js` cũng được lập trình an toàn: nếu được gọi tại bất kỳ trang con nào, nó tự động đọc đường dẫn logo để điều hướng về `index.html?auth=...`.

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

---

## 5. KIẾN TRÚC BACKEND & HƯỚNG DẪN PHÁT TRIỂN TIẾP THEO

### 5.1. Mô hình Phân lớp (Layered Architecture trong `src/`)
Hệ thống backend xây dựng trên nền tảng Flask theo mô hình kiến trúc sạch đặt trong package `src/`:
1. **Entry Point (`app.py`)**:
   - Khởi chạy ứng dụng từ `src.create_app()`.
   - Giữ file ở thư mục gốc để thuận tiện chạy lệnh `python app.py`.
2. **Application Factory (`src/__init__.py`)**:
   - Chứa hàm `create_app()` để nạp cấu hình từ `src/config.py`.
   - Cấu hình thư mục `templates` và `static` trỏ ra ngoài thư mục gốc.
   - Tự động kiểm tra và tạo thư mục upload `uploads/`.
   - Gọi `register_routes(app)` nạp toàn bộ Blueprints.
3. **Page Routes Layer (`src/routes/`)**:
   - Chia tách độc lập theo danh mục công cụ (`main_routes.py`, `pdf_routes.py`, `image_routes.py`, `utility_routes.py`, `conversion_routes.py`).
   - Mỗi file định nghĩa Flask `Blueprint` kèm tiền tố URL chuẩn SEO (ví dụ `/pdf`, `/anh`, `/tien-ich`).
   - Hỗ trợ cả 2 dạng URL: URL SEO sạch (`/pdf/nen-pdf`) và alias URL tĩnh (`/pdf/nen-pdf.html`) để tương thích tối đa.
4. **Business Logic Layer (`src/services/`)**:
   - Nơi chứa logic tính toán, xử lý file thực tế (chuyển đổi, nén, cắt ghép, bóc tách).
   - Tách biệt hoàn toàn khỏi request/response của Flask để dễ dàng viết unit test hoặc tái sử dụng:
     - `pdf_service.py`: Xử lý PDF với `pypdf`, `PyMuPDF`.
     - `image_service.py`: Xử lý ảnh với `Pillow`, `rembg`.
     - `qr_service.py`: Xử lý sinh mã QR với `qrcode`.
5. **Utils Layer (`src/utils/`)**:
   - Cung cấp các hàm kiểm tra định dạng file an toàn (`allowed_file`), làm sạch dữ liệu đầu vào.

### 5.2. Quy trình khi thêm tính năng xử lý Backend thực tế
Khi chuyển từ giao diện mô phỏng sang xử lý file thật bằng Backend:
1. **Viết logic trong Services**: Thêm phương thức xử lý vào file service tương ứng tại `src/services/` (ví dụ `PdfService.compress_pdf(input_path, output_path, level)`).
2. **Thêm API Route**: Trong file route tương ứng tại `src/routes/` (ví dụ `src/routes/pdf_routes.py`), thêm endpoint nhận file upload (`POST /pdf/api/nen-pdf`), gọi service và trả về file kết quả hoặc JSON.
3. **Kết nối Frontend**: Cập nhật file JS tương ứng tại `static/js/tools/...` để gửi `FormData` qua `fetch('/pdf/api/nen-pdf')` thay vì dùng timeout giả lập.

---

## 5. KIẾN TRÚC BACKEND & HƯỚNG DẪN PHÁT TRIỂN TIẾP THEO

### 5.1. Mô hình Phân lớp (Layered Architecture trong `src/`)
Hệ thống backend xây dựng trên nền tảng Flask theo mô hình kiến trúc sạch đặt trong package `src/`:
1. **Entry Point (`app.py`)**:
   - Khởi chạy ứng dụng từ `src.create_app()`.
   - Giữ file ở thư mục gốc để thuận tiện chạy lệnh `python app.py`.
2. **Application Factory (`src/__init__.py`)**:
   - Chứa hàm `create_app()` để nạp cấu hình từ `src/config.py`.
   - Cấu hình thư mục `templates` và `static` trỏ ra ngoài thư mục gốc.
   - Tự động kiểm tra và tạo thư mục upload `uploads/`.
   - Gọi `register_routes(app)` nạp toàn bộ Blueprints.
3. **Page Routes Layer (`src/routes/`)**:
   - Chia tách độc lập theo danh mục công cụ (`main_routes.py`, `pdf_routes.py`, `image_routes.py`, `utility_routes.py`, `conversion_routes.py`).
   - Mỗi file định nghĩa Flask `Blueprint` kèm tiền tố URL chuẩn SEO (ví dụ `/pdf`, `/anh`, `/tien-ich`).
   - Hỗ trợ cả 2 dạng URL: URL SEO sạch (`/pdf/nen-pdf`) và alias URL tĩnh (`/pdf/nen-pdf.html`) để tương thích tối đa.
4. **Business Logic Layer (`src/services/`)**:
   - Nơi chứa logic tính toán, xử lý file thực tế (chuyển đổi, nén, cắt ghép, bóc tách).
   - Tách biệt hoàn toàn khỏi request/response của Flask để dễ dàng viết unit test hoặc tái sử dụng:
     - `pdf_service.py`: Xử lý PDF với `pypdf`, `PyMuPDF`.
     - `image_service.py`: Xử lý ảnh với `Pillow`, `rembg`.
     - `qr_service.py`: Xử lý sinh mã QR với `qrcode`.
5. **Utils Layer (`src/utils/`)**:
   - Cung cấp các hàm kiểm tra định dạng file an toàn (`allowed_file`), làm sạch dữ liệu đầu vào.

### 5.2. Quy trình khi thêm tính năng xử lý Backend thực tế
Khi chuyển từ giao diện mô phỏng sang xử lý file thật bằng Backend:
1. **Viết logic trong Services**: Thêm phương thức xử lý vào file service tương ứng tại `src/services/` (ví dụ `PdfService.compress_pdf(input_path, output_path, level)`).
2. **Thêm API Route**: Trong file route tương ứng tại `src/routes/` (ví dụ `src/routes/pdf_routes.py`), thêm endpoint nhận file upload (`POST /pdf/api/nen-pdf`), gọi service và trả về file kết quả hoặc JSON.
3. **Kết nối Frontend**: Cập nhật file JS tương ứng tại `static/js/tools/...` để gửi `FormData` qua `fetch('/pdf/api/nen-pdf')` thay vì dùng timeout giả lập.
