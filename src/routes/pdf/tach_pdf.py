"""
=========================================================
LOGIC XỬ LÝ TÁCH PDF - TACH_PDF.PY
Tiếp nhận file, phân tích tùy chọn (Phạm vi / Theo trang / Dung lượng),
xoay trang nếu có và bóc tách thành các file PDF con hoặc đóng gói ZIP
=========================================================
"""

import os
import uuid
import json
import shutil
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app, session
from ...services.pdf import PdfService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


def api_split_pdf():
    """
    API tiếp nhận file PDF và cấu hình bóc tách:
    - Tab 'range': Khoảng tùy chọn (custom) hoặc chia đều trang (fixed).
    - Tab 'pages': Tách tất cả các trang (all) hoặc chọn chuỗi trang (select).
    - Tab 'size': Chia nhỏ theo kích thước dung lượng tối đa (KB / MB).
    - Hỗ trợ xoay file và đóng gói kết quả (.pdf hoặc .zip).
    """
    file = request.files.get('file')
    if not file or not file.filename:
        # Hỗ trợ trường hợp gửi mảng files[0]
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'message': 'Vui lòng chọn 1 tệp tài liệu định dạng PDF hợp lệ.'
        }), 400

    # Đọc cấu hình bóc tách từ client
    config = {}
    config_raw = request.form.get('config')
    if config_raw:
        try:
            config = json.loads(config_raw)
        except Exception:
            config = {}

    # Nếu không có config JSON, đọc trực tiếp từ form fields
    if not config:
        config = {
            'tab': request.form.get('tab', 'range'),
            'range_mode': request.form.get('range_mode', 'custom'),
            'merge_ranges': request.form.get('merge_ranges', 'false').lower() in ('true', '1', 'on'),
            'fixed_pages': int(request.form.get('fixed_pages', 1) or 1),
            'extract_mode': request.form.get('extract_mode', 'all'),
            'pages_to_extract': request.form.get('pages_to_extract', ''),
            'merge_pages': request.form.get('merge_pages', 'false').lower() in ('true', '1', 'on'),
            'max_size_kb': float(request.form.get('max_size_kb', 500) or 500),
            'allow_compression': request.form.get('allow_compression', 'true').lower() in ('true', '1', 'on'),
            'rotation': int(request.form.get('rotation', 0) or 0)
        }
        ranges_raw = request.form.get('ranges')
        if ranges_raw:
            try:
                config['ranges'] = json.loads(ranges_raw)
            except Exception:
                config['ranges'] = []

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    split_dir = os.path.join(upload_dir, 'split')
    temp_dir = os.path.join(split_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")

    try:
        # Lưu file tải lên vào thư mục tạm
        file.save(temp_input_path)

        # Gọi dịch vụ bóc tách PDF thực tế qua PyMuPDF
        result = PdfService.split_pdf(
            input_path=temp_input_path,
            output_dir=split_dir,
            config=config,
            original_name=safe_name,
            task_id=task_id
        )

        # Kiểm tra trạng thái đăng nhập của người dùng
        user_id = session.get('user_id')
        if not user_id:
            auth_id = request.headers.get('X-User-Id') or request.form.get('user_id')
            if auth_id and str(auth_id).isdigit():
                user_id = int(auth_id)

        user = get_user_by_id(user_id) if user_id else None

        saved_in_account = False
        user_file_id = None
        download_name = result['download_name']
        download_url = f"/pdf/download/{task_id}/{download_name}"

        # NẾU ĐÃ ĐĂNG NHẬP: Tự động lưu file vào kho tài khoản người dùng
        if user and user.is_active:
            user_storage_dir = os.path.join(upload_dir, 'users', str(user.id))
            os.makedirs(user_storage_dir, exist_ok=True)
            user_file_dest = os.path.join(user_storage_dir, f"{task_id}_{download_name}")
            shutil.copy2(result['output_path'], user_file_dest)

            user_file = save_user_file(
                user_id=user.id,
                original_name=file.filename,
                file_name=download_name,
                file_path=user_file_dest,
                file_size=result['result_size'],
                file_type='zip' if result['is_zip'] else 'pdf',
                tool_slug='tach-pdf',
                tool_title='Tách PDF',
                meta_dict={
                    'task_id': task_id,
                    'total_files': result['total_files'],
                    'total_source_pages': result['total_source_pages'],
                    'is_zip': result['is_zip'],
                    'tab': config.get('tab', 'range'),
                    'result_size_formatted': result['result_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id

        return jsonify({
            'status': 'success',
            'message': 'Đã bóc tách file PDF thành công!',
            'data': {
                'task_id': task_id,
                'download_url': download_url,
                'download_name': download_name,
                'total_files': result['total_files'],
                'total_source_pages': result['total_source_pages'],
                'is_zip': result['is_zip'],
                'result_size': result['result_size'],
                'result_size_formatted': result['result_size_formatted'],
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"Lỗi trong quá trình bóc tách: {str(e)}"
        }), 500

    finally:
        # Xóa file đầu vào tạm sau khi xử lý
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except OSError:
                pass


def register_tach_pdf_routes(bp):
    """Đăng ký route API bóc tách PDF vào blueprint."""
    bp.add_url_rule('/api/tach-pdf', view_func=api_split_pdf, methods=['POST'])
