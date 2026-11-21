"""
=========================================================
VIEW ROUTES CHO CÔNG CỤ PDF - VIEW_ROUTES.PY
Quản lý giao diện, danh mục và điều hướng cho 24 công cụ PDF
=========================================================
"""

from flask import render_template

# Danh sách 24 công cụ PDF và nhãn hiển thị tương ứng
PDF_TOOLS = [
    ('nen-pdf', 'Nén PDF'),
    ('gop-pdf', 'Gộp PDF'),
    ('tach-pdf', 'Tách PDF'),
    ('xoay-pdf', 'Xoay PDF'),
    ('xoa-trang-pdf', 'Xóa trang PDF'),
    ('sap-xep-trang-pdf', 'Sắp xếp trang PDF'),
    ('trich-xuat-trang-pdf', 'Trích xuất trang PDF'),
    ('pdf-sang-word', 'Chuyển PDF sang Word'),
    ('pdf-sang-excel', 'Chuyển PDF sang Excel'),
    ('pdf-sang-powerpoint', 'Chuyển PDF sang PowerPoint'),
    ('word-sang-pdf', 'Chuyển Word sang PDF'),
    ('excel-sang-pdf', 'Chuyển Excel sang PDF'),
    ('powerpoint-sang-pdf', 'Chuyển PowerPoint sang PDF'),
    ('pdf-sang-anh', 'PDF sang ảnh'),
    ('anh-sang-pdf', 'Ảnh sang PDF'),
    ('chinh-sua-pdf', 'Chỉnh sửa PDF'),
    ('them-so-trang-pdf', 'Thêm số trang PDF'),
    ('them-watermark-pdf', 'Thêm watermark PDF'),
    ('bao-ve-pdf', 'Bảo vệ PDF bằng mật khẩu'),
    ('mo-khoa-pdf', 'Mở khóa PDF'),
    ('ky-pdf', 'Ký PDF'),
    ('so-sanh-pdf', 'So sánh PDF'),
    ('ocr-pdf', 'OCR PDF'),
    ('doc-thong-tin-pdf', 'Đọc thông tin PDF')
]


def make_view_func(slug):
    """Tạo hàm render view cho từng công cụ PDF theo slug."""
    def view_func():
        return render_template(f'pdf/{slug}.html')
    view_func.__name__ = f"tool_{slug.replace('-', '_')}"
    return view_func


def register_view_routes(bp):
    """Đăng ký các route giao diện view cho PDF blueprint."""
    for slug, _ in PDF_TOOLS:
        func = make_view_func(slug)
        bp.add_url_rule(f'/{slug}', view_func=func, methods=['GET'])
        bp.add_url_rule(f'/{slug}.html', view_func=func, methods=['GET'])

    @bp.route('', methods=['GET'])
    @bp.route('/', methods=['GET'])
    @bp.route('/index.html', methods=['GET'])
    def pdf_index():
        """Trang danh mục tổng hợp toàn bộ 24 công cụ PDF."""
        return render_template('pdf/index.html')
