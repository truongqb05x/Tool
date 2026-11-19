"""
=========================================================
USER ROUTES - USER_ROUTES.PY
Các API endpoint quản lý tệp tin và thống kê của người dùng.
=========================================================
"""

import os
from flask import Blueprint, request, jsonify, send_file, session
from ..services.user_service import get_user_by_id
from ..services.user_file_service import (
    get_user_files,
    get_user_file_by_id,
    delete_user_file,
    get_user_stats
)

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


def get_current_user():
    """Lấy đối tượng người dùng từ session đăng nhập."""
    user_id = session.get('user_id')
    if not user_id:
        # Fallback hỗ trợ truyền header hoặc param
        auth_id = request.headers.get('X-User-Id') or request.args.get('user_id')
        if auth_id and auth_id.isdigit():
            user_id = int(auth_id)

    if not user_id:
        return None

    user = get_user_by_id(user_id)
    if not user or not user.is_active:
        return None
    return user


@user_bp.route('/files', methods=['GET'])
def list_user_files():
    """Lấy danh sách các tệp tin đã xử lý của người dùng hiện tại."""
    user = get_current_user()
    if not user:
        return jsonify({'status': 'error', 'message': 'Vui lòng đăng nhập để xem danh sách file.', 'files': []}), 401

    limit = request.args.get('limit', 50, type=int)
    files = get_user_files(user.id, limit=limit)

    return jsonify({
        'status': 'success',
        'files': [f.to_dict() for f in files]
    }), 200


@user_bp.route('/files/<int:file_id>/download', methods=['GET'])
def download_user_file(file_id):
    """Tải xuống tệp tin thuộc quyền sở hữu của người dùng."""
    user = get_current_user()
    if not user:
        return jsonify({'status': 'error', 'message': 'Vui lòng đăng nhập để tải file.'}), 401

    user_file = get_user_file_by_id(user.id, file_id)
    if not user_file:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy tệp hoặc bạn không có quyền truy cập.'}), 404

    if not user_file.file_path or not os.path.exists(user_file.file_path):
        return jsonify({'status': 'error', 'message': 'Tệp vật lý đã hết hạn lưu trữ (sau 30 ngày) và đã được tự động dọn dẹp khỏi máy chủ.'}), 404

    # Xác định MIME type tương ứng
    mimetypes_map = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    mimetype = mimetypes_map.get((user_file.file_type or '').lower(), 'application/octet-stream')

    return send_file(
        user_file.file_path,
        as_attachment=True,
        download_name=user_file.file_name,
        mimetype=mimetype
    )


@user_bp.route('/files/<int:file_id>', methods=['DELETE', 'POST'])
def delete_user_file_api(file_id):
    """Xóa tệp tin của người dùng khỏi hệ thống."""
    user = get_current_user()
    if not user:
        return jsonify({'status': 'error', 'message': 'Vui lòng đăng nhập để thực hiện.'}), 401

    success = delete_user_file(user.id, file_id)
    if not success:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy file hoặc xóa thất bại.'}), 404

    return jsonify({
        'status': 'success',
        'message': 'Đã xóa file thành công!'
    }), 200


@user_bp.route('/stats', methods=['GET'])
def user_stats_api():
    """Lấy các chỉ số thống kê thực tế của người dùng cho Dashboard."""
    user = get_current_user()
    if not user:
        return jsonify({'status': 'error', 'message': 'Chưa đăng nhập.'}), 401

    stats = get_user_stats(user.id)
    return jsonify({
        'status': 'success',
        'stats': stats
    }), 200
