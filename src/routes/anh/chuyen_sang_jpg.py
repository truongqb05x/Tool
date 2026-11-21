"""
=========================================================
LOGIC XỬ LÝ CHUYỂN SANG JPG - CHUYEN_SANG_JPG.PY
Tiếp nhận PNG, WEBP, GIF, BMP và chuyển sang định dạng JPG chuẩn
=========================================================
"""

import os
import uuid
import shutil
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app, session
from ...services.image import ImageService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


def api_convert_to_jpg():
    """API tiếp nhận file ảnh và chuyển đổi sang JPG."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp hình ảnh để chuyển sang JPG.'
        }), 400

    quality = int(request.form.get('quality', 90))

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_images')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'image.png'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}.jpg"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}.jpg")

    try:
        file.save(temp_input_path)

        result = ImageService.convert_to_jpg(
            input_path=temp_input_path,
            output_path=output_path,
            quality=quality
        )

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
                    user_folder = os.path.join(upload_dir, 'users', str(user_id), 'images')
                    os.makedirs(user_folder, exist_ok=True)
                    user_dest_path = os.path.join(user_folder, f"{task_id}_{download_name}")
                    shutil.copy2(output_path, user_dest_path)

                    save_user_file(
                        user_id=user_id,
                        file_name=download_name,
                        file_path=user_dest_path,
                        file_type='image/jpeg',
                        file_size=result.get('result_size', 0),
                        category='image',
                        tool='chuyen-sang-jpg'
                    )
                    saved_to_account = True
                    user_info = {'id': user.get('id'), 'name': user.get('name'), 'email': user.get('email')}
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass

        return jsonify({
            'status': 'success',
            'success': True,
            'message': 'Đã chuyển đổi hình ảnh sang định dạng JPG thành công!',
            'download_url': f"/anh/download/{task_id}/{download_name}",
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
            'message': f"Lỗi khi chuyển sang JPG: {str(e)}"
        }), 500


def register_chuyen_sang_jpg_routes(bp):
    """Đăng ký route API chuyển đổi sang JPG vào Blueprint."""
    bp.add_url_rule('/api/chuyen-sang-jpg', view_func=api_convert_to_jpg, methods=['POST'])
