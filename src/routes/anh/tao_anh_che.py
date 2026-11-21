"""
=========================================================
LOGIC XỬ LÝ TẠO ẢNH CHẾ - TAO_ANH_CHE.PY
Tiếp nhận file ảnh và chèn chữ chế Meme Top/Bottom
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


def api_create_meme():
    """API tiếp nhận file ảnh và tạo Meme."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp hình ảnh để chế Meme.'
        }), 400

    top_text = request.form.get('top_text', '')
    bottom_text = request.form.get('bottom_text', '')
    text_color = request.form.get('text_color', '#ffffff')
    try:
        font_size = int(request.form.get('font_size', 40))
    except (ValueError, TypeError):
        font_size = 40

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_images')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'image.jpg'
    base_name, ext = os.path.splitext(safe_name)
    if not ext:
        ext = '.jpg'
    download_name = f"{base_name}_meme{ext}"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}{ext}")

    try:
        file.save(temp_input_path)

        result = ImageService.create_meme(
            input_path=temp_input_path,
            output_path=output_path,
            top_text=top_text,
            bottom_text=bottom_text,
            font_size=font_size,
            text_color=text_color
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
                        file_type='image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/png',
                        file_size=result.get('result_size', 0),
                        category='image',
                        tool='tao-anh-che'
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
            'message': 'Đã tạo ảnh chế Meme hài hước thành công!',
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
            'message': f"Lỗi khi tạo ảnh chế: {str(e)}"
        }), 500


def register_tao_anh_che_routes(bp):
    """Đăng ký route API tạo ảnh chế vào Blueprint."""
    bp.add_url_rule('/api/tao-anh-che', view_func=api_create_meme, methods=['POST'])
