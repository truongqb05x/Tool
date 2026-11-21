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


def sign_pdf(
    input_path: str,
    output_path: str,
    signature_type: str = "draw",
    sign_name: str = "",
    signature_base64: str = None,
    signature_image_bytes: bytes = None,
    page_target: str = "last",
    position: str = "bottom-right",
    sign_date: str = None
) -> dict:
    """
    Chèn chữ ký (vẽ tay, ảnh chữ ký hoặc họ tên chữ ký điện tử) vào file PDF bằng PyMuPDF.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file PDF sau khi ký
    :param signature_type: 'draw' (vẽ canvas), 'image' (tải ảnh), 'text' (gõ chữ ký)
    :param sign_name: Tên người ký hiển thị
    :param signature_base64: Chuỗi base64 data URL của ảnh chữ ký
    :param signature_image_bytes: Dữ liệu bytes ảnh chữ ký (nếu có)
    :param page_target: 'last' (trang cuối), 'first' (trang đầu), 'all' (tất cả các trang)
    :param position: 'bottom-right', 'bottom-left', 'bottom-center'
    :param sign_date: Chuỗi ngày ký (vd: '21/11/2026')
    """
    import base64
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(input_path)
    try:
        if doc.is_encrypted:
            raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi ký.")

        total_pages = len(doc)
        if total_pages == 0:
            raise ValueError("File PDF không có trang nào.")

        # Xác định các trang cần chèn chữ ký
        target_pages = []
        if page_target == 'first':
            target_pages = [0]
        elif page_target == 'all':
            target_pages = list(range(total_pages))
        else:  # 'last' mặc định
            target_pages = [total_pages - 1]

        # Chuẩn bị dữ liệu hình ảnh chữ ký nếu có
        img_data = signature_image_bytes
        if not img_data and signature_base64:
            try:
                b64_str = signature_base64
                if ',' in b64_str:
                    b64_str = b64_str.split(',', 1)[1]
                img_data = base64.b64decode(b64_str)
            except Exception as b64_err:
                print(f"Lỗi giải mã base64 chữ ký: {b64_err}")
                img_data = None

        sign_label = sign_name.strip() if sign_name else "Người ký"
        display_date = sign_date.strip() if sign_date else ""

        for idx in target_pages:
            page = doc[idx]
            w = page.rect.width
            h = page.rect.height

            # Kích thước khung chữ ký tiêu chuẩn
            sig_w = 150.0
            sig_h = 55.0
            margin_x = 45.0
            margin_bottom = 50.0

            if position == 'bottom-left':
                x0 = margin_x
                y0 = h - margin_bottom - sig_h
            elif position == 'bottom-center':
                x0 = (w - sig_w) / 2.0
                y0 = h - margin_bottom - sig_h
            else:  # 'bottom-right'
                x0 = w - margin_x - sig_w
                y0 = h - margin_bottom - sig_h

            sig_rect = fitz.Rect(x0, y0, x0 + sig_w, y0 + sig_h)

            if img_data:
                # Chèn ảnh chữ ký
                page.insert_image(sig_rect, stream=img_data)
            else:
                # Vẽ chữ ký nghệ thuật / gõ chữ ký phong cách trang trọng
                page.draw_rect(sig_rect, color=(0.1, 0.35, 0.65), width=1.0, fill=(0.96, 0.98, 1.0), fill_opacity=0.6)
                page.insert_textbox(
                    sig_rect,
                    f"✓ Đã ký điện tử\n{sign_label}",
                    fontsize=11,
                    fontname="helv",
                    color=(0.1, 0.35, 0.65),
                    align=fitz.TEXT_ALIGN_CENTER
                )

            # Chèn thông tin người ký & ngày ký bên dưới chữ ký
            meta_line = f"Ký bởi: {sign_label}"
            if display_date:
                meta_line += f" | Ngày: {display_date}"
            meta_rect = fitz.Rect(x0, y0 + sig_h + 3, x0 + sig_w + 30, y0 + sig_h + 18)
            page.insert_textbox(
                meta_rect,
                meta_line,
                fontsize=8,
                fontname="helv",
                color=(0.35, 0.35, 0.35),
                align=fitz.TEXT_ALIGN_LEFT if position != 'bottom-center' else fitz.TEXT_ALIGN_CENTER
            )

        doc.save(output_path, garbage=3, deflate=True)
    finally:
        doc.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'signed_pages': len(target_pages),
        'total_pages': total_pages,
        'sign_name': sign_label,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }
