"""
=========================================================
TIỆN ÍCH DỊCH VỤ PDF - UTILS.PY
Các hàm hỗ trợ định dạng, tính toán kích thước tệp và phân tích trang
=========================================================
"""

import re


def format_size(size_bytes: int) -> str:
    """Định dạng số bytes thành chuỗi hiển thị dễ đọc (B, KB, MB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{(size_bytes / 1024):.1f} KB"
    else:
        return f"{(size_bytes / (1024 * 1024)):.2f} MB"


def parse_page_ranges(range_str: str, max_pages: int) -> list[int]:
    """
    Phân tích chuỗi số trang (ví dụ: '1-3, 5, 7-9') thành danh sách các số trang hợp lệ (1-indexed).
    Giữ thứ tự trang xuất hiện và loại bỏ trang trùng lặp, bỏ qua trang vượt quá max_pages.
    """
    if not range_str or not str(range_str).strip():
        return list(range(1, max_pages + 1))

    pages = []
    seen = set()
    parts = re.split(r'[,;\s]+', str(range_str).strip())

    for part in parts:
        if not part:
            continue
        if '-' in part:
            sub = part.split('-')
            if len(sub) == 2 and sub[0].isdigit() and sub[1].isdigit():
                start = int(sub[0])
                end = int(sub[1])
                if start <= end:
                    for p in range(start, end + 1):
                        if 1 <= p <= max_pages and p not in seen:
                            seen.add(p)
                            pages.append(p)
                else:
                    for p in range(start, end - 1, -1):
                        if 1 <= p <= max_pages and p not in seen:
                            seen.add(p)
                            pages.append(p)
        elif part.isdigit():
            p = int(part)
            if 1 <= p <= max_pages and p not in seen:
                seen.add(p)
                pages.append(p)

    return pages
