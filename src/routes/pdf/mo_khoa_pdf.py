"""
=========================================================
LOGIC XỬ LÝ MỞ KHÓA PDF - MO_KHOA_PDF.PY
Tiếp nhận file PDF bị khóa mật khẩu và mật khẩu người dùng
Xác thực và gỡ bỏ mã hóa bằng PyMuPDF, hỗ trợ lưu vào tài khoản
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


def api_unlock_pdf():
    """API tiếp nhận file PDF và mật khẩu để giải mã gỡ khóa."""
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

    password = request.form.get('password', '').strip()

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    unlocked_dir = os.path.join(upload_dir, 'unlocked')
    temp_dir = os.path.join(unlocked_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_da_mo_khoa.pdf"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(unlocked_dir, f"{task_id}_unlocked.pdf")

    try:
        file.save(temp_input_path)

        # Thực thi gỡ bỏ mật khẩu bằng PyMuPDF
        result = PdfService.unlock_pdf(
            temp_input_path,
            output_path,
            password=password
        )

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
                tool_slug='mo-khoa-pdf',
                tool_title='Mở khóa PDF',
                meta_dict={
                    'task_id': task_id,
                    'total_pages': result['total_pages'],
                    'was_encrypted': result['was_encrypted'],
                    'result_size_formatted': result['result_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id

        return jsonify({
            'status': 'success',
            'message': f"Đã mở khóa thành công toàn bộ {result['total_pages']} trang của tài liệu!",
            'data': {
                'task_id': task_id,
                'download_url': download_url,
                'download_name': download_name,
                'total_pages': result['total_pages'],
                'was_encrypted': result['was_encrypted'],
                'result_size': result['result_size'],
                'result_size_formatted': result['result_size_formatted'],
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        })

    except ValueError as ve:
        return jsonify({
            'status': 'error',
            'message': str(ve)
        }), 400

    except Exception as e:
        current_app.logger.error(f"[MO_KHOA_PDF] Lỗi xử lý: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f"Lỗi trong quá trình mở khóa PDF: {str(e)}"
        }), 500

    finally:
        # Dọn dẹp file tạm nguồn
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except Exception:
                pass


def register_mo_khoa_pdf_routes(bp):
    """Đăng ký các route liên quan đến mở khóa PDF."""
    bp.add_url_rule(
        '/api/mo-khoa-pdf',
        view_func=api_unlock_pdf,
        methods=['POST']
    )
