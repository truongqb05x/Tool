from .main_routes import main_bp
from .pdf_routes import pdf_bp
from .image_routes import image_bp
from .utility_routes import utility_bp
from .conversion_routes import conversion_bp
from .auth_routes import auth_bp

def register_routes(app):
    """Đăng ký toàn bộ các Blueprints vào ứng dụng Flask."""
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(image_bp)
    app.register_blueprint(utility_bp)
    app.register_blueprint(conversion_bp)
