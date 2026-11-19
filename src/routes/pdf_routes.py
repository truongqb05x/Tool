from flask import Blueprint, render_template, request, jsonify

pdf_bp = Blueprint('pdf', __name__, url_prefix='/pdf')

# Danh sách 24 công cụ PDF và hàm điều hướng tương ứng
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

# Đăng ký tự động cả 2 chuẩn URL: /pdf/<slug> và /pdf/<slug>.html
for slug, _ in PDF_TOOLS:
    func = make_view_func(slug)
    pdf_bp.add_url_rule(f'/{slug}', view_func=func, methods=['GET'])
    pdf_bp.add_url_rule(f'/{slug}.html', view_func=func, methods=['GET'])

# ===== TRANG DANH MỤC TẤT CẢ 24 CÔNG CỤ PDF =====
@pdf_bp.route('')
@pdf_bp.route('/')
@pdf_bp.route('/index.html')
def pdf_index():
    """Trang danh mục tổng hợp toàn bộ 24 công cụ PDF."""
    return render_template('pdf/index.html')

# ===== PLACEHOLDER API ROUTE XỬ LÝ CHO CÁC TÍNH NĂNG PDF =====
@pdf_bp.route('/api/<action>', methods=['POST'])
def handle_pdf_api(action):
    """
    Điểm tiếp nhận xử lý file PDF từ giao diện:
    Sẵn sàng để gọi các hàm trong src.services.pdf_service.PdfService
    """
    valid_actions = {slug for slug, _ in PDF_TOOLS}
    if action not in valid_actions:
        return jsonify({'status': 'error', 'message': f'Hành động {action} không hợp lệ.'}), 400

    return jsonify({
        'status': 'success',
        'message': f'Tính năng {action} đã tiếp nhận yêu cầu thành công (backend placeholder).',
        'download_url': None
    })
