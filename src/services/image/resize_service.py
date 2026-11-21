"""
=========================================================
DỊCH VỤ THAY ĐỔI KÍCH THƯỚC ẢNH - RESIZE_SERVICE.PY
Thu phóng ảnh theo pixel hoặc phần trăm với thuật toán Lanczos sắc nét
=========================================================
"""

import os
from PIL import Image
from .utils import open_image_safe, format_size


def resize_image(
    input_path: str,
    output_path: str,
    width: int = None,
    height: int = None,
    percent: float = None,
    maintain_aspect: bool = True
) -> dict:
    """
    Thay đổi kích thước hình ảnh theo pixel hoặc tỉ lệ %.
    :param input_path: Đường dẫn ảnh gốc
    :param output_path: Đường dẫn lưu ảnh kết quả
    :param width: Chiều rộng mới (pixel)
    :param height: Chiều cao mới (pixel)
    :param percent: Tỷ lệ phần trăm (vd 50 cho 50%, 200 cho 200%)
    :param maintain_aspect: Giữ nguyên tỷ lệ khung hình hay không
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

    # Tính toán kích thước mới
    if percent:
        scale = float(percent) / 100.0
        new_w = max(1, int(orig_w * scale))
        new_h = max(1, int(orig_h * scale))
    elif width and height:
        if maintain_aspect:
            # Fit trong khung width x height
            ratio = min(width / orig_w, height / orig_h)
            new_w = max(1, int(orig_w * ratio))
            new_h = max(1, int(orig_h * ratio))
        else:
            new_w = int(width)
            new_h = int(height)
    elif width:
        new_w = int(width)
        new_h = max(1, int(orig_h * (width / orig_w)))
    elif height:
        new_h = int(height)
        new_w = max(1, int(orig_w * (height / orig_h)))
    else:
        new_w, new_h = orig_w, orig_h

    # Thu phóng ảnh với bộ lọc Lanczos cao cấp
    resized = img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)

    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        if resized.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', resized.size, (255, 255, 255))
            bg.paste(resized, mask=resized.split()[-1] if 'A' in resized.mode else None)
            resized = bg
        elif resized.mode != 'RGB':
            resized = resized.convert('RGB')
        resized.save(output_path, 'JPEG', quality=90, optimize=True)
    elif ext == '.png':
        resized.save(output_path, 'PNG', optimize=True)
    elif ext == '.webp':
        resized.save(output_path, 'WEBP', quality=90)
    else:
        resized.save(output_path)

    img.close()
    resized.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
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
