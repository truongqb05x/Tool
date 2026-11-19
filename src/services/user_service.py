"""
=========================================================
USER SERVICE - SRC/SERVICES/USER_SERVICE.PY
Tầng dịch vụ nghiệp vụ (Business Logic Layer) cho người dùng.
Xử lý đăng ký, đăng nhập và xác thực tài khoản qua Email.
=========================================================
"""

import re
from datetime import datetime
from typing import Optional, Tuple
from ..database import get_db, db_session, User


def validate_email(email: str) -> bool:
    """Kiểm tra định dạng email hợp lệ."""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email.strip()))


def get_user_by_email(email: str) -> Optional[User]:
    """Tìm người dùng theo địa chỉ email (không phân biệt hoa thường)."""
    if not email:
        return None
    session = db_session()
    return session.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(user_id: int) -> Optional[User]:
    """Tìm người dùng theo ID."""
    if not user_id:
        return None
    session = db_session()
    return session.query(User).filter(User.id == user_id).first()


def create_user(email: str, password: str) -> Tuple[bool, str, Optional[User]]:
    """
    Tạo tài khoản người dùng mới:
    - Kiểm tra email hợp lệ và chưa tồn tại.
    - Kiểm tra độ dài mật khẩu >= 6 ký tự.
    - Băm mật khẩu an toàn và lưu vào CSDL.
    Trả về: (thành_công, thông_báo, user_object)
    """
    clean_email = email.strip().lower() if email else ''
    
    if not validate_email(clean_email):
        return False, "Địa chỉ email không hợp lệ.", None

    if not password or len(password) < 6:
        return False, "Mật khẩu phải có ít nhất 6 ký tự.", None

    # Kiểm tra trùng email
    if get_user_by_email(clean_email):
        return False, "Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập.", None

    with get_db() as db:
        new_user = User(
            email=clean_email,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        new_user.set_password(password)
        db.add(new_user)
        db.flush()

    # Lấy lại bản ghi sau commit
    user = get_user_by_email(clean_email)
    return True, "Đăng ký tài khoản thành công!", user


def authenticate_user(email: str, password: str) -> Tuple[bool, str, Optional[User]]:
    """
    Xác thực đăng nhập người dùng bằng Email:
    - Kiểm tra tính đúng đắn của mật khẩu đã băm.
    - Cập nhật thời gian đăng nhập cuối (last_login_at).
    Trả về: (thành_công, thông_báo, user_object)
    """
    if not email or not password:
        return False, "Vui lòng nhập đầy đủ email và mật khẩu.", None

    clean_email = email.strip().lower()
    user = get_user_by_email(clean_email)
    if not user:
        return False, "Tài khoản email không tồn tại trong hệ thống.", None

    if not user.is_active:
        return False, "Tài khoản hiện đang bị tạm khóa. Vui lòng liên hệ hỗ trợ.", None

    if not user.check_password(password):
        return False, "Mật khẩu không chính xác. Vui lòng kiểm tra lại.", None

    # Cập nhật thời gian đăng nhập cuối
    with get_db() as db:
        user_in_db = db.query(User).filter(User.id == user.id).first()
        if user_in_db:
            user_in_db.last_login_at = datetime.utcnow()

    # Cập nhật đối tượng trả về
    user.last_login_at = datetime.utcnow()
    return True, "Đăng nhập thành công!", user
