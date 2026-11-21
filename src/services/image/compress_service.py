"""
=========================================================
DỊCH VỤ NÉN HÌNH ẢNH - COMPRESS_SERVICE.PY
Giảm dung lượng ảnh JPG, PNG, WEBP mà vẫn giữ độ nét cao
=========================================================
"""

import os
from PIL import Image
from .utils import open_image_safe, format_size


def compress_image(
    input_path: str,
    output_path: str,
    level: str = "recommended",
    remove_exif: bool = True
) -> dict:
    """
    Nén tối ưu dung lượng hình ảnh.
    :param input_path: Đường dẫn ảnh gốc
    :param output_path: Đường dẫn lưu ảnh sau nén
    :param level: 'recommended' (khuyến nghị ~75%), 'extreme' (~55%), 'light' (~88%)
    :param remove_exif: Có loại bỏ siêu dữ liệu EXIF / GPS hay không
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Xác định mức chất lượng
    if level == "extreme":
        quality = 55
    elif level == "light":
        quality = 88
    else:  # recommended
        quality = 75

    img = open_image_safe(input_path)
    orig_w, orig_h = img.size
    ext = os.path.splitext(output_path)[1].lower()

    # Xử lý theo định dạng
    if ext in ['.jpg', '.jpeg']:
        if img.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        img.save(output_path, 'JPEG', quality=quality, optimize=True, progressive=True)

    elif ext == '.png':
        # Đối với PNG, nếu ở chế độ extreme nén quantize P mode (8-bit)
        if level == "extreme":
            q_img = img.convert('P', palette=Image.ADAPTIVE, colors=256)
            q_img.save(output_path, 'PNG', optimize=True)
        else:
            img.save(output_path, 'PNG', optimize=True, compress_level=9)

    elif ext == '.webp':
        img.save(output_path, 'WEBP', quality=quality, method=6)

    else:
        # Định dạng khác lưu giữ nguyên
        if img.mode in ('RGBA', 'P') and ext not in ['.png', '.webp', '.gif']:
            img = img.convert('RGB')
        img.save(output_path, quality=quality, optimize=True)

    img.close()

    result_size = os.path.getsize(output_path)
    # Nếu file nén lại lớn hơn file gốc, giữ file gốc
    if result_size > orig_size:
        import shutil
        shutil.copy2(input_path, output_path)
        result_size = orig_size

    saved_bytes = max(0, orig_size - result_size)
    saved_percent = round((saved_bytes / orig_size) * 100, 1) if orig_size > 0 else 0.0

    return {
        "status": "success",
        "level": level,
        "width": orig_w,
        "height": orig_h,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "saved_bytes": saved_bytes,
        "saved_percent": saved_percent,
        "output_path": output_path
    }
