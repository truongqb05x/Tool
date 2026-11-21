"""
=========================================================
DỊCH VỤ ĐÓNG DẤU BẢN QUYỀN ẢNH - WATERMARK_SERVICE.PY
Chèn Watermark chữ hoặc logo hình ảnh với độ trong suốt tùy biến
=========================================================
"""

import os
from PIL import Image, ImageDraw, ImageFont
from .utils import open_image_safe, format_size


def add_watermark_image(
    input_path: str,
    output_path: str,
    text: str = None,
    watermark_image_path: str = None,
    position: str = "bottom-right",
    opacity: float = 0.5,
    font_size: int = 36,
    color_hex: str = "#ffffff"
) -> dict:
    """
    Chèn Watermark chữ hoặc logo hình ảnh vào tệp ảnh.
    :param position: 'bottom-right', 'bottom-left', 'center', 'top-right', 'top-left'
    :param opacity: 0.1 - 1.0
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    base_img = open_image_safe(input_path).convert('RGBA')
    bw, bh = base_img.size

    # Tạo layer trong suốt cho Watermark
    watermark_layer = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))

    alpha_int = int(max(0.05, min(float(opacity or 0.5), 1.0)) * 255)

    if watermark_image_path and os.path.exists(watermark_image_path):
        # Đóng dấu bằng logo hình ảnh
        logo = open_image_safe(watermark_image_path).convert('RGBA')
        # Tỷ lệ logo khoảng 20% chiều rộng ảnh gốc
        max_logo_w = int(bw * 0.25)
        lw, lh = logo.size
        scale = min(max_logo_w / lw, (bh * 0.25) / lh)
        new_lw, new_lh = max(1, int(lw * scale)), max(1, int(lh * scale))
        logo = logo.resize((new_lw, new_lh), Image.Resampling.LANCZOS)

        # Điều chỉnh alpha của logo
        r, g, b, a = logo.split()
        a = a.point(lambda p: int(p * (alpha_int / 255.0)))
        logo.putalpha(a)

        margin = 30
        if position == 'bottom-left':
            pos = (margin, bh - new_lh - margin)
        elif position == 'top-left':
            pos = (margin, margin)
        elif position == 'top-right':
            pos = (bw - new_lw - margin, margin)
        elif position == 'center':
            pos = ((bw - new_lw) // 2, (bh - new_lh) // 2)
        else: # bottom-right
            pos = (bw - new_lw - margin, bh - new_lh - margin)

        watermark_layer.paste(logo, pos, mask=logo)
        logo.close()

    else:
        # Đóng dấu bằng văn bản chữ
        mark_text = str(text or "ToolHub Watermark").strip()
        draw = ImageDraw.Draw(watermark_layer)

        # Phân giải màu hex
        c_hex = color_hex.lstrip('#')
        if len(c_hex) == 6:
            r = int(c_hex[0:2], 16)
            g = int(c_hex[2:4], 16)
            b = int(c_hex[4:6], 16)
        else:
            r, g, b = 255, 255, 255

        # Cố gắng tải font hệ thống hoặc dùng font mặc định
        font = None
        font_size = int(font_size or 36)
        for font_candidate in ["arial.ttf", "tahoma.ttf", "calibri.ttf", "DejaVuSans.ttf"]:
            try:
                font = ImageFont.truetype(font_candidate, font_size)
                break
            except Exception:
                continue
        if not font:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), mark_text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]

        margin = 30
        if position == 'bottom-left':
            pos = (margin, bh - th - margin)
        elif position == 'top-left':
            pos = (margin, margin)
        elif position == 'top-right':
            pos = (bw - tw - margin, margin)
        elif position == 'center':
            pos = ((bw - tw) // 2, (bh - th) // 2)
        else: # bottom-right
            pos = (bw - tw - margin, bh - th - margin)

        # Vẽ bóng mờ nhẹ để chữ nổi bật trên mọi nền
        shadow_color = (0, 0, 0, int(alpha_int * 0.7))
        draw.text((pos[0] + 2, pos[1] + 2), mark_text, font=font, fill=shadow_color)
        draw.text(pos, mark_text, font=font, fill=(r, g, b, alpha_int))

    # Ghép layer watermark vào ảnh gốc
    result_img = Image.alpha_composite(base_img, watermark_layer)

    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        result_img = result_img.convert('RGB')
        result_img.save(output_path, 'JPEG', quality=92, optimize=True)
    elif ext == '.png':
        result_img.save(output_path, 'PNG', optimize=True)
    elif ext == '.webp':
        result_img.save(output_path, 'WEBP', quality=92)
    else:
        result_img.save(output_path)

    base_img.close()
    result_img.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "position": position,
        "width": bw,
        "height": bh,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
