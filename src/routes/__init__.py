from .main_routes import main_bp
from .pdf import pdf_bp
from .anh import image_bp
from .utility_routes import utility_bp
from .conversion_routes import conversion_bp
from .auth_routes import auth_bp
from .user_routes import user_bp
from .text_routes import text_bp
from .txt_routes import txt_bp
from .developer_routes import developer_bp

def register_routes(app):
    """Đăng ký toàn bộ các Blueprints vào ứng dụng Flask."""
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(image_bp)
    app.register_blueprint(utility_bp)
    app.register_blueprint(conversion_bp)
    app.register_blueprint(text_bp)
    app.register_blueprint(txt_bp)
    app.register_blueprint(developer_bp)
