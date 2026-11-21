"""
Thư mục Services: Nơi tập trung toàn bộ tầng nghiệp vụ (Business Logic Layer).
Bao gồm:
- user_service: Xử lý nghiệp vụ người dùng, đăng ký, đăng nhập và tài khoản.
- pdf_service: Thuật toán nén, gộp, tách, chuyển đổi PDF.
- image_service: Thuật toán cắt, xoay, tách nền, chỉnh màu ảnh.
- qr_service: Thuật toán sinh mã QR và tùy biến đồ họa.
"""

from .user_service import (
    create_user,
    authenticate_user,
    get_user_by_email,
    get_user_by_id,
    validate_email
)
from .pdf import (
    PdfService,
    compress_pdf,
    merge_pdfs,
    split_pdf
)
from .image import (
    ImageService,
    compress_image,
    resize_image,
    crop_image,
    convert_to_jpg,
    convert_from_jpg
)

