"""
=========================================================
DATABASE MODELS - MODELS.PY
Định nghĩa các thực thể CSDL bằng SQLAlchemy ORM.
Khi cần thêm bảng hoặc cột mới, chỉ cần khai báo thêm tại đây!
=========================================================
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base
from werkzeug.security import generate_password_hash, check_password_hash

# Lớp cơ sở cho toàn bộ Model ORM
Base = declarative_base()


class User(Base):
    """
    Bảng người dùng (users):
    Lưu trữ tài khoản xác thực bằng email, mật khẩu đã mã hóa và trạng thái đăng nhập.
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def set_password(self, password: str):
        """Băm mật khẩu an toàn sử dụng Werkzeug PBKDF2/SHA256."""
        if not password or len(password) < 6:
            raise ValueError("Mật khẩu phải có tối thiểu 6 ký tự.")
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Kiểm tra mật khẩu nhập vào khớp với bản băm hay không."""
        if not self.password_hash or not password:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Chuyển đổi thành từ điển dữ liệu an toàn để trả về client (ẩn password_hash)."""
        display_name = self.email.split('@')[0] if self.email else 'User'
        return {
            'id': self.id,
            'email': self.email,
            'name': display_name.capitalize(),
            'is_active': self.is_active,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}'>"
