"""
=========================================================
PDF SERVICE PROXY - PDF_SERVICE.PY
Cung cấp khả năng tương thích ngược (Backward Compatibility)
chuyển tiếp toàn bộ lời gọi vào gói chuyên biệt src/services/pdf/
=========================================================
"""

from .pdf import (
    PdfService,
    format_size,
    compress_pdf,
    merge_pdfs,
    split_pdf,
    rotate_pdf,
    delete_pages,
    reorder_pages,
    extract_pages,
    edit_pdf,
    add_page_numbers,
    add_watermark,
    pdf_to_word,
    pdf_to_excel,
    pdf_to_powerpoint,
    word_to_pdf,
    excel_to_pdf,
    powerpoint_to_pdf,
    pdf_to_images,
    images_to_pdf,
    protect_pdf,
    unlock_pdf,
    sign_pdf,
    compare_pdfs,
    ocr_pdf,
    get_pdf_info
)

__all__ = [
    'PdfService',
    'format_size',
    'compress_pdf',
    'merge_pdfs',
    'split_pdf',
    'rotate_pdf',
    'delete_pages',
    'reorder_pages',
    'extract_pages',
    'edit_pdf',
    'add_page_numbers',
    'add_watermark',
    'pdf_to_word',
    'pdf_to_excel',
    'pdf_to_powerpoint',
    'word_to_pdf',
    'excel_to_pdf',
    'powerpoint_to_pdf',
    'pdf_to_images',
    'images_to_pdf',
    'protect_pdf',
    'unlock_pdf',
    'sign_pdf',
    'compare_pdfs',
    'ocr_pdf',
    'get_pdf_info'
]
