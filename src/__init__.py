import os
from flask import Flask
from .config import Config, BASE_DIR
from .routes import register_routes

def create_app():
    """
    Factory khởi tạo Flask Application:
    - Nạp cấu hình từ Config (src/config.py)
    - Thiết lập folder template và static trỏ ra thư mục gốc
    - Tạo các thư mục lưu trữ cần thiết (uploads)
    - Đăng ký toàn bộ Page Routes & API Blueprints
    """
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / 'templates'),
        static_folder=str(BASE_DIR / 'static')
    )
    
    # Nạp cấu hình
    app.config.from_object(Config)

    # Đảm bảo thư mục uploads tồn tại
    os.makedirs(app.config.get('UPLOAD_FOLDER', str(BASE_DIR / 'uploads')), exist_ok=True)

    # Đăng ký Blueprints phân hệ (Main, PDF, Ảnh, Tiện ích, Chuyển đổi)
    register_routes(app)

    return app
