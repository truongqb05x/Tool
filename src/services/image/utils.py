"""
=========================================================
TIỆN ÍCH DÀNH CHO XỬ LÝ HÌNH ẢNH - UTILS.PY
Hỗ trợ định dạng dung lượng, mở và lưu ảnh Pillow an toàn
=========================================================
"""

import os
from PIL import Image, ImageOps


def format_size(size_bytes: int) -> str:
    """Định dạng số byte thành chuỗi dung lượng dễ đọc (B, KB, MB, GB)."""
    if not size_bytes or size_bytes <= 0:
        return "0 B"
    units = ['B', 'KB', 'MB', 'GB']
    size = float(size_bytes)
    unit_idx = 0
    while size >= 1024.0 and unit_idx < len(units) - 1:
        size /= 1024.0
        unit_idx += 1
    if unit_idx == 0:
        return f"{int(size)} {units[unit_idx]}"
    return f"{size:.2f} {units[unit_idx]}"


def open_image_safe(image_path: str) -> Image.Image:
    """Mở file ảnh và tự động xoay chuẩn theo cờ EXIF Orientation."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Không tìm thấy file ảnh: {image_path}")

    img = Image.open(image_path)
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass
    return img


def get_image_info(image_path: str) -> dict:
    """Lấy thông tin kích thước pixel, định dạng và dung lượng file ảnh."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Không tìm thấy file ảnh: {image_path}")

    file_size = os.path.getsize(image_path)
    with Image.open(image_path) as img:
        w, h = img.size
        img_format = img.format or "UNKNOWN"
        mode = img.mode

    return {
        "width": w,
        "height": h,
        "format": img_format,
        "mode": mode,
        "file_size": file_size,
        "file_size_formatted": format_size(file_size)
    }
