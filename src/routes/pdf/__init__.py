"""
=========================================================
PDF ROUTES BLUEPRINT - __INIT__.PY
Gom toàn bộ các route con của danh mục PDF thành một Blueprint duy nhất
=========================================================
"""

from flask import Blueprint
from .view_routes import register_view_routes, PDF_TOOLS
from .nen_pdf import register_nen_pdf_routes
from .gop_pdf import register_gop_pdf_routes
from .tach_pdf import register_tach_pdf_routes
from .xoay_pdf import register_xoay_pdf_routes
from .xoa_trang_pdf import register_xoa_trang_pdf_routes
from .sap_xep_trang_pdf import register_sap_xep_trang_pdf_routes
from .trich_xuat_trang_pdf import register_trich_xuat_trang_pdf_routes
from .them_so_trang_pdf import register_them_so_trang_pdf_routes
from .them_watermark_pdf import register_them_watermark_pdf_routes
from .bao_ve_pdf import register_bao_ve_pdf_routes
from .mo_khoa_pdf import register_mo_khoa_pdf_routes
from .pdf_sang_anh import register_pdf_sang_anh_routes
from .anh_sang_pdf import register_anh_sang_pdf_routes
from .download_routes import register_download_routes
from .fallback_routes import register_fallback_routes

# Tạo Blueprint chính cho toàn bộ tính năng PDF
pdf_bp = Blueprint('pdf', __name__, url_prefix='/pdf')

# Đăng ký các module chức năng con
register_view_routes(pdf_bp)
register_nen_pdf_routes(pdf_bp)
register_gop_pdf_routes(pdf_bp)
register_tach_pdf_routes(pdf_bp)
register_xoay_pdf_routes(pdf_bp)
register_xoa_trang_pdf_routes(pdf_bp)
register_sap_xep_trang_pdf_routes(pdf_bp)
register_trich_xuat_trang_pdf_routes(pdf_bp)
register_them_so_trang_pdf_routes(pdf_bp)
register_them_watermark_pdf_routes(pdf_bp)
register_bao_ve_pdf_routes(pdf_bp)
register_mo_khoa_pdf_routes(pdf_bp)
register_pdf_sang_anh_routes(pdf_bp)
register_anh_sang_pdf_routes(pdf_bp)
register_download_routes(pdf_bp)
register_fallback_routes(pdf_bp)

__all__ = ['pdf_bp', 'PDF_TOOLS']
