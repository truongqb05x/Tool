import os
from pathlib import Path

# Thư mục gốc của toàn bộ dự án (thư mục cha của src/)
BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    """Cấu hình chung cho toàn bộ ứng dụng ToolHub Flask."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'toolhub-dev-secret-key-2025-secure')
    
    # Cấu hình tải tệp tin và lưu trữ tạm
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # Giới hạn tối đa 50MB cho mỗi tệp
    
    # Danh sách định dạng tệp tin hợp lệ theo từng phân hệ
    ALLOWED_EXTENSIONS = {
        'pdf': {'pdf'},
        'image': {'png', 'jpg', 'jpeg', 'gif', 'webp'},
        'office': {'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'}
    }
    
    # Tự động reload khi template thay đổi
    TEMPLATES_AUTO_RELOAD = True
