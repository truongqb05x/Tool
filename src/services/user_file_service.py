"""
=========================================================
USER FILE SERVICE - USER_FILE_SERVICE.PY
Quản lý lưu trữ, truy vấn, tải xuống và xóa tệp của người dùng.
=========================================================
"""

import os
import json
import shutil
from datetime import datetime
from ..database import db_session
from ..database.models import UserFile, format_size


def save_user_file(
    user_id: int,
    original_name: str,
    file_name: str,
    file_path: str,
    file_size: int,
    file_type: str = 'pdf',
    tool_slug: str = 'nen-pdf',
    tool_title: str = 'Nén PDF',
    meta_dict: dict = None
) -> UserFile:
    """
    Lưu một file đã xử lý thành công vào cơ sở dữ liệu cho người dùng.
    """
    meta_json = json.dumps(meta_dict, ensure_ascii=False) if meta_dict else None

    user_file = UserFile(
        user_id=user_id,
        original_name=original_name,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        tool_slug=tool_slug,
        tool_title=tool_title,
        meta_info=meta_json,
        created_at=datetime.utcnow()
    )

    db_session.add(user_file)
    db_session.commit()
    db_session.refresh(user_file)
    return user_file


def get_user_files(user_id: int, limit: int = 50) -> list:
    """
    Lấy danh sách các tệp tin của người dùng theo thứ tự mới nhất trước.
    """
    return db_session.query(UserFile).filter(
        UserFile.user_id == user_id
    ).order_by(
        UserFile.created_at.desc()
    ).limit(limit).all()


def get_user_file_by_id(user_id: int, file_id: int) -> UserFile:
    """
    Lấy thông tin tệp tin theo ID với kiểm tra quyền sở hữu của người dùng.
    """
    return db_session.query(UserFile).filter(
        UserFile.id == file_id,
        UserFile.user_id == user_id
    ).first()


def delete_user_file(user_id: int, file_id: int) -> bool:
    """
    Xóa tệp tin khỏi cơ sở dữ liệu và xóa file vật lý tương ứng trên đĩa.
    """
    user_file = get_user_file_by_id(user_id, file_id)
    if not user_file:
        return False

    # Xóa file vật lý trên đĩa nếu tồn tại
    try:
        if user_file.file_path and os.path.exists(user_file.file_path):
            os.remove(user_file.file_path)
    except OSError:
        pass

    db_session.delete(user_file)
    db_session.commit()
    return True


def get_user_stats(user_id: int) -> dict:
    """
    Tính toán các chỉ số thống kê thực tế của người dùng:
    - Tổng số file đã xử lý
    - Tổng dung lượng lưu trữ hiện tại
    - Tổng dung lượng đã tiết kiệm được
    """
    files = db_session.query(UserFile).filter(UserFile.user_id == user_id).all()
    
    total_files = len(files)
    total_size = sum(f.file_size for f in files)
    
    total_saved_bytes = 0
    tools_used = set()

    for f in files:
        if f.tool_slug:
            tools_used.add(f.tool_slug)
        if f.meta_info:
            try:
                m = json.loads(f.meta_info)
                orig = m.get('original_size', 0)
                comp = m.get('compressed_size', 0)
                if orig > comp:
                    total_saved_bytes += (orig - comp)
            except Exception:
                pass

    return {
        'total_files': total_files,
        'total_size_bytes': total_size,
        'total_size_formatted': format_size(total_size),
        'tools_used_count': len(tools_used),
        'total_saved_bytes': total_saved_bytes,
        'total_saved_formatted': format_size(total_saved_bytes)
    }
