import os
from flask import Flask
from .config import Config, BASE_DIR
from .routes import register_routes
from .database import init_db, db_session

def create_app():
    """
    Factory khởi tạo Flask Application:
    - Nạp cấu hình từ Config (src/config.py)
    - Thiết lập folder template và static trỏ ra thư mục gốc
    - Tạo các thư mục lưu trữ cần thiết (uploads, database)
    - Khởi tạo Cơ sở dữ liệu và tự động sync schema
    - Đăng ký toàn bộ Page Routes & API Blueprints
    """
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / 'templates'),
        static_folder=str(BASE_DIR / 'static')
    )
    
    # Nạp cấu hình
    app.config.from_object(Config)

    # Đảm bảo thư mục uploads và database tồn tại
    os.makedirs(app.config.get('UPLOAD_FOLDER', str(BASE_DIR / 'uploads')), exist_ok=True)
    os.makedirs(app.config.get('DATABASE_DIR', str(BASE_DIR / 'src' / 'database')), exist_ok=True)

    # Khởi tạo Cơ sở dữ liệu SQLite & tự động đồng bộ Schema
    init_db(app.config.get('DATABASE_URI'))

    # Tự động đóng session sau mỗi request
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    # Đăng ký Blueprints phân hệ (Main, Auth, PDF, Ảnh, Tiện ích, Chuyển đổi)
    register_routes(app)

    return app
