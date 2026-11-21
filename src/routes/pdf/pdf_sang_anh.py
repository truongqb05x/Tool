"""
=========================================================
LOGIC XỬ LÝ CHUYỂN ĐỔI PDF SANG ẢNH - PDF_SANG_ANH.PY
Tiếp nhận file PDF, render các trang thành hình ảnh JPG/PNG
Đóng gói vào tệp nén ZIP, hỗ trợ lưu vào tài khoản
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


def api_pdf_to_images():
    """API tiếp nhận file PDF và chuyển đổi sang bộ sưu tập hình ảnh JPG/PNG trong file ZIP."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp tài liệu định dạng PDF hợp lệ.'
        }), 400

    img_format = request.form.get('format', 'jpg').lower().strip()
    dpi = request.form.get('dpi', 150)
    page_range = request.form.get('page_range', '').strip()

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_images')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_images_{img_format}.zip"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}.zip")

    try:
        file.save(temp_input_path)

        # Chuyển đổi PDF sang ảnh và nén zip
        result = PdfService.pdf_to_images(
            input_path=temp_input_path,
            output_zip_path=output_path,
            img_format=img_format,
            dpi=dpi,
            page_range_str=page_range
        )

        # Kiểm tra đăng nhập để lưu vào thư mục người dùng nếu có
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
                        file_type='application/zip',
                        file_size=result.get('result_size', 0),
                        category='pdf',
                        tool='pdf-sang-anh'
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
            'message': f"Đã chuyển đổi thành công {result['exported_images']} trang sang ảnh {result['format']}!",
            'task_id': task_id,
            'download_url': download_url,
            'filename': download_name,
            'format': result['format'],
            'dpi': result['dpi'],
            'exported_images': result['exported_images'],
            'total_doc_pages': result['total_doc_pages'],
            'result_size': result['result_size'],
            'result_size_formatted': result['result_size_formatted'],
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except ValueError as ve:
        return jsonify({'status': 'error', 'success': False, 'message': str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Lỗi khi chuyển đổi PDF sang ảnh: {e}", exc_info=True)
        return jsonify({'status': 'error', 'success': False, 'message': f'Lỗi hệ thống khi chuyển đổi PDF: {str(e)}'}), 500
    finally:
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except Exception:
                pass


def register_pdf_sang_anh_routes(bp):
    """Đăng ký route API chuyển PDF sang ảnh vào blueprint."""
    bp.add_url_rule('/api/pdf-sang-anh', view_func=api_pdf_to_images, methods=['POST'])
