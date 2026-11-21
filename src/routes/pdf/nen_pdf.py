"""
=========================================================
LOGIC XỬ LÝ NÉN PDF - NEN_PDF.PY
Tiếp nhận file PDF, gọi dịch vụ nén và quản lý lưu trữ tài khoản
=========================================================
"""

import os
import uuid
import shutil
from flask import request, jsonify, current_app, session
from ...services.pdf import PdfService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


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

        # Thực thi nén thực tế bằng PyMuPDF
        result = PdfService.compress_pdf(
            input_path=input_path,
            output_path=output_path,
            level=level
        )

        # Đặt tên file đầu ra thân thiện
        base_name = os.path.splitext(filename)[0]
        download_name = f"{base_name}_nen.pdf"

        # Kiểm tra xem người dùng đã đăng nhập chưa
        user_id = session.get('user_id')
        if not user_id:
            auth_id = request.headers.get('X-User-Id') or request.form.get('user_id')
            if auth_id and str(auth_id).isdigit():
                user_id = int(auth_id)

        user = get_user_by_id(user_id) if user_id else None

        saved_in_account = False
        user_file_id = None
        download_url = f"/pdf/download/{task_id}/{download_name}"

        # NẾU ĐÃ ĐĂNG NHẬP: Tự động lưu file vào kho lưu trữ tài khoản của người dùng
        if user and user.is_active:
            user_storage_dir = os.path.join(upload_dir, 'users', str(user.id))
            os.makedirs(user_storage_dir, exist_ok=True)
            user_file_dest = os.path.join(user_storage_dir, f"{task_id}_{download_name}")
            shutil.copy2(output_path, user_file_dest)

            user_file = save_user_file(
                user_id=user.id,
                original_name=filename,
                file_name=download_name,
                file_path=user_file_dest,
                file_size=result['compressed_size'],
                file_type='pdf',
                tool_slug='nen-pdf',
                tool_title='Nén PDF',
                meta_dict={
                    'original_size': result['original_size'],
                    'compressed_size': result['compressed_size'],
                    'original_size_formatted': result['original_size_formatted'],
                    'compressed_size_formatted': result['compressed_size_formatted'],
                    'saved_percent': result['saved_percent'],
                    'level': level
                }
            )
            saved_in_account = True
            user_file_id = user_file.id
            download_url = f"/api/user/files/{user_file.id}/download"

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
                'download_url': download_url,
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
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


def register_nen_pdf_routes(bp):
    """Đăng ký route nén PDF vào blueprint."""
    bp.add_url_rule('/api/nen-pdf', view_func=api_compress_pdf, methods=['POST'])
