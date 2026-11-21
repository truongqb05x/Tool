"""
=========================================================
DỊCH VỤ TRÌNH CHỈNH SỬA ẢNH - EFFECTS_SERVICE.PY
Bộ lọc màu nghệ thuật, độ sáng, độ tương phản và hiệu ứng ảnh
=========================================================
"""

import os
from PIL import Image, ImageEnhance, ImageOps
from .utils import open_image_safe, format_size


def edit_photo(
    input_path: str,
    output_path: str,
    filter_name: str = "none",
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0
) -> dict:
    """
    Áp dụng bộ lọc màu và tinh chỉnh tham số ánh sáng cho ảnh.
    :param filter_name: 'none', 'grayscale', 'sepia', 'vintage', 'warm', 'cool', 'invert'
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

    # 1. Áp dụng bộ lọc màu
    f_name = (filter_name or "none").lower().strip()
    if f_name == "grayscale":
        img = ImageOps.grayscale(img).convert('RGB')
    elif f_name == "sepia":
        gray = ImageOps.grayscale(img)
        # Tạo hiệu ứng sepia tông nâu ấm
        img = ImageOps.colorize(gray, black="#2e1a09", white="#f3e5ab").convert('RGB')
    elif f_name == "invert":
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = ImageOps.invert(img)
    elif f_name == "vintage":
        # Tăng tương phản nhẹ, ngả vàng ấm
        enh_c = ImageEnhance.Contrast(img)
        img = enh_c.enhance(1.2)
        r, g, b = img.convert('RGB').split()
        r = r.point(lambda i: min(255, int(i * 1.1)))
        b = b.point(lambda i: int(i * 0.9))
        img = Image.merge('RGB', (r, g, b))
    elif f_name == "warm":
        r, g, b = img.convert('RGB').split()
        r = r.point(lambda i: min(255, int(i * 1.08)))
        img = Image.merge('RGB', (r, g, b))
    elif f_name == "cool":
        r, g, b = img.convert('RGB').split()
        b = b.point(lambda i: min(255, int(i * 1.12)))
        img = Image.merge('RGB', (r, g, b))

    # 2. Tinh chỉnh Brightness, Contrast, Saturation
    b_val = float(brightness or 1.0)
    c_val = float(contrast or 1.0)
    s_val = float(saturation or 1.0)

    if b_val != 1.0:
        enh_b = ImageEnhance.Brightness(img)
        img = enh_b.enhance(b_val)
    if c_val != 1.0:
        enh_c = ImageEnhance.Contrast(img)
        img = enh_c.enhance(c_val)
    if s_val != 1.0 and img.mode in ('RGB', 'RGBA'):
        enh_s = ImageEnhance.Color(img)
        img = enh_s.enhance(s_val)

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
        "filter": f_name,
        "width": w,
        "height": h,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
