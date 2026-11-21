"""
=========================================================
LOGIC XỬ LÝ OCR PDF - OCR_PDF.PY
Tiếp nhận file PDF scan hoặc dạng ảnh, nhận dạng chữ quang học (OCR)
Tạo file PDF có lớp văn bản tìm kiếm và sao chép được, hỗ trợ lưu vào tài khoản
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


def api_ocr_pdf():
    """API tiếp nhận file PDF và thực hiện nhận dạng ký tự quang học (OCR)."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp tài liệu PDF scan để thực hiện OCR.'
        }), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Định dạng không hợp lệ. Vui lòng chọn tệp PDF (.pdf).'
        }), 400

    lang = request.form.get('lang', 'vie+eng').strip()

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tai_lieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_searchable.pdf"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}.pdf")

    try:
        file.save(temp_input_path)

        # Tiến hành OCR tài liệu
        result = PdfService.ocr_pdf(
            input_path=temp_input_path,
            output_path=output_path,
            lang=lang
        )

        # Lưu file vào tài khoản nếu đã đăng nhập
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
                        tool='ocr-pdf'
                    )
                    saved_to_account = True
                    user_info = {
                        'id': user.get('id'),
                        'name': user.get('name'),
                        'email': user.get('email')
                    }
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        # Dọn dẹp file tạm
        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass

        return jsonify({
            'status': 'success',
            'success': True,
            'message': f"Đã OCR thành công {result.get('total_pages', 1)} trang ({result.get('total_words', 0)} từ nhận dạng). Tệp PDF giờ đây có thể tìm kiếm và sao chép văn bản!",
            'download_url': f"/pdf/download/{task_id}/{download_name}",
            'download_name': download_name,
            'task_id': task_id,
            'data': result,
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except Exception as e:
        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass
        return jsonify({
            'status': 'error',
            'success': False,
            'message': f"Lỗi trong quá trình OCR PDF: {str(e)}"
        }), 500


def register_ocr_pdf_routes(bp):
    """Đăng ký route API OCR PDF vào Blueprint."""
    bp.add_url_rule('/api/ocr-pdf', view_func=api_ocr_pdf, methods=['POST'])
