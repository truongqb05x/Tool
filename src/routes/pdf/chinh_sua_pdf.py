"""
=========================================================
LOGIC XỬ LÝ CHỈNH SỬA PDF - CHINH_SUA_PDF.PY
Tiếp nhận file PDF, chèn văn bản, ghi chú, tiêu đề, nhãn trạng thái
Bảo toàn định dạng văn bản gốc, hỗ trợ lưu vào tài khoản người dùng
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


def api_edit_pdf():
    """API tiếp nhận file PDF và thực hiện chèn văn bản, ghi chú, nhãn trạng thái."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp tài liệu PDF để chỉnh sửa.'
        }), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Định dạng tệp không hợp lệ. Vui lòng chọn tệp PDF (.pdf).'
        }), 400

    # Lấy các tham số cấu hình chỉnh sửa từ form
    edit_type = request.form.get('edit_type', 'text').strip()
    text = request.form.get('text', '').strip()
    position = request.form.get('position', 'bottom').strip()
    page_scope = request.form.get('page_scope', 'all').strip()
    color_hex = request.form.get('color_hex', '#e74c3c').strip()

    try:
        font_size = float(request.form.get('font_size', 14))
    except (ValueError, TypeError):
        font_size = 14.0

    if not text:
        text = "Tài liệu đã chỉnh sửa tại ToolHub"

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tai_lieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_edited.pdf"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}.pdf")

    try:
        file.save(temp_input_path)

        # Gọi nghiệp vụ chỉnh sửa PDF
        result = PdfService.edit_pdf(
            input_path=temp_input_path,
            output_path=output_path,
            text=text,
            edit_type=edit_type,
            position=position,
            font_size=font_size,
            color_hex=color_hex,
            page_scope=page_scope
        )

        # Lưu vào tài khoản nếu người dùng đã đăng nhập
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
                        tool='chinh-sua-pdf'
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
            'message': 'Đã hoàn tất chỉnh sửa và cập nhật tài liệu PDF!',
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
            'message': f"Lỗi trong quá trình chỉnh sửa PDF: {str(e)}"
        }), 500


def register_chinh_sua_pdf_routes(bp):
    """Đăng ký route API chỉnh sửa PDF vào Blueprint."""
    bp.add_url_rule('/api/chinh-sua-pdf', view_func=api_edit_pdf, methods=['POST'])
