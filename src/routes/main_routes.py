from flask import Blueprint, render_template, send_from_directory, current_app

main_bp = Blueprint('main', __name__)

@main_bp.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Phục vụ file từ thư mục uploads (logo, tài liệu tĩnh)."""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@main_bp.route('/')
def index():
    """Trang chủ ToolHub."""
    return render_template('index.html')

@main_bp.route('/trogiup')
def trogiup():
    """Trung tâm trợ giúp & FAQ."""
    return render_template('trogiup.html')

@main_bp.route('/dieukhoan')
def dieukhoan():
    """Điều khoản sử dụng & Chính sách bảo mật."""
    return render_template('dieukhoan.html')

@main_bp.route('/chon-file')
def chon_file():
    """Trang chọn file dự phòng."""
    return render_template('chon-file.html')

@main_bp.route('/xuly')
def xuly():
    """Trang xử lý file dự phòng."""
    return render_template('xuly.html')
