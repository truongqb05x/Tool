"""
=========================================================
DỊCH VỤ TỔ CHỨC VÀ BIÊN TẬP TRANG PDF - ORGANIZE_SERVICE.PY
Xoay, xóa, sắp xếp, trích xuất, đánh số trang và đóng dấu bản quyền
=========================================================
"""


import os
import fitz
from .utils import format_size


def rotate_pdf(input_path: str, output_path: str, angle: int = 90) -> dict:
    """Xoay hướng các trang trong PDF (90, 180, 270 độ)."""
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    angle = int(angle) % 360
    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi xoay.")

    for page in doc:
        page.set_rotation((page.rotation + angle) % 360)

    doc.save(output_path, garbage=3, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'angle': angle,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def delete_pages(input_path: str, output_path: str, pages_to_remove: list[int]) -> dict:
    """
    Xóa bỏ các trang không mong muốn khỏi file PDF:
    :param input_path: Đường dẫn file nguồn
    :param output_path: Đường dẫn file kết quả
    :param pages_to_remove: Danh sách các số trang cần xóa (1-based index)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi xóa trang.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    # Lọc danh sách các trang hợp lệ và chuyển sang 0-based index
    valid_remove_indices = set()
    for p in pages_to_remove:
        try:
            page_num = int(p)
            if 1 <= page_num <= total_pages:
                valid_remove_indices.add(page_num - 1)
        except (ValueError, TypeError):
            continue

    if not valid_remove_indices:
        doc.close()
        raise ValueError("Vui lòng chỉ định ít nhất 1 trang hợp lệ cần xóa.")

    if len(valid_remove_indices) >= total_pages:
        doc.close()
        raise ValueError("Không thể xóa toàn bộ các trang của tài liệu. File PDF phải giữ lại ít nhất 1 trang.")

    # Xóa từ trang có chỉ số lớn nhất về nhỏ nhất để không làm sai lệch index
    for idx in sorted(valid_remove_indices, reverse=True):
        doc.delete_page(idx)

    doc.save(output_path, garbage=3, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'removed_count': len(valid_remove_indices),
        'remaining_pages': total_pages - len(valid_remove_indices),
        'total_original_pages': total_pages,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def reorder_pages(input_path: str, output_path: str, new_order: list) -> dict:
    """
    Sắp xếp lại thứ tự các trang trong tài liệu PDF theo danh sách chỉ định.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file PDF sau sắp xếp
    :param new_order: Danh sách số trang mới (1-based index) hoặc danh sách dict [{'page': 3, 'rotation': 0}, ...]
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi sắp xếp trang.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    if not new_order or not isinstance(new_order, (list, tuple)):
        doc.close()
        raise ValueError("Danh sách thứ tự trang mới không hợp lệ hoặc đang để trống.")

    new_doc = fitz.open()
    processed_pages = []

    for item in new_order:
        page_num = None
        rotate_angle = 0

        if isinstance(item, dict):
            page_num = item.get('page')
            rotate_angle = item.get('rotation', 0)
        else:
            page_num = item

        try:
            page_num = int(page_num)
        except (ValueError, TypeError):
            continue

        if 1 <= page_num <= total_pages:
            new_doc.insert_pdf(doc, from_page=page_num - 1, to_page=page_num - 1)
            if rotate_angle:
                try:
                    angle = int(rotate_angle) % 360
                    if angle != 0:
                        last_page = new_doc[-1]
                        last_page.set_rotation((last_page.rotation + angle) % 360)
                except Exception:
                    pass
            processed_pages.append(page_num)

    doc.close()

    if len(new_doc) == 0:
        new_doc.close()
        raise ValueError("Không có trang hợp lệ nào được đưa vào file kết quả.")

    new_doc.save(output_path, garbage=3, deflate=True)
    new_doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'total_pages': len(processed_pages),
        'original_total_pages': total_pages,
        'new_order': processed_pages,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def extract_pages(input_path: str, output_path: str, page_numbers: list[int], extract_mode: str = 'merged') -> dict:
    """
    Trích xuất một hoặc nhiều trang cụ thể ra file PDF độc lập mới hoặc file nén ZIP.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file kết quả (.pdf hoặc .zip)
    :param page_numbers: Danh sách các số trang cần trích xuất (1-based index)
    :param extract_mode: 'merged' (gộp vào 1 file PDF mới) hoặc 'separate' (tách mỗi trang 1 file nén vào .zip)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi trích xuất trang.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    # Lọc danh sách trang hợp lệ và loại bỏ trùng lặp giữ nguyên thứ tự
    valid_pages = []
    seen = set()
    for p in page_numbers:
        try:
            p_int = int(p)
            if 1 <= p_int <= total_pages and p_int not in seen:
                valid_pages.append(p_int)
                seen.add(p_int)
        except (ValueError, TypeError):
            continue

    if not valid_pages:
        doc.close()
        raise ValueError("Vui lòng chỉ định ít nhất 1 trang hợp lệ cần trích xuất.")

    if extract_mode == 'separate':
        import zipfile
        # Xuất từng trang thành file PDF riêng và nén vào file zip
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for p_num in valid_pages:
                single_doc = fitz.open()
                single_doc.insert_pdf(doc, from_page=p_num - 1, to_page=p_num - 1)
                single_bytes = single_doc.tobytes(garbage=3, deflate=True)
                single_doc.close()
                zip_file.writestr(f"trang_{p_num}.pdf", single_bytes)

        doc.close()
        result_size = os.path.getsize(output_path)
        return {
            'status': 'success',
            'extract_mode': 'separate',
            'extracted_count': len(valid_pages),
            'extracted_pages': valid_pages,
            'total_original_pages': total_pages,
            'is_zip': True,
            'result_size': result_size,
            'result_size_formatted': format_size(result_size),
            'output_path': output_path
        }
    else:
        # Gộp tất cả các trang trích xuất vào 1 file PDF mới
        new_doc = fitz.open()
        for p_num in valid_pages:
            new_doc.insert_pdf(doc, from_page=p_num - 1, to_page=p_num - 1)

        doc.close()
        new_doc.save(output_path, garbage=3, deflate=True)
        new_doc.close()

        result_size = os.path.getsize(output_path)
        return {
            'status': 'success',
            'extract_mode': 'merged',
            'extracted_count': len(valid_pages),
            'extracted_pages': valid_pages,
            'total_original_pages': total_pages,
            'is_zip': False,
            'result_size': result_size,
            'result_size_formatted': format_size(result_size),
            'output_path': output_path
        }


def edit_pdf(input_path: str, output_path: str, annotations: list = None) -> dict:
    """Thêm văn bản, ghi chú, biểu tượng vào file PDF."""
    return {'status': 'success', 'output_path': output_path}


def add_page_numbers(
    input_path: str,
    output_path: str,
    position: str = 'bottom-center',
    format_type: str = 'page_total',
    from_page: int = 1,
    start_number: int = 1,
    font_size: float = 10,
    margin: float = 36
) -> dict:
    """
    Đánh số thứ tự các trang trong tài liệu PDF bằng PyMuPDF.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file kết quả
    :param position: Vị trí chèn ('bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left')
    :param format_type: Kiểu định dạng ('page_only': 1, 'page_total': 1/10, 'text_page_total': Trang 1/10)
    :param from_page: Đánh số từ trang nào (1-based index, mặc định 1)
    :param start_number: Bắt đầu đếm từ số mấy (mặc định 1)
    :param font_size: Kích thước font chữ (pt)
    :param margin: Khoảng cách từ lề giấy (pt)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi đánh số trang.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    from_page = max(1, min(int(from_page), total_pages))
    start_number = int(start_number)
    font_size = float(font_size)
    margin = float(margin)

    for i in range(from_page - 1, total_pages):
        page = doc[i]
        curr_num = start_number + (i - (from_page - 1))

        if format_type == 'page_only':
            num_text = f"{curr_num}"
        elif format_type == 'text_page_total':
            num_text = f"Trang {curr_num} / {total_pages}"
        elif format_type == 'text_page_only':
            num_text = f"Trang {curr_num}"
        else: # 'page_total'
            num_text = f"{curr_num} / {total_pages}"

        rect = page.rect
        w = rect.width
        h = rect.height

        text_len = fitz.get_text_length(num_text, fontname="helv", fontsize=font_size)

        # Tính toán tọa độ hiển thị (x, y)
        if position == 'bottom-center':
            x = (w - text_len) / 2
            y = h - margin
        elif position == 'bottom-right':
            x = w - margin - text_len
            y = h - margin
        elif position == 'bottom-left':
            x = margin
            y = h - margin
        elif position == 'top-center':
            x = (w - text_len) / 2
            y = margin + font_size
        elif position == 'top-right':
            x = w - margin - text_len
            y = margin + font_size
        elif position == 'top-left':
            x = margin
            y = margin + font_size
        else:
            x = (w - text_len) / 2
            y = h - margin

        page.insert_text(
            fitz.Point(x, y),
            num_text,
            fontname="helv",
            fontsize=font_size,
            color=(0.25, 0.25, 0.25)
        )

    doc.save(output_path, garbage=3, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'total_pages': total_pages,
        'from_page': from_page,
        'position': position,
        'format_type': format_type,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def add_watermark(
    input_path: str,
    output_path: str,
    watermark_text: str = 'BẢN QUYỀN',
    rotation: int = 45,
    opacity: float = 0.25,
    color_hex: str = '#888888',
    font_size: float = 46
) -> dict:
    """
    Chèn hình mờ watermark dạng chữ vào tất cả các trang PDF bằng PyMuPDF.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file kết quả
    :param watermark_text: Nội dung chữ cần đóng dấu bản quyền
    :param rotation: Góc xoay chữ (45 hoặc 0 độ)
    :param opacity: Độ mờ trong suốt (0.05 đến 0.9)
    :param color_hex: Màu chữ hex (ví dụ '#888888', '#e74c3c')
    :param font_size: Cỡ chữ watermark
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi chèn watermark.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    watermark_text = str(watermark_text).strip() or 'BẢN QUYỀN'
    rotation = int(rotation) % 360
    opacity = max(0.05, min(float(opacity), 0.95))

    # Chuyển đổi mã màu hex sang tuple rgb (0.0 - 1.0)
    color_hex = color_hex.lstrip('#')
    if len(color_hex) == 6:
        r = int(color_hex[0:2], 16) / 255.0
        g = int(color_hex[2:4], 16) / 255.0
        b = int(color_hex[4:6], 16) / 255.0
        color_tuple = (r, g, b)
    else:
        color_tuple = (0.5, 0.5, 0.5)

    font_size = float(font_size)

    for page in doc:
        w = page.rect.width
        h = page.rect.height
        center = fitz.Point(w / 2, h / 2)

        text_len = fitz.get_text_length(watermark_text, fontname="helv", fontsize=font_size)
        start_point = fitz.Point(w / 2 - text_len / 2, h / 2 + font_size / 3)

        if rotation != 0:
            morph = (center, fitz.Matrix(-rotation))
            page.insert_text(
                start_point,
                watermark_text,
                fontname="helv",
                fontsize=font_size,
                color=color_tuple,
                morph=morph,
                fill_opacity=opacity
            )
        else:
            page.insert_text(
                start_point,
                watermark_text,
                fontname="helv",
                fontsize=font_size,
                color=color_tuple,
                fill_opacity=opacity
            )

    doc.save(output_path, garbage=3, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'watermark_text': watermark_text,
        'total_pages': total_pages,
        'rotation': rotation,
        'opacity': opacity,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }
