"""
=========================================================
DỊCH VỤ CHUYỂN ĐỔI ĐỊNH DẠNG ẢNH - CONVERT_SERVICE.PY
Chuyển đổi linh hoạt giữa JPG, PNG, WEBP, GIF, BMP, TIFF
=========================================================
"""

import os
from PIL import Image
from .utils import open_image_safe, format_size


def convert_to_jpg(
    input_path: str,
    output_path: str,
    quality: int = 90,
    bg_color: tuple = (255, 255, 255)
) -> dict:
    """
    Chuyển đổi hình ảnh từ PNG, WEBP, GIF, BMP, TIFF sang định dạng chuẩn JPG.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    img = open_image_safe(input_path)
    w, h = img.size

    # Xử lý kênh alpha / trong suốt khi sang JPG (JPG không hỗ trợ alpha)
    if img.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', img.size, bg_color)
        alpha = img.split()[-1] if 'A' in img.mode else None
        bg.paste(img, mask=alpha)
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    img.save(output_path, 'JPEG', quality=quality, optimize=True, progressive=True)
    img.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "width": w,
        "height": h,
        "format": "JPG",
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }


def convert_from_jpg(
    input_path: str,
    output_path: str,
    target_format: str = "png",
    quality: int = 90
) -> dict:
    """
    Chuyển đổi hình ảnh từ JPG sang PNG, WEBP, GIF, BMP.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    img = open_image_safe(input_path)
    w, h = img.size

    fmt = target_format.lower().strip().replace('.', '')
    if fmt == 'png':
        img.save(output_path, 'PNG', optimize=True)
    elif fmt == 'webp':
        img.save(output_path, 'WEBP', quality=quality)
    elif fmt == 'gif':
        img = img.convert('P', palette=Image.ADAPTIVE)
        img.save(output_path, 'GIF')
    elif fmt == 'bmp':
        img.save(output_path, 'BMP')
    else:
        img.save(output_path)

    img.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "width": w,
        "height": h,
        "format": fmt.upper(),
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
