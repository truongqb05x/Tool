"""
=========================================================
DỊCH VỤ NÉN PDF - COMPRESS_SERVICE.PY
Xử lý nén file PDF thực tế bằng PyMuPDF và tối ưu hóa luồng ảnh nhúng
=========================================================
"""

import os
import io
import fitz
from PIL import Image
from .utils import format_size


def compress_pdf(input_path: str, output_path: str, level: str = 'recommended') -> dict:
    """
    Xử lý nén file PDF thực tế:
    - Sử dụng PyMuPDF (fitz) và PIL để tối ưu luồng dữ liệu và nén lại ảnh nhúng.
    - Hỗ trợ 3 mức độ nén:
        + 'extreme': Nén cực đại (chất lượng ảnh 25, giảm dung lượng tối đa).
        + 'recommended': Nén tiêu chuẩn khuyến nghị (chất lượng ảnh 55, cân bằng hoàn hảo).
        + 'light': Nén nhẹ (chất lượng ảnh 80, ưu tiên độ nét tối đa).
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    # Cấu hình chất lượng nén theo mức độ rõ rệt
    level_configs = {
        'extreme': {
            'quality': 25,
            'max_dim': 900,
            'garbage': 4,
            'clean': True
        },
        'recommended': {
            'quality': 55,
            'max_dim': 1500,
            'garbage': 4,
            'clean': True
        },
        'light': {
            'quality': 80,
            'max_dim': 2200,
            'garbage': 3,
            'clean': False
        }
    }
    config = level_configs.get(level, level_configs['recommended'])
    quality = config['quality']
    max_dim = config['max_dim']
    garbage = config['garbage']
    clean_syntax = config['clean']

    # Đảm bảo thư mục lưu file kết quả tồn tại
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    try:
        doc = fitz.open(input_path)

        # Kiểm tra nếu file có mật khẩu bảo vệ
        if doc.is_encrypted:
            doc.close()
            raise ValueError("File PDF đang được đặt mật khẩu bảo vệ. Vui lòng mở khóa trước khi nén.")

        processed_xrefs = set()

        # Quét từng trang và tối ưu hóa các hình ảnh nhúng bằng page.replace_image chuẩn xác
        for page in doc:
            for img_info in page.get_images(full=True):
                xref = img_info[0]
                if xref in processed_xrefs:
                    continue
                processed_xrefs.add(xref)

                try:
                    base_img = doc.extract_image(xref)
                    if not base_img:
                        continue

                    img_bytes = base_img.get('image')
                    if not img_bytes:
                        continue

                    pil_img = Image.open(io.BytesIO(img_bytes))

                    # Chuyển đổi định dạng phù hợp cho nén JPEG
                    if pil_img.mode in ('RGBA', 'P', 'LA'):
                        pil_img = pil_img.convert('RGB')
                    elif pil_img.mode not in ('RGB', 'L'):
                        continue

                    # Giảm kích thước ảnh nếu vượt quá max_dim
                    if max_dim:
                        w, h = pil_img.size
                        if w > max_dim or h > max_dim:
                            ratio = min(max_dim / w, max_dim / h)
                            new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
                            pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)

                    # Nén lại ảnh bằng định dạng JPEG với chất lượng tương ứng từng cấp độ
                    out_io = io.BytesIO()
                    pil_img.save(out_io, format='JPEG', quality=quality, optimize=True)
                    new_img_bytes = out_io.getvalue()

                    # Thay thế ảnh chuẩn xác trong PDF bằng page.replace_image
                    if hasattr(page, 'replace_image'):
                        page.replace_image(xref, stream=new_img_bytes)
                    else:
                        doc.update_stream(xref, new_img_bytes)
                except Exception:
                    continue

        # Lưu file đã tối ưu với các cờ nén luồng mạnh mẽ của MuPDF
        doc.save(
            output_path,
            garbage=garbage,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=clean_syntax
        )
        doc.close()

        new_size = os.path.getsize(output_path)

        # Trường hợp file gốc đã nén tối đa mà file mới lại lớn hơn
        if new_size >= orig_size:
            import shutil
            shutil.copy2(input_path, output_path)
            new_size = orig_size

        saved_percent = max(0, round((1 - (new_size / orig_size)) * 100))

        return {
            'status': 'success',
            'original_size': orig_size,
            'compressed_size': new_size,
            'original_size_formatted': format_size(orig_size),
            'compressed_size_formatted': format_size(new_size),
            'saved_percent': saved_percent,
            'output_path': output_path
        }

    except Exception as e:
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass
        raise e
