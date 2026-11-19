"""
=========================================================
DATABASE MODELS - MODELS.PY
Định nghĩa các thực thể CSDL bằng SQLAlchemy ORM.
Khi cần thêm bảng hoặc cột mới, chỉ cần khai báo thêm tại đây!
=========================================================
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, backref
from werkzeug.security import generate_password_hash, check_password_hash

# Lớp cơ sở cho toàn bộ Model ORM
Base = declarative_base()


def format_size(size_bytes: int) -> str:
    """Định dạng dung lượng bytes sang chuỗi hiển thị dễ đọc (B, KB, MB, GB)."""
    if not size_bytes or size_bytes < 0:
        return "0 B"
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{(size_bytes / 1024):.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{(size_bytes / (1024 * 1024)):.2f} MB"
    else:
        return f"{(size_bytes / (1024 * 1024 * 1024)):.2f} GB"


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

    # Quan hệ 1-N với danh sách file của người dùng
    files = relationship('UserFile', back_populates='user', cascade='all, delete-orphan', lazy=True)

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
            'last_login_at': (self.last_login_at.isoformat() + 'Z') if self.last_login_at else None,
            'created_at': (self.created_at.isoformat() + 'Z') if self.created_at else None
        }

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}'>"


class UserFile(Base):
    """
    Bảng tệp tin người dùng (user_files):
    Lưu trữ các file đã xử lý thành công qua các công cụ của ToolHub dành cho người dùng đã đăng nhập.
    """
    __tablename__ = 'user_files'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    original_name = Column(String(255), nullable=False)       # Tên file gốc người dùng tải lên
    file_name = Column(String(255), nullable=False)           # Tên file kết quả (kèm đuôi _nen.pdf, v.v.)
    file_path = Column(String(500), nullable=False)           # Đường dẫn lưu trữ vật lý trên server
    file_size = Column(Integer, default=0, nullable=False)    # Dung lượng file đã xử lý (bytes)
    file_type = Column(String(50), default='pdf')             # Loại file: pdf, png, jpg, docx, ...
    tool_slug = Column(String(100), default='nen-pdf')        # Mã công cụ (nen-pdf, gop-pdf, ...)
    tool_title = Column(String(100), default='Nén PDF')       # Tiêu đề công cụ
    meta_info = Column(Text, nullable=True)                   # JSON lưu chi tiết: original_size, saved_percent, level, ...
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='files')

    def to_dict(self) -> dict:
        """Chuyển đổi dữ liệu sang định dạng JSON trả về cho frontend."""
        import json
        meta = {}
        if self.meta_info:
            try:
                meta = json.loads(self.meta_info)
            except Exception:
                meta = {}

        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_name': self.original_name,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'file_size_formatted': format_size(self.file_size),
            'file_type': (self.file_type or 'pdf').lower(),
            'tool_slug': self.tool_slug,
            'tool_title': self.tool_title,
            'meta': meta,
            'download_url': f"/api/user/files/{self.id}/download",
            'created_at': (self.created_at.isoformat() + 'Z') if self.created_at else None
        }

    def __repr__(self):
        return f"<UserFile id={self.id} user_id={self.user_id} file_name='{self.file_name}'>"
