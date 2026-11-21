"""
Dịch vụ xử lý hình ảnh (Image Service Facade)
Duy trì tương thích ngược 100%, chuyển tiếp lời gọi sang package src.services.image
"""

from .image import (
    ImageService,
    compress_image,
    resize_image,
    crop_image,
    convert_to_jpg,
    convert_from_jpg,
    rotate_image,
    add_watermark_image,
    enhance_image,
    edit_photo,
    blur_faces,
    create_meme,
    remove_background,
    html_to_image,
    format_size,
    get_image_info
)

__all__ = [
    'ImageService',
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
    'html_to_image',
    'format_size',
    'get_image_info'
]
