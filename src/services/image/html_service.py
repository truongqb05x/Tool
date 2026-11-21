"""
=========================================================
DỊCH VỤ CHUYỂN HTML SANG ẢNH - HTML_SERVICE.PY
Kết xuất mã nguồn HTML hoặc website sang hình ảnh PNG/JPG
=========================================================
"""

import os
import fitz # PyMuPDF hỗ trợ render HTML/XHTML trực tiếp thành PDF rồi xuất sang Image
from PIL import Image
from .utils import format_size


def html_to_image(
    html_content: str,
    output_path: str,
    width: int = 800,
    height: int = 600,
    quality: int = 92
) -> dict:
    """
    Chuyển đổi nội dung HTML / văn bản web thành file ảnh.
    """
    if not html_content or len(html_content.strip()) == 0:
        html_content = "<div style='font-family:sans-serif; padding:40px; text-align:center;'><h1>ToolHub HTML to Image</h1><p>Nội dung trang web kết xuất thành công.</p></div>"

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Sử dụng PyMuPDF Story để tạo tài liệu từ HTML
    doc = fitz.open()
    # Chuyển đổi pixel sang points (1 pt = 1.33 px)
    pt_w = float(width or 800) * 72.0 / 96.0
    pt_h = float(height or 600) * 72.0 / 96.0

    rect = fitz.Rect(0, 0, pt_w, pt_h)

    try:
        story = fitz.Story(html=html_content)
        writer = fitz.DocumentWriter(doc)
        dev = writer.begin_page(rect)
        more = 1
        while more:
            more, _ = story.place(rect)
            story.draw(dev)
        writer.end_page()
        writer.close()
    except Exception:
        # Fallback tạo trang đơn giản
        page = doc.new_page(width=pt_w, height=pt_h)
        # Bỏ qua các thẻ HTML cơ bản để lấy text thuần
        import re
        clean_text = re.sub(r'<[^>]+>', ' ', html_content).strip()
        page.insert_textbox(fitz.Rect(36, 36, pt_w - 36, pt_h - 36), clean_text, fontsize=12)

    # Render trang đầu tiên ra Pixmap ảnh
    page0 = doc[0] if len(doc) > 0 else doc.new_page(width=pt_w, height=pt_h)
    pix = page0.get_pixmap(dpi=150)
    doc.close()

    ext = os.path.splitext(output_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
        img.close()
    else:
        pix.save(output_path)

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "width": pix.width,
        "height": pix.height,
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
