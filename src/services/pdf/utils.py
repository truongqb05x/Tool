"""
=========================================================
TIỆN ÍCH DỊCH VỤ PDF - UTILS.PY
Các hàm hỗ trợ định dạng, tính toán kích thước tệp
=========================================================
"""


def format_size(size_bytes: int) -> str:
    """Định dạng số bytes thành chuỗi hiển thị dễ đọc (B, KB, MB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{(size_bytes / 1024):.1f} KB"
    else:
        return f"{(size_bytes / (1024 * 1024)):.2f} MB"
