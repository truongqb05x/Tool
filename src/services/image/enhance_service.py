"""
=========================================================
DỊCH VỤ NÂNG CẤP CHẤT LƯỢNG ẢNH - ENHANCE_SERVICE.PY
Khử mờ, làm nét chi tiết, cân bằng tương phản và ánh sáng tự động
=========================================================
"""

import os
from PIL import Image, ImageEnhance, ImageFilter
from .utils import open_image_safe, format_size


def enhance_image(
    input_path: str,
    output_path: str,
    mode: str = "auto",
    sharpness: float = 1.6,
    contrast: float = 1.2,
    brightness: float = 1.05,
    color: float = 1.15
) -> dict:
    """
    Nâng cấp chất lượng hình ảnh, tăng độ chi tiết và sắc nét.
    :param mode: 'auto' (tối ưu thông minh), 'hdr' (tương phản cao), 'sharp' (siêu sắc nét)
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

    if mode == "sharp":
        s_val, c_val, b_val, col_val = 2.0, 1.15, 1.0, 1.05
    elif mode == "hdr":
        s_val, c_val, b_val, col_val = 1.5, 1.35, 1.1, 1.25
    else:  # auto
        s_val, c_val, b_val, col_val = float(sharpness or 1.6), float(contrast or 1.2), float(brightness or 1.05), float(color or 1.15)

    # 1. Tinh chỉnh độ sáng
    if b_val != 1.0:
        enh_b = ImageEnhance.Brightness(img)
        img = enh_b.enhance(b_val)

    # 2. Tinh chỉnh độ tương phản
    if c_val != 1.0:
        enh_c = ImageEnhance.Contrast(img)
        img = enh_c.enhance(c_val)

    # 3. Tinh chỉnh độ rực rỡ màu sắc
    if col_val != 1.0:
        enh_col = ImageEnhance.Color(img)
        img = enh_col.enhance(col_val)

    # 4. Áp dụng Unsharp Mask để làm sắc nét chi tiết biên ảnh
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

    # 5. Tinh chỉnh độ nét tổng thể
    if s_val != 1.0:
        enh_s = ImageEnhance.Sharpness(img)
        img = enh_s.enhance(s_val)

    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        if img.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        img.save(output_path, 'JPEG', quality=95, optimize=True)
    elif ext == '.png':
        img.save(output_path, 'PNG', optimize=True)
    elif ext == '.webp':
        img.save(output_path, 'WEBP', quality=95)
    else:
        img.save(output_path)

    img.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "mode": mode,
        "width": w,
        "height": h,
        "sharpness": s_val,
        "contrast": c_val,
        "brightness": b_val,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
