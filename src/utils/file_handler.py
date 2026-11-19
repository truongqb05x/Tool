import os
from src.config import Config

def allowed_file(filename: str, category: str = 'pdf') -> bool:
    """Kiểm tra phần mở rộng của file có nằm trong danh sách cho phép không."""
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    allowed = Config.ALLOWED_EXTENSIONS.get(category, set())
    return ext in allowed
