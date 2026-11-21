"""
=========================================================
LOGIC XỬ LÝ ĐÓNG DẤU BẢN QUYỀN ẢNH - DONG_DAU_ANH.PY
Tiếp nhận file ảnh và chèn Watermark dạng chữ hoặc logo
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


def api_watermark_image():
    """API tiếp nhận file ảnh và đóng dấu watermark."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp hình ảnh để đóng dấu.'
        }), 400

    text = request.form.get('text', 'ToolHub Watermark')
    position = request.form.get('position', 'bottom-right')
    color_hex = request.form.get('color_hex', '#ffffff')
    try:
        opacity = float(request.form.get('opacity', 0.5))
        font_size = int(request.form.get('font_size', 36))
    except (ValueError, TypeError):
        opacity, font_size = 0.5, 36

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_images')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'image.jpg'
    base_name, ext = os.path.splitext(safe_name)
    if not ext:
        ext = '.jpg'
    download_name = f"{base_name}_watermarked{ext}"

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(converted_dir, f"{task_id}{ext}")

    # Nhận logo nếu có
    logo_file = request.files.get('logo_file')
    temp_logo_path = None
    if logo_file and logo_file.filename:
        temp_logo_path = os.path.join(temp_dir, f"{task_id}_logo_{secure_filename(logo_file.filename)}")
        logo_file.save(temp_logo_path)

    try:
        file.save(temp_input_path)

        result = ImageService.add_watermark_image(
            input_path=temp_input_path,
            output_path=output_path,
            text=text,
            watermark_image_path=temp_logo_path,
            position=position,
            opacity=opacity,
            font_size=font_size,
            color_hex=color_hex
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
                        tool='dong-dau-anh'
                    )
                    saved_to_account = True
                    user_info = {'id': user.get('id'), 'name': user.get('name'), 'email': user.get('email')}
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        for p in (temp_input_path, temp_logo_path):
            try:
                if p and os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass

        return jsonify({
            'status': 'success',
            'success': True,
            'message': 'Đã đóng dấu bản quyền hình ảnh thành công!',
            'download_url': f"/anh/download/{task_id}/{download_name}",
            'download_name': download_name,
            'task_id': task_id,
            'data': result,
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except Exception as e:
        for p in (temp_input_path, temp_logo_path):
            try:
                if p and os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
        return jsonify({
            'status': 'error',
            'success': False,
            'message': f"Lỗi khi đóng dấu ảnh: {str(e)}"
        }), 500


def register_dong_dau_anh_routes(bp):
    """Đăng ký route API đóng dấu ảnh vào Blueprint."""
    bp.add_url_rule('/api/dong-dau-anh', view_func=api_watermark_image, methods=['POST'])
