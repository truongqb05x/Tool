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
from .pdf_sang_word import register_pdf_sang_word_routes
from .word_sang_pdf import register_word_sang_pdf_routes
from .pdf_sang_excel import register_pdf_sang_excel_routes
from .excel_sang_pdf import register_excel_sang_pdf_routes
from .pdf_sang_powerpoint import register_pdf_sang_powerpoint_routes
from .powerpoint_sang_pdf import register_powerpoint_sang_pdf_routes
from .chinh_sua_pdf import register_chinh_sua_pdf_routes
from .ky_pdf import register_ky_pdf_routes
from .so_sanh_pdf import register_so_sanh_pdf_routes
from .ocr_pdf import register_ocr_pdf_routes
from .doc_thong_tin_pdf import register_doc_thong_tin_pdf_routes
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
register_pdf_sang_word_routes(pdf_bp)
register_word_sang_pdf_routes(pdf_bp)
register_pdf_sang_excel_routes(pdf_bp)
register_excel_sang_pdf_routes(pdf_bp)
register_pdf_sang_powerpoint_routes(pdf_bp)
register_powerpoint_sang_pdf_routes(pdf_bp)
register_chinh_sua_pdf_routes(pdf_bp)
register_ky_pdf_routes(pdf_bp)
register_so_sanh_pdf_routes(pdf_bp)
register_ocr_pdf_routes(pdf_bp)
register_doc_thong_tin_pdf_routes(pdf_bp)
register_download_routes(pdf_bp)
register_fallback_routes(pdf_bp)

__all__ = ['pdf_bp', 'PDF_TOOLS']
