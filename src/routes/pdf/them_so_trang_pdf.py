"""
=========================================================
LOGIC XỬ LÝ THÊM SỐ TRANG PDF - THEM_SO_TRANG_PDF.PY
Tiếp nhận file PDF và các tham số cấu hình đánh số trang
Chèn số trang bằng PyMuPDF và hỗ trợ lưu vào tài khoản
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


def api_add_page_numbers():
    """API tiếp nhận file PDF và tham số đánh số trang."""
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

    position = request.form.get('position', 'bottom-center').strip().lower()
    format_type = request.form.get('format_type', 'page_total').strip().lower()
    from_page = request.form.get('from_page', 1)
    start_number = request.form.get('start_number', 1)

    try:
        from_page = int(from_page)
    except (ValueError, TypeError):
        from_page = 1

    try:
        start_number = int(start_number)
    except (ValueError, TypeError):
        start_number = 1

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    numbered_dir = os.path.join(upload_dir, 'numbered_pages')
    temp_dir = os.path.join(numbered_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_da_danh_so.pdf"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(numbered_dir, f"{task_id}_numbered.pdf")

    try:
        file.save(temp_input_path)

        # Thực thi chèn số trang bằng PyMuPDF
        result = PdfService.add_page_numbers(
            temp_input_path,
            output_path,
            position=position,
            format_type=format_type,
            from_page=from_page,
            start_number=start_number
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
                tool_slug='them-so-trang-pdf',
                tool_title='Thêm số trang PDF',
                meta_dict={
                    'task_id': task_id,
                    'total_pages': result['total_pages'],
                    'from_page': result['from_page'],
                    'position': result['position'],
                    'format_type': result['format_type'],
                    'result_size_formatted': result['result_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id

        return jsonify({
            'status': 'success',
            'message': f"Đã đánh số trang thành công cho toàn bộ {result['total_pages']} trang!",
            'data': {
                'task_id': task_id,
                'download_url': download_url,
                'download_name': download_name,
                'total_pages': result['total_pages'],
                'from_page': result['from_page'],
                'position': result['position'],
                'format_type': result['format_type'],
                'result_size': result['result_size'],
                'result_size_formatted': result['result_size_formatted'],
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        })

    except Exception as e:
        current_app.logger.error(f"[THEM_SO_TRANG_PDF] Lỗi xử lý: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f"Lỗi trong quá trình đánh số trang: {str(e)}"
        }), 500

    finally:
        # Dọn dẹp file tạm nguồn
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except Exception:
                pass


def register_them_so_trang_pdf_routes(bp):
    """Đăng ký các route liên quan đến thêm số trang PDF."""
    bp.add_url_rule(
        '/api/them-so-trang-pdf',
        view_func=api_add_page_numbers,
        methods=['POST']
    )
