"""
=========================================================
LOGIC XỬ LÝ XOAY PDF - XOAY_PDF.PY
Tiếp nhận file PDF, góc xoay (90, 180, 270) và lưu file đã xoay vĩnh viễn
=========================================================
"""

import os
import uuid
import shutil
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app, session
from ...services.pdf import PdfService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


def api_rotate_pdf():
    """
    API tiếp nhận file PDF và góc xoay từ giao diện:
    - Nhận góc xoay angle (90, 180, 270 độ).
    - Gọi PdfService.rotate_pdf để xoay trang vĩnh viễn bằng PyMuPDF.
    - Lưu file vào uploads/rotated/ và tự động lưu vào tài khoản nếu đã đăng nhập.
    """
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'message': 'Vui lòng chọn 1 tệp tài liệu định dạng PDF hợp lệ.'
        }), 400

    try:
        angle = int(request.form.get('angle', 90)) % 360
    except (ValueError, TypeError):
        angle = 90

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    rotated_dir = os.path.join(upload_dir, 'rotated')
    temp_dir = os.path.join(rotated_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_xoay_{angle}do.pdf" if angle != 0 else f"{base_name}_xoay.pdf"
    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(rotated_dir, f"{task_id}_rotated.pdf")

    try:
        file.save(temp_input_path)

        # Xoay file bằng PyMuPDF
        result = PdfService.rotate_pdf(temp_input_path, output_path, angle)

        # Kiểm tra đăng nhập
        user_id = session.get('user_id')
        if not user_id:
            auth_id = request.headers.get('X-User-Id') or request.form.get('user_id')
            if auth_id and str(auth_id).isdigit():
                user_id = int(auth_id)

        user = get_user_by_id(user_id) if user_id else None

        saved_in_account = False
        user_file_id = None
        download_url = f"/pdf/download/{task_id}/{download_name}"

        if user and user.is_active:
            user_storage_dir = os.path.join(upload_dir, 'users', str(user.id))
            os.makedirs(user_storage_dir, exist_ok=True)
            user_file_dest = os.path.join(user_storage_dir, f"{task_id}_{download_name}")
            shutil.copy2(output_path, user_file_dest)

            user_file = save_user_file(
                user_id=user.id,
                original_name=file.filename,
                file_name=download_name,
                file_path=user_file_dest,
                file_size=result['result_size'],
                file_type='pdf',
                tool_slug='xoay-pdf',
                tool_title='Xoay PDF',
                meta_dict={
                    'task_id': task_id,
                    'angle': angle,
                    'result_size_formatted': result['result_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id

        return jsonify({
            'status': 'success',
            'message': 'Đã xoay trang file PDF thành công!',
            'data': {
                'task_id': task_id,
                'download_url': download_url,
                'download_name': download_name,
                'angle': angle,
                'result_size': result['result_size'],
                'result_size_formatted': result['result_size_formatted'],
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"Lỗi trong quá trình xoay PDF: {str(e)}"
        }), 500

    finally:
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except OSError:
                pass


def register_xoay_pdf_routes(bp):
    """Đăng ký route API xoay PDF vào blueprint."""
    bp.add_url_rule('/api/xoay-pdf', view_func=api_rotate_pdf, methods=['POST'])
