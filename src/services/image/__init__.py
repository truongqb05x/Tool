"""
=========================================================
IMAGE SERVICES PACKAGE - __INIT__.PY
Gói nghiệp vụ xử lý hình ảnh phân tách thành các module chuyên biệt:
- utils: Tiện ích định dạng dung lượng, mở và lưu ảnh an toàn
- compress_service: Nén giảm dung lượng ảnh JPG, PNG, WEBP
- resize_service: Thu phóng kích thước ảnh theo pixel hoặc %
- crop_service: Cắt xén ảnh theo vùng chọn hoặc tỉ lệ khung hình
- convert_service: Chuyển đổi định dạng sang JPG và từ JPG
- transform_service: Xoay 90/180/270 độ và lật gương đối xứng
- watermark_service: Chèn Watermark chữ hoặc logo hình ảnh
- enhance_service: Khử mờ, làm nét và nâng cấp chất lượng ảnh
- effects_service: Bộ lọc màu nghệ thuật và tinh chỉnh ánh sáng
- face_blur_service: Nhận diện khuôn mặt và làm mờ bảo mật
- meme_service: Tạo ảnh chế Meme kinh điển
- bg_remove_service: Tự động xóa phông tách nền PNG trong suốt
- html_service: Chuyển đổi HTML sang hình ảnh
=========================================================
"""

from .utils import format_size, open_image_safe, get_image_info
from .compress_service import compress_image
from .resize_service import resize_image
from .crop_service import crop_image
from .convert_service import convert_to_jpg, convert_from_jpg
from .transform_service import rotate_image
from .watermark_service import add_watermark_image
from .enhance_service import enhance_image
from .effects_service import edit_photo
from .face_blur_service import blur_faces
from .meme_service import create_meme
from .bg_remove_service import remove_background
from .html_service import html_to_image


class ImageService:
    """
    Lớp facade đại diện cho toàn bộ 13 nghiệp vụ hình ảnh của ToolHub.
    Cung cấp giao diện gọi tĩnh tương thích 100% với kiến trúc của hệ thống.
    """
    # 1. Nén ảnh
    compress_image = staticmethod(compress_image)

    # 2. Thay đổi kích thước ảnh
    resize_image = staticmethod(resize_image)

    # 3. Cắt ảnh
    crop_image = staticmethod(crop_image)

    # 4. Chuyển sang JPG
    convert_to_jpg = staticmethod(convert_to_jpg)

    # 5. Chuyển từ JPG
    convert_from_jpg = staticmethod(convert_from_jpg)

    # 6. Trình chỉnh sửa ảnh
    edit_photo = staticmethod(edit_photo)

    # 7. Nâng cấp chất lượng ảnh
    enhance_image = staticmethod(enhance_image)

    # 8. Xóa phông
    remove_background = staticmethod(remove_background)

    # 9. Đóng dấu bản quyền ảnh
    add_watermark_image = staticmethod(add_watermark_image)

    # 10. Tạo ảnh chế
    create_meme = staticmethod(create_meme)

    # 11. Xoay ảnh
    rotate_image = staticmethod(rotate_image)

    # 12. Chuyển HTML sang ảnh
    html_to_image = staticmethod(html_to_image)

    # 13. Làm mờ khuôn mặt
    blur_faces = staticmethod(blur_faces)

    # Utilities
    get_image_info = staticmethod(get_image_info)


__all__ = [
    'ImageService',
    'format_size',
    'open_image_safe',
    'get_image_info',
    'compress_image',
    'resize_image',
    'crop_image',
    'convert_to_jpg',
    'convert_from_jpg',
    'rotate_image',
    'add_watermark_image',
    'enhance_image',
    'edit_photo',
    'blur_faces',
    'create_meme',
    'remove_background',
    'html_to_image'
]
