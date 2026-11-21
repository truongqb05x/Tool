"""
=========================================================
LOGIC XỬ LÝ KÝ PDF - KY_PDF.PY
Tiếp nhận file PDF và chữ ký tay, chữ ký ảnh hoặc chữ ký điện tử
Chèn vào trang chỉ định, bảo mật cao và hỗ trợ lưu vào tài khoản
=========================================================
"""

import os
import uuid
import shutil
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app, session
from ...services.pdf import PdfService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


def api_sign_pdf():
    """API tiếp nhận file PDF và chữ ký để gắn vào tài liệu."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp tài liệu PDF để ký.'
        }), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Định dạng tệp không hợp lệ. Vui lòng chọn tệp PDF (.pdf).'
        }), 400

    # Lấy thông tin cấu hình chữ ký
    signature_type = request.form.get('signature_type', 'draw').strip()
    sign_name = request.form.get('sign_name', '').strip()
    signature_base64 = request.form.get('signature_base64', '').strip()
    page_target = request.form.get('page_target', 'last').strip()
    position = request.form.get('position', 'bottom-right').strip()
    sign_date = request.form.get('sign_date', '').strip()

    if not sign_date:
        sign_date = datetime.now().strftime('%d/%m/%Y')

    # Nhận file ảnh chữ ký nếu tải từ máy tính
    sig_file = request.files.get('signature_image')
    signature_bytes = None
    if sig_file and sig_file.filename:
        signature_bytes = sig_file.read()

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tai_lieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_signed.pdf"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}.pdf")

    try:
        file.save(temp_input_path)

        # Thực hiện chèn chữ ký vào PDF
        result = PdfService.sign_pdf(
            input_path=temp_input_path,
            output_path=output_path,
            signature_type=signature_type,
            sign_name=sign_name,
            signature_base64=signature_base64 if signature_base64 else None,
            signature_image_bytes=signature_bytes,
            page_target=page_target,
            position=position,
            sign_date=sign_date
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
                        tool='ky-pdf'
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
            'message': 'Đã gắn chữ ký vào tài liệu PDF thành công!',
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
            'message': f"Lỗi trong quá trình ký PDF: {str(e)}"
        }), 500


def register_ky_pdf_routes(bp):
    """Đăng ký route API ký PDF vào Blueprint."""
    bp.add_url_rule('/api/ky-pdf', view_func=api_sign_pdf, methods=['POST'])
