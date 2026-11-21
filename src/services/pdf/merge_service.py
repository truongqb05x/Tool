"""
=========================================================
DỊCH VỤ GỘP PDF - MERGE_SERVICE.PY
Gộp nhiều file PDF thành một tệp duy nhất, bảo toàn nội dung và hỗ trợ xoay trang
=========================================================
"""

import os
import fitz
from .utils import format_size


def merge_pdfs(file_configs: list, output_path: str) -> dict:
    """
    Gộp nhiều file PDF thành một tệp duy nhất, bảo toàn nội dung và hỗ trợ xoay trang theo cấu hình.
    :param file_configs: Danh sách dict [{'path': str, 'rotation': int}] hoặc danh sách đường dẫn file [str]
    :param output_path: Đường dẫn lưu file PDF sau khi gộp
    :return: Dict chứa thông tin tổng số trang, kích thước file kết quả, v.v.
    """
    if not file_configs or len(file_configs) < 2:
        raise ValueError("Cần ít nhất 2 tệp PDF để thực hiện ghép nối.")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    merged_doc = fitz.open()
    total_pages = 0
    input_docs = []

    try:
        for item in file_configs:
            if isinstance(item, dict):
                input_path = item.get('path')
                rotation = int(item.get('rotation', 0)) % 360
            else:
                input_path = str(item)
                rotation = 0

            if not os.path.exists(input_path):
                raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

            doc = fitz.open(input_path)
            input_docs.append(doc)

            if doc.is_encrypted:
                raise ValueError(f"Tệp '{os.path.basename(input_path)}' đang được cài mật khẩu bảo vệ.")

            # Nếu người dùng có thao tác xoay (90, 180, 270 độ), áp dụng xoay cho các trang
            if rotation in (90, 180, 270):
                for page in doc:
                    page.set_rotation((page.rotation + rotation) % 360)

            merged_doc.insert_pdf(doc)
            total_pages += len(doc)

        # Lưu file gộp với tối ưu luồng
        merged_doc.save(output_path, garbage=3, deflate=True)

        merged_size = os.path.getsize(output_path)
        return {
            'status': 'success',
            'merged_count': len(file_configs),
            'total_pages': total_pages,
            'merged_size': merged_size,
            'merged_size_formatted': format_size(merged_size),
            'output_path': output_path
        }

    except Exception as e:
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass
        raise e
    finally:
        for d in input_docs:
            try:
                d.close()
            except Exception:
                pass
        try:
            merged_doc.close()
        except Exception:
            pass
