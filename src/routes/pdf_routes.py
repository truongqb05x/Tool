import os
import uuid
from flask import Blueprint, render_template, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from ..services.pdf_service import PdfService

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

# ===== API ROUTE XỬ LÝ NÉN FILE PDF THỰC TẾ =====
@pdf_bp.route('/api/nen-pdf', methods=['POST'])
def api_compress_pdf():
    """
    Tiếp nhận file PDF và mức độ nén từ giao diện:
    - Gọi PdfService.compress_pdf để xử lý nén file thật bằng PyMuPDF.
    - Trả về thông số dung lượng thực tế và link download file đã nén.
    """
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy tệp PDF tải lên.'}), 400

    uploaded_file = request.files['file']
    if not uploaded_file or uploaded_file.filename == '':
        return jsonify({'status': 'error', 'message': 'Tên tệp không hợp lệ.'}), 400

    filename = uploaded_file.filename
    if not filename.lower().endswith('.pdf'):
        return jsonify({'status': 'error', 'message': 'Định dạng tệp không được hỗ trợ. Vui lòng chọn file .pdf.'}), 400

    level = request.form.get('level', 'recommended')
    if level not in ('extreme', 'recommended', 'light'):
        level = 'recommended'

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    compressed_dir = os.path.join(upload_dir, 'compressed')
    os.makedirs(compressed_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    input_path = os.path.join(compressed_dir, f"{task_id}_input.pdf")
    output_path = os.path.join(compressed_dir, f"{task_id}_compressed.pdf")

    try:
        # Lưu tệp nguồn tạm thời
        uploaded_file.save(input_path)

        # Thực thi nén thực tế
        result = PdfService.compress_pdf(
            input_path=input_path,
            output_path=output_path,
            level=level
        )

        # Đặt tên file đầu ra thân thiện
        base_name = os.path.splitext(filename)[0]
        download_name = f"{base_name}_nen.pdf"

        return jsonify({
            'status': 'success',
            'message': 'Nén file PDF thành công!',
            'data': {
                'task_id': task_id,
                'filename': filename,
                'download_name': download_name,
                'original_size': result['original_size'],
                'compressed_size': result['compressed_size'],
                'original_size_formatted': result['original_size_formatted'],
                'compressed_size_formatted': result['compressed_size_formatted'],
                'saved_percent': result['saved_percent'],
                'download_url': f"/pdf/download/{task_id}/{download_name}"
            }
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Lỗi trong quá trình nén file PDF: {str(e)}'}), 500
    finally:
        # Xóa file đầu vào để tiết kiệm bộ nhớ máy chủ
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except OSError:
                pass


# ===== API DOWNLOAD FILE KẾT QUẢ ĐÃ NÉN =====
@pdf_bp.route('/download/<task_id>/<path:filename>', methods=['GET'])
def download_compressed_pdf(task_id, filename):
    """Gửi tệp PDF đã nén về máy tính của người dùng."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    compressed_file_path = os.path.join(upload_dir, 'compressed', f"{task_id}_compressed.pdf")

    if not os.path.exists(compressed_file_path):
        return jsonify({'status': 'error', 'message': 'Tệp không tồn tại hoặc phiên tải đã hết hạn.'}), 404

    return send_file(
        compressed_file_path,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )


# ===== PLACEHOLDER API ROUTE XỬ LÝ CHO CÁC TÍNH NĂNG PDF KHÁC =====
@pdf_bp.route('/api/<action>', methods=['POST'])
def handle_pdf_api(action):
    """
    Điểm tiếp nhận xử lý file PDF từ giao diện cho các tính năng khác:
    Sẵn sàng để gọi các hàm trong src.services.pdf_service.PdfService
    """
    if action == 'nen-pdf':
        return api_compress_pdf()

    valid_actions = {slug for slug, _ in PDF_TOOLS}
    if action not in valid_actions:
        return jsonify({'status': 'error', 'message': f'Hành động {action} không hợp lệ.'}), 400

    return jsonify({
        'status': 'success',
        'message': f'Tính năng {action} đã tiếp nhận yêu cầu thành công (backend placeholder).',
        'download_url': None
    })
