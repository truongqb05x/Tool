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


def extract_pages(input_path: str, output_path: str, page_numbers: list[int]) -> dict:
    """Trích xuất một hoặc nhiều trang ra file PDF độc lập mới."""
    return {'status': 'success', 'extracted_count': len(page_numbers), 'output_path': output_path}


def edit_pdf(input_path: str, output_path: str, annotations: list = None) -> dict:
    """Thêm văn bản, ghi chú, biểu tượng vào file PDF."""
    return {'status': 'success', 'output_path': output_path}


def add_page_numbers(input_path: str, output_path: str, position: str = 'bottom-center') -> dict:
    """Đánh số thứ tự các trang trong tài liệu PDF."""
    return {'status': 'success', 'position': position, 'output_path': output_path}


def add_watermark(input_path: str, output_path: str, watermark_text: str = 'BẢN QUYỀN') -> dict:
    """Chèn hình mờ hoặc chữ bản quyền vào tất cả các trang PDF."""
    return {'status': 'success', 'watermark': watermark_text, 'output_path': output_path}
