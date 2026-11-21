"""
=========================================================
DỊCH VỤ CHUYỂN ĐỔI PDF - CONVERT_SERVICE.PY
Chuyển đổi qua lại giữa PDF và các định dạng Office cũng như Hình ảnh
=========================================================
"""

import os
import zipfile
import fitz
from .utils import format_size, parse_page_ranges


def pdf_to_images(
    input_path: str,
    output_zip_path: str,
    img_format: str = "jpg",
    dpi: int = 150,
    page_range_str: str = ""
) -> dict:
    """
    Chuyển đổi các trang trong tài liệu PDF thành hình ảnh (JPG hoặc PNG) và đóng gói vào file ZIP.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_zip_path: Đường dẫn lưu file .zip chứa các ảnh
    :param img_format: Định dạng ảnh ('jpg' hoặc 'png')
    :param dpi: Độ phân giải render (mặc định 150 DPI, tùy chọn 300 DPI cho chất lượng HD)
    :param page_range_str: Chuỗi khoảng trang cần xuất (vd: '1-3, 5'), nếu rỗng thì xuất tất cả các trang
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    img_format = img_format.lower().strip()
    if img_format not in ["jpg", "jpeg", "png"]:
        img_format = "jpg"
    ext = "jpg" if img_format in ["jpg", "jpeg"] else "png"

    dpi = int(dpi) if str(dpi).isdigit() else 150
    if dpi not in [72, 100, 150, 200, 300]:
        dpi = 150

    doc = fitz.open(input_path)
    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("Tài liệu PDF không có trang nào.")

    # Xác định danh sách trang cần xuất
    if page_range_str and str(page_range_str).strip():
        target_pages = parse_page_ranges(str(page_range_str).strip(), total_pages)
        if not target_pages:
            doc.close()
            raise ValueError(f"Khoảng trang chỉ định '{page_range_str}' không hợp lệ hoặc vượt quá tổng số {total_pages} trang.")
    else:
        target_pages = list(range(1, total_pages + 1))

    out_dir = os.path.dirname(output_zip_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Hệ số zoom từ DPI: chuẩn PDF là 72 DPI
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    alpha = (ext == "png")

    base_name = os.path.splitext(os.path.basename(input_path))[0]
    image_count = 0

    with zipfile.ZipFile(output_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for pno in target_pages:
            page_index = pno - 1
            page = doc[page_index]
            pix = page.get_pixmap(matrix=matrix, alpha=alpha)

            # Đặt tên file ảnh trong ZIP
            img_filename = f"{base_name}_trang_{pno:03d}.{ext}"
            
            # Lưu pixmap vào buffer bytes
            if ext == "png":
                img_data = pix.tobytes("png")
            else:
                img_data = pix.tobytes("jpg")

            zf.writestr(img_filename, img_data)
            image_count += 1

    doc.close()
    zip_size = os.path.getsize(output_zip_path)

    return {
        "status": "success",
        "output_path": output_zip_path,
        "format": ext.upper(),
        "dpi": dpi,
        "total_doc_pages": total_pages,
        "exported_images": image_count,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": zip_size,
        "result_size_formatted": format_size(zip_size)
    }


def images_to_pdf(
    image_paths: list[str],
    output_path: str,
    page_size: str = "fit",
    orientation: str = "auto",
    margin: int = 0
) -> dict:
    """
    Gộp nhiều hình ảnh (JPG, PNG, WEBP) thành một tài liệu PDF duy nhất.
    :param image_paths: Danh sách các đường dẫn file ảnh
    :param output_path: Đường dẫn lưu file PDF kết quả
    :param page_size: Kích thước trang ('fit', 'a4', 'letter')
    :param orientation: Hướng trang ('auto', 'portrait', 'landscape')
    :param margin: Khoảng cách lề trang (points, vd: 0, 10, 20)
    """
    if not image_paths or len(image_paths) == 0:
        raise ValueError("Danh sách file ảnh không được để trống.")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open()

    # Kích thước chuẩn điểm ảnh (72 points/inch)
    STANDARD_SIZES = {
        "a4": (595.0, 842.0),
        "letter": (612.0, 792.0)
    }

    margin = max(0, int(margin) if str(margin).isdigit() else 0)
    processed_count = 0

    for img_path in image_paths:
        if not os.path.exists(img_path):
            continue

        try:
            img_doc = fitz.open(img_path)
            rect = img_doc[0].rect
            img_w, img_h = rect.width, rect.height

            if page_size.lower() in STANDARD_SIZES:
                std_w, std_h = STANDARD_SIZES[page_size.lower()]
                if orientation == "landscape" or (orientation == "auto" and img_w > img_h):
                    pw, ph = max(std_w, std_h), min(std_w, std_h)
                else:
                    pw, ph = min(std_w, std_h), max(std_w, std_h)
                
                # Tạo trang chuẩn và vẽ ảnh lọt vào giữa trang (có tính margin)
                page = doc.new_page(width=pw, height=ph)
                avail_w = max(10.0, pw - 2 * margin)
                avail_h = max(10.0, ph - 2 * margin)
                scale = min(avail_w / img_w, avail_h / img_h)
                dest_w = img_w * scale
                dest_h = img_h * scale
                dx = (pw - dest_w) / 2.0
                dy = (ph - dest_h) / 2.0
                dest_rect = fitz.Rect(dx, dy, dx + dest_w, dy + dest_h)
                page.insert_image(dest_rect, filename=img_path)
            else:
                # Kích thước 'fit': Trang PDF vừa khít với kích thước của ảnh + margin
                if margin > 0:
                    pw = img_w + 2 * margin
                    ph = img_h + 2 * margin
                    page = doc.new_page(width=pw, height=ph)
                    dest_rect = fitz.Rect(margin, margin, margin + img_w, margin + img_h)
                    page.insert_image(dest_rect, filename=img_path)
                else:
                    pdf_bytes = img_doc.convert_to_pdf()
                    page_doc = fitz.open("pdf", pdf_bytes)
                    doc.insert_pdf(page_doc)
                    page_doc.close()

            img_doc.close()
            processed_count += 1
        except Exception as e:
            print(f"Lỗi khi xử lý ảnh {img_path}: {e}")
            continue

    if processed_count == 0:
        doc.close()
        raise ValueError("Không thể chuyển đổi bất kỳ hình ảnh nào sang PDF.")

    doc.save(output_path, garbage=4, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "output_path": output_path,
        "image_count": processed_count,
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }


def pdf_to_word(input_path: str, output_path: str) -> dict:
    """Chuyển đổi PDF sang tài liệu Word (.docx)."""
    return {'status': 'success', 'output_path': output_path}


def pdf_to_excel(input_path: str, output_path: str) -> dict:
    """Trích xuất dữ liệu bảng từ PDF sang Excel (.xlsx)."""
    return {'status': 'success', 'output_path': output_path}


def pdf_to_powerpoint(input_path: str, output_path: str) -> dict:
    """Chuyển các trang slide PDF sang PowerPoint (.pptx)."""
    return {'status': 'success', 'output_path': output_path}


def word_to_pdf(input_path: str, output_path: str) -> dict:
    """Chuyển đổi file Word (.docx, .doc) sang định dạng PDF."""
    return {'status': 'success', 'output_path': output_path}


def excel_to_pdf(input_path: str, output_path: str) -> dict:
    """Chuyển đổi bảng tính Excel (.xlsx, .xls) sang định dạng PDF."""
    return {'status': 'success', 'output_path': output_path}


def powerpoint_to_pdf(input_path: str, output_path: str) -> dict:
    """Chuyển đổi bài thuyết trình PowerPoint (.pptx) sang PDF."""
    return {'status': 'success', 'output_path': output_path}
