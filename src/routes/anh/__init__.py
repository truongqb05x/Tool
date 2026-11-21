"""
=========================================================
IMAGE ROUTES BLUEPRINT - __INIT__.PY
Gom toàn bộ các route con của danh mục hình ảnh thành một Blueprint
=========================================================
"""

from flask import Blueprint
from .view_routes import register_view_routes, IMAGE_TOOLS
from .download_routes import register_download_routes
from .nen_anh import register_nen_anh_routes
from .thay_doi_kich_thuoc import register_thay_doi_kich_thuoc_routes
from .cat_anh import register_cat_anh_routes
from .chuyen_sang_jpg import register_chuyen_sang_jpg_routes
from .chuyen_tu_jpg import register_chuyen_tu_jpg_routes
from .chinh_sua_anh import register_chinh_sua_anh_routes
from .nang_cap_anh import register_nang_cap_anh_routes
from .xoa_phong import register_xoa_phong_routes
from .dong_dau_anh import register_dong_dau_anh_routes
from .tao_anh_che import register_tao_anh_che_routes
from .xoay_anh import register_xoay_anh_routes
from .html_sang_anh import register_html_sang_anh_routes
from .lam_mo_mat import register_lam_mo_mat_routes

image_bp = Blueprint('image', __name__, url_prefix='/anh')

# Đăng ký các route view
register_view_routes(image_bp)

# Đăng ký route tải file kết quả
register_download_routes(image_bp)

# Đăng ký các route API xử lý ảnh
register_nen_anh_routes(image_bp)
register_thay_doi_kich_thuoc_routes(image_bp)
register_cat_anh_routes(image_bp)
register_chuyen_sang_jpg_routes(image_bp)
register_chuyen_tu_jpg_routes(image_bp)
register_chinh_sua_anh_routes(image_bp)
register_nang_cap_anh_routes(image_bp)
register_xoa_phong_routes(image_bp)
register_dong_dau_anh_routes(image_bp)
register_tao_anh_che_routes(image_bp)
register_xoay_anh_routes(image_bp)
register_html_sang_anh_routes(image_bp)
register_lam_mo_mat_routes(image_bp)
