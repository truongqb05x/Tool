"""
=========================================================
DOWNLOAD ROUTES CHO HÌNH ẢNH - DOWNLOAD_ROUTES.PY
Cung cấp endpoint tải về các tệp ảnh đã xử lý (nén, resize, cắt, v.v.)
=========================================================
"""

import os
from flask import jsonify, send_file, current_app


def download_image_result(task_id, filename):
    """Gửi tệp hình ảnh đã xử lý về máy tính người dùng."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_images')

    # Tìm file theo task_id trong thư mục converted_images
    candidates = [
        os.path.join(converted_dir, f"{task_id}.jpg"),
        os.path.join(converted_dir, f"{task_id}.jpeg"),
        os.path.join(converted_dir, f"{task_id}.png"),
        os.path.join(converted_dir, f"{task_id}.webp"),
        os.path.join(converted_dir, f"{task_id}.gif"),
        os.path.join(converted_dir, f"{task_id}.bmp"),
        os.path.join(converted_dir, f"{task_id}.zip"),
        os.path.join(converted_dir, filename),
    ]

    target_file_path = None
    for p in candidates:
        if os.path.exists(p):
            target_file_path = p
            break

    if not target_file_path:
        return jsonify({'status': 'error', 'message': 'Tệp không tồn tại hoặc phiên tải đã hết hạn.'}), 404

    ext = os.path.splitext(target_file_path)[1].lower()
    mimetypes_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.zip': 'application/zip'
    }
    mimetype = mimetypes_map.get(ext, 'application/octet-stream')

    return send_file(
        target_file_path,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype
    )


def register_download_routes(bp):
    """Đăng ký route tải file ảnh vào blueprint."""
    bp.add_url_rule('/download/<task_id>/<path:filename>', view_func=download_image_result, methods=['GET'])
