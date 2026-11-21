"""
=========================================================
DỊCH VỤ TẠO ẢNH CHẾ MEME - MEME_SERVICE.PY
Chèn văn bản Top/Bottom phong cách Meme kinh điển với viền đen
=========================================================
"""

import os
from PIL import Image, ImageDraw, ImageFont
from .utils import open_image_safe, format_size


def create_meme(
    input_path: str,
    output_path: str,
    top_text: str = "",
    bottom_text: str = "",
    font_size: int = 40,
    text_color: str = "#ffffff"
) -> dict:
    """
    Tạo ảnh meme với dòng chữ trên và dưới có viền đen đậm.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    img = open_image_safe(input_path).convert('RGB')
    w, h = img.size
    draw = ImageDraw.Draw(img)

    # Chọn kích thước font tỷ lệ thuận với ảnh
    auto_size = max(24, int(w * 0.075))
    f_size = int(font_size or auto_size)

    font = None
    for font_cand in ["impact.ttf", "arialbd.ttf", "arial.ttf", "tahoma.ttf", "DejaVuSans-Bold.ttf"]:
        try:
            font = ImageFont.truetype(font_cand, f_size)
            break
        except Exception:
            continue
    if not font:
        font = ImageFont.load_default()

    # Màu chữ
    c_hex = text_color.lstrip('#')
    if len(c_hex) == 6:
        tc = (int(c_hex[0:2], 16), int(c_hex[2:4], 16), int(c_hex[4:6], 16))
    else:
        tc = (255, 255, 255)

    outline_color = (0, 0, 0)
    stroke_width = max(2, f_size // 12)

    def draw_text_with_outline(text_str, y_pos):
        text_str = text_str.strip().upper()
        if not text_str:
            return
        bbox = draw.textbbox((0, 0), text_str, font=font, stroke_width=stroke_width)
        tw = bbox[2] - bbox[0]
        x_pos = (w - tw) // 2

        # Vẽ chữ với viền nổi bật
        draw.text(
            (x_pos, y_pos),
            text_str,
            font=font,
            fill=tc,
            stroke_width=stroke_width,
            stroke_fill=outline_color
        )

    # Vẽ top text
    if top_text:
        draw_text_with_outline(top_text, 20)

    # Vẽ bottom text
    if bottom_text:
        b_box = draw.textbbox((0, 0), bottom_text.upper(), font=font, stroke_width=stroke_width)
        th = b_box[3] - b_box[1]
        draw_text_with_outline(bottom_text, h - th - 30)

    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
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
        "top_text": top_text,
        "bottom_text": bottom_text,
        "width": w,
        "height": h,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
