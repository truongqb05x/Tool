"""
=========================================================
LOGIC XỬ LÝ CHUYỂN ĐỔI EXCEL SANG PDF - EXCEL_SANG_PDF.PY
Tiếp nhận file Excel (.xlsx, .xls), chuyển đổi sang PDF chuẩn
Căn chỉnh bảng biểu vừa khổ trang, hỗ trợ lưu vào tài khoản
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


def api_excel_to_pdf():
    """API tiếp nhận file Excel (.xlsx, .xls) và chuyển đổi sang PDF."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp bảng tính Excel (.xlsx, .xls).'
        }), 400

    filename_lower = file.filename.lower()
    if not (filename_lower.endswith('.xlsx') or filename_lower.endswith('.xls')):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Định dạng không được hỗ trợ. Vui lòng chọn tệp Excel (.xlsx, .xls).'
        }), 400

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'bangtinh.xlsx'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}.pdf"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}.pdf")

    try:
        file.save(temp_input_path)

        # Chuyển đổi Excel sang PDF
        result = PdfService.excel_to_pdf(
            input_path=temp_input_path,
            output_path=output_path
        )

        # Kiểm tra đăng nhập để lưu file vào tài khoản nếu có
        user_id = session.get('user_id')
        if not user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                user_id = auth_header.split(' ')[1]

        saved_to_account = False
        user_info = None

        if user_id:
            try:
                user = get_user_by_id(user_id)
                if user:
                    user_folder = os.path.join(upload_dir, 'users', str(user_id), 'pdf')
                    os.makedirs(user_folder, exist_ok=True)
                    user_dest_path = os.path.join(user_folder, f"{task_id}_{download_name}")
                    shutil.copy2(output_path, user_dest_path)

                    save_user_file(
                        user_id=user_id,
                        file_name=download_name,
                        file_path=user_dest_path,
                        file_type='application/pdf',
                        file_size=result.get('result_size', 0),
                        category='pdf',
                        tool='excel-sang-pdf'
                    )
                    saved_to_account = True
                    user_info = {
                        'id': user.get('id'),
                        'name': user.get('name'),
                        'email': user.get('email')
                    }
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        download_url = f"/pdf/download/{task_id}/{download_name}"

        return jsonify({
            'status': 'success',
            'success': True,
            'message': 'Chuyển đổi bảng tính Excel sang PDF thành công!',
            'task_id': task_id,
            'download_url': download_url,
            'filename': download_name,
            'sheets_count': result['sheets_count'],
            'orig_size_formatted': result['orig_size_formatted'],
            'result_size': result['result_size'],
            'result_size_formatted': result['result_size_formatted'],
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except ValueError as ve:
        return jsonify({'status': 'error', 'success': False, 'message': str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Lỗi khi chuyển đổi Excel sang PDF: {e}", exc_info=True)
        return jsonify({'status': 'error', 'success': False, 'message': f'Lỗi hệ thống khi chuyển đổi file: {str(e)}'}), 500
    finally:
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except Exception:
                pass


def register_excel_sang_pdf_routes(bp):
    """Đăng ký route API chuyển Excel sang PDF vào blueprint."""
    bp.add_url_rule('/api/excel-sang-pdf', view_func=api_excel_to_pdf, methods=['POST'])
