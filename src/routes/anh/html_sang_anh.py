"""
=========================================================
LOGIC XỬ LÝ CHUYỂN HTML SANG ẢNH - HTML_SANG_ANH.PY
Tiếp nhận mã nguồn HTML hoặc URL và kết xuất thành ảnh
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


def api_html_to_image():
    """API tiếp nhận mã nguồn HTML và chuyển đổi thành ảnh."""
    html_content = request.form.get('html_content', '')
    url = request.form.get('url', '')

    # Nếu người dùng upload file .html
    file = request.files.get('file')
    if file and file.filename:
        try:
            html_content = file.read().decode('utf-8', errors='ignore')
        except Exception:
            pass

    if not html_content and url:
        # Nếu gửi URL, tải nội dung HTML từ URL
        try:
            import urllib.request
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                html_content = resp.read().decode('utf-8', errors='ignore')
        except Exception as url_err:
            return jsonify({
                'status': 'error',
                'success': False,
                'message': f"Không thể tải nội dung từ liên kết URL: {str(url_err)}"
            }), 400

    if not html_content or len(html_content.strip()) == 0:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng nhập mã nguồn HTML hoặc liên kết trang web cần chuyển sang ảnh.'
        }), 400

    try:
        width = int(request.form.get('width', 1000))
        height = int(request.form.get('height', 800))
    except (ValueError, TypeError):
        width, height = 1000, 800

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_images')
    os.makedirs(converted_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    download_name = f"webpage_{task_id[:8]}.png"
    output_path = os.path.join(converted_dir, f"{task_id}.png")

    try:
        result = ImageService.html_to_image(
            html_content=html_content,
            output_path=output_path,
            width=width,
            height=height
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
                        file_type='image/png',
                        file_size=result.get('result_size', 0),
                        category='image',
                        tool='html-sang-anh'
                    )
                    saved_to_account = True
                    user_info = {'id': user.get('id'), 'name': user.get('name'), 'email': user.get('email')}
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        return jsonify({
            'status': 'success',
            'success': True,
            'message': 'Đã chuyển đổi mã nguồn HTML sang hình ảnh thành công!',
            'download_url': f"/anh/download/{task_id}/{download_name}",
            'download_name': download_name,
            'task_id': task_id,
            'data': result,
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': f"Lỗi khi chuyển HTML sang ảnh: {str(e)}"
        }), 500


def register_html_sang_anh_routes(bp):
    """Đăng ký route API HTML sang ảnh vào Blueprint."""
    bp.add_url_rule('/api/html-sang-anh', view_func=api_html_to_image, methods=['POST'])
