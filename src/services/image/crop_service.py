"""
=========================================================
DỊCH VỤ CẮT HÌNH ẢNH - CROP_SERVICE.PY
Cắt xén ảnh theo vùng chọn tọa độ pixel hoặc tỷ lệ khung hình chuẩn
=========================================================
"""

import os
from PIL import Image
from .utils import open_image_safe, format_size


def crop_image(
    input_path: str,
    output_path: str,
    x: int = 0,
    y: int = 0,
    width: int = None,
    height: int = None,
    aspect_ratio: str = None
) -> dict:
    """
    Cắt xén một phần của hình ảnh.
    :param input_path: Đường dẫn ảnh gốc
    :param output_path: Đường dẫn lưu ảnh kết quả
    :param x: Tọa độ x bắt đầu (tính từ cạnh trái)
    :param y: Tọa độ y bắt đầu (tính từ cạnh trên)
    :param width: Chiều rộng vùng cắt
    :param height: Chiều cao vùng cắt
    :param aspect_ratio: '1:1', '16:9', '4:3', '9:16'
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

    x = max(0, min(int(x or 0), orig_w - 1))
    y = max(0, min(int(y or 0), orig_h - 1))

    if aspect_ratio:
        # Cắt theo tỷ lệ đặt ở trung tâm nếu width/height không chỉ định
        if aspect_ratio == '1:1':
            side = min(orig_w, orig_h)
            crop_w, crop_h = side, side
            x = (orig_w - side) // 2
            y = (orig_h - side) // 2
        elif aspect_ratio == '16:9':
            if orig_w / orig_h > 16 / 9:
                crop_h = orig_h
                crop_w = int(orig_h * 16 / 9)
            else:
                crop_w = orig_w
                crop_h = int(orig_w * 9 / 16)
            x = (orig_w - crop_w) // 2
            y = (orig_h - crop_h) // 2
        elif aspect_ratio == '4:3':
            if orig_w / orig_h > 4 / 3:
                crop_h = orig_h
                crop_w = int(orig_h * 4 / 3)
            else:
                crop_w = orig_w
                crop_h = int(orig_w * 3 / 4)
            x = (orig_w - crop_w) // 2
            y = (orig_h - crop_h) // 2
        else:
            crop_w = int(width or (orig_w - x))
            crop_h = int(height or (orig_h - y))
    else:
        crop_w = int(width or (orig_w - x))
        crop_h = int(height or (orig_h - y))

    # Đảm bảo box nằm trong ranh giới
    x2 = min(orig_w, x + crop_w)
    y2 = min(orig_h, y + crop_h)

    cropped = img.crop((x, y, x2, y2))

    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        if cropped.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', cropped.size, (255, 255, 255))
            bg.paste(cropped, mask=cropped.split()[-1] if 'A' in cropped.mode else None)
            cropped = bg
        elif cropped.mode != 'RGB':
            cropped = cropped.convert('RGB')
        cropped.save(output_path, 'JPEG', quality=92, optimize=True)
    elif ext == '.png':
        cropped.save(output_path, 'PNG', optimize=True)
    elif ext == '.webp':
        cropped.save(output_path, 'WEBP', quality=92)
    else:
        cropped.save(output_path)

    img.close()
    cropped.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "orig_width": orig_w,
        "orig_height": orig_h,
        "cropped_width": x2 - x,
        "cropped_height": y2 - y,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
