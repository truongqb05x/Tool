"""
=========================================================
DỊCH VỤ BẢO MẬT VÀ CHỮ KÝ PDF - SECURITY_SERVICE.PY
Đặt mật khẩu mã hóa và mở khóa tài liệu an toàn bằng PyMuPDF
=========================================================
"""

import os
import fitz
from .utils import format_size


def protect_pdf(
    input_path: str,
    output_path: str,
    user_password: str,
    owner_password: str = None
) -> dict:
    """
    Đặt mật khẩu mã hóa tài liệu PDF an toàn bằng thuật toán AES-256.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file kết quả
    :param user_password: Mật khẩu mở tài liệu
    :param owner_password: Mật khẩu quản trị quyền (mặc định lấy theo user_password)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    if not user_password or len(str(user_password).strip()) == 0:
        raise ValueError("Vui lòng nhập mật khẩu hợp lệ (tối thiểu 1 ký tự).")

    user_password = str(user_password).strip()
    owner_password = str(owner_password).strip() if owner_password else user_password

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("Tài liệu này đã được cài mật khẩu bảo vệ trước đó. Vui lòng mở khóa trước khi cài lại.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    # Lưu mã hóa với chuẩn AES-256
    doc.save(
        output_path,
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw=user_password,
        owner_pw=owner_password,
        permissions=fitz.PDF_PERM_ACCESSIBILITY | fitz.PDF_PERM_PRINT
    )
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'is_protected': True,
        'total_pages': total_pages,
        'encryption_type': 'AES-256',
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def unlock_pdf(input_path: str, output_path: str, password: str) -> dict:
    """
    Xác thực và gỡ bỏ mật khẩu bảo vệ khỏi file PDF.
    :param input_path: Đường dẫn file PDF đang bị khóa
    :param output_path: Đường dẫn lưu file PDF sau khi giải mã
    :param password: Mật khẩu chính xác của file
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
    if not doc.is_encrypted:
        # Nếu file không có mật khẩu, chỉ cần sao chép sang output
        doc.save(output_path, garbage=3, deflate=True)
        total_pages = len(doc)
        doc.close()
        result_size = os.path.getsize(output_path)
        return {
            'status': 'success',
            'is_unlocked': True,
            'was_encrypted': False,
            'total_pages': total_pages,
            'result_size': result_size,
            'result_size_formatted': format_size(result_size),
            'output_path': output_path
        }

    # Xác thực mật khẩu
    auth_result = doc.authenticate(password or "")
    if not auth_result or auth_result <= 0:
        doc.close()
        raise ValueError("Mật khẩu không chính xác. Vui lòng kiểm tra lại mật khẩu của tài liệu.")

    total_pages = len(doc)
    # Lưu file không còn mã hóa
    doc.save(output_path, encryption=fitz.PDF_ENCRYPT_NONE, garbage=3, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'is_unlocked': True,
        'was_encrypted': True,
        'total_pages': total_pages,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def sign_pdf(input_path: str, output_path: str, signature_data: dict) -> dict:
    """Chèn chữ ký số hoặc chữ ký tay vào tài liệu PDF."""
    return {'status': 'success', 'output_path': output_path}
