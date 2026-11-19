"""
=========================================================
AUTHENTICATION ROUTES - AUTH_ROUTES.PY
Các API endpoint xử lý xác thực thực tế cho ToolHub.
Hỗ trợ đăng ký, đăng nhập, đăng xuất và kiểm tra phiên người dùng.
=========================================================
"""

from flask import Blueprint, request, jsonify, session
from ..services.user_service import (
    create_user,
    authenticate_user,
    get_user_by_id
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register_api():
    """API Đăng ký tài khoản thực tế vào CSDL SQLite."""
    data = request.get_json(silent=True) or request.form.to_dict()

    email = data.get('email', '').strip()
    password = data.get('password', '')
    confirm = data.get('confirm_password', '')
    agree_terms = data.get('agree_terms', True)

    if not email:
        return jsonify({'success': False, 'message': 'Vui lòng cung cấp địa chỉ email.'}), 400

    if not password or len(password) < 6:
        return jsonify({'success': False, 'message': 'Mật khẩu phải có ít nhất 6 ký tự.'}), 400

    if confirm and password != confirm:
        return jsonify({'success': False, 'message': 'Mật khẩu xác nhận không khớp.'}), 400

    if not agree_terms:
        return jsonify({'success': False, 'message': 'Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.'}), 400

    success, message, user = create_user(
        email=email,
        password=password
    )

    if not success:
        return jsonify({'success': False, 'message': message}), 400

    # Tự động duy trì phiên đăng nhập sau khi đăng ký
    session.clear()
    session['user_id'] = user.id
    session.permanent = True

    return jsonify({
        'success': True,
        'message': message,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login_api():
    """API Đăng nhập tài khoản thực tế bằng Email."""
    data = request.get_json(silent=True) or request.form.to_dict()

    email = data.get('email', '').strip()
    password = data.get('password', '')
    remember = data.get('remember', True)

    if not email:
        return jsonify({'success': False, 'message': 'Vui lòng nhập địa chỉ email.'}), 400

    if not password:
        return jsonify({'success': False, 'message': 'Vui lòng nhập mật khẩu.'}), 400

    success, message, user = authenticate_user(email, password)

    if not success:
        return jsonify({'success': False, 'message': message}), 401

    # Lưu session người dùng vào Flask Session
    session.clear()
    session['user_id'] = user.id
    session.permanent = bool(remember)

    return jsonify({
        'success': True,
        'message': message,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST', 'GET'])
def logout_api():
    """API Đăng xuất và xóa phiên làm việc."""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Đã đăng xuất thành công.'
    }), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user_api():
    """Lấy thông tin người dùng hiện tại từ session Flask."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'user': None}), 200

    user = get_user_by_id(user_id)
    if not user or not user.is_active:
        session.clear()
        return jsonify({'success': False, 'user': None}), 200

    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200
