"""
=========================================================
PDF SERVICES PACKAGE - __INIT__.PY
Gói nghiệp vụ PDF phân tách thành các module chuyên biệt:
- utils: Tiện ích định dạng dung lượng
- compress_service: Dịch vụ nén PDF thực tế
- merge_service: Dịch vụ gộp nhiều file PDF và xoay trang
- split_service: Dịch vụ bóc tách PDF linh hoạt (Phạm vi / Theo trang / Dung lượng)
- organize_service: Xoay, xóa, sắp xếp, trích xuất, đánh số trang, watermark
- convert_service: Chuyển đổi PDF sang Office (Word, Excel, PowerPoint), ảnh và ngược lại
- security_service: Đặt mật khẩu, mở khóa, ký PDF
- advanced_service: So sánh PDF, OCR, đọc thông tin siêu dữ liệu
=========================================================
"""

from .utils import format_size
from .compress_service import compress_pdf
from .merge_service import merge_pdfs
from .split_service import split_pdf
from .organize_service import (
    rotate_pdf,
    delete_pages,
    reorder_pages,
    extract_pages,
    edit_pdf,
    add_page_numbers,
    add_watermark
)
from .convert_service import (
    pdf_to_word,
    pdf_to_excel,
    pdf_to_powerpoint,
    word_to_pdf,
    excel_to_pdf,
    powerpoint_to_pdf,
    pdf_to_images,
    images_to_pdf
)
from .security_service import (
    protect_pdf,
    unlock_pdf,
    sign_pdf
)
from .advanced_service import (
    compare_pdfs,
    ocr_pdf,
    get_pdf_info
)


class PdfService:
    """
    Lớp facade đại diện cho toàn bộ 24 nghiệp vụ PDF của ToolHub.
    Giúp duy trì tính tương thích 100% với các route hiện tại đồng thời
    chuyển tiếp lời gọi xử lý vào các file logic nhỏ tương ứng.
    """
    # 1. Nén PDF
    compress_pdf = staticmethod(compress_pdf)

    # 2. Gộp PDF
    merge_pdfs = staticmethod(merge_pdfs)

    # 3. Tách PDF
    split_pdf = staticmethod(split_pdf)

    # 4. Xoay PDF
    rotate_pdf = staticmethod(rotate_pdf)

    # 5. Xóa trang PDF
    delete_pages = staticmethod(delete_pages)

    # 6. Sắp xếp trang PDF
    reorder_pages = staticmethod(reorder_pages)

    # 7. Trích xuất trang PDF
    extract_pages = staticmethod(extract_pages)

    # 8. Chuyển PDF sang Word
    pdf_to_word = staticmethod(pdf_to_word)

    # 9. Chuyển PDF sang Excel
    pdf_to_excel = staticmethod(pdf_to_excel)

    # 10. Chuyển PDF sang PowerPoint
    pdf_to_powerpoint = staticmethod(pdf_to_powerpoint)

    # 11. Chuyển Word sang PDF
    word_to_pdf = staticmethod(word_to_pdf)

    # 12. Chuyển Excel sang PDF
    excel_to_pdf = staticmethod(excel_to_pdf)

    # 13. Chuyển PowerPoint sang PDF
    powerpoint_to_pdf = staticmethod(powerpoint_to_pdf)

    # 14. PDF sang ảnh
    pdf_to_images = staticmethod(pdf_to_images)

    # 15. Ảnh sang PDF
    images_to_pdf = staticmethod(images_to_pdf)

    # 16. Chỉnh sửa PDF
    edit_pdf = staticmethod(edit_pdf)

    # 17. Thêm số trang PDF
    add_page_numbers = staticmethod(add_page_numbers)

    # 18. Thêm watermark PDF
    add_watermark = staticmethod(add_watermark)

    # 19. Bảo vệ PDF
    protect_pdf = staticmethod(protect_pdf)

    # 20. Mở khóa PDF
    unlock_pdf = staticmethod(unlock_pdf)

    # 21. Ký PDF
    sign_pdf = staticmethod(sign_pdf)

    # 22. So sánh PDF
    compare_pdfs = staticmethod(compare_pdfs)

    # 23. OCR PDF
    ocr_pdf = staticmethod(ocr_pdf)

    # 24. Đọc thông tin PDF
    get_pdf_info = staticmethod(get_pdf_info)


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
