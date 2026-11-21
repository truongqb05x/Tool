"""
=========================================================
IMAGE ROUTES BLUEPRINT - __INIT__.PY
Gom toàn bộ các route con của danh mục hình ảnh thành một Blueprint
=========================================================
"""

from flask import Blueprint
from .view_routes import register_view_routes, IMAGE_TOOLS

image_bp = Blueprint('image', __name__, url_prefix='/anh')

# Đăng ký các route view
register_view_routes(image_bp)
