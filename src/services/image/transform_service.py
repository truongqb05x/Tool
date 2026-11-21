"""
=========================================================
DỊCH VỤ XOAY & LẬT HÌNH ẢNH - TRANSFORM_SERVICE.PY
Xoay 90, 180, 270 độ và lật gương theo chiều ngang/dọc
=========================================================
"""

import os
from PIL import Image
from .utils import open_image_safe, format_size


def rotate_image(
    input_path: str,
    output_path: str,
    angle: int = 90,
    flip_h: bool = False,
    flip_v: bool = False
) -> dict:
    """
    Xoay ảnh và lật ảnh đối xứng.
    :param input_path: Đường dẫn ảnh gốc
    :param output_path: Đường dẫn lưu ảnh kết quả
    :param angle: Góc xoay theo chiều kim đồng hồ (90, 180, 270)
    :param flip_h: Lật gương theo chiều ngang (Horizontal Flip)
    :param flip_v: Lật gương theo chiều dọc (Vertical Flip)
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
    orig_w, orig_h = img.size

    # Xoay ảnh theo góc (Pillow rotate theo chiều ngược kim đồng hồ nên dùng -angle)
    norm_angle = int(angle or 0) % 360
    if norm_angle != 0:
        # Sử dụng expand=True để không bị cắt xén góc ảnh
        img = img.rotate(-norm_angle, expand=True)

    if flip_h:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if flip_v:
        img = img.transpose(Image.FLIP_TOP_BOTTOM)

    new_w, new_h = img.size
    ext = os.path.splitext(output_path)[1].lower()

    if ext in ['.jpg', '.jpeg']:
        if img.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        img.save(output_path, 'JPEG', quality=92, optimize=True)
    elif ext == '.png':
        img.save(output_path, 'PNG', optimize=True)
    elif ext == '.webp':
        img.save(output_path, 'WEBP', quality=92)
    else:
        img.save(output_path)

    img.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "angle": norm_angle,
        "flip_h": flip_h,
        "flip_v": flip_v,
        "orig_width": orig_w,
        "orig_height": orig_h,
        "new_width": new_w,
        "new_height": new_h,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
