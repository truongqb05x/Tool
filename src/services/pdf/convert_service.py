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


def pdf_to_word(
    input_path: str,
    output_path: str,
    start_page: int = 0,
    end_page: int = None
) -> dict:
    """
    Chuyển đổi tài liệu PDF sang tài liệu Word (.docx) chuẩn định dạng và bố cục.
    Sử dụng pdf2docx Converter cao cấp, có cơ chế dự phòng PyMuPDF + python-docx.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file .docx kết quả
    :param start_page: Trang bắt đầu (0-indexed, mặc định 0)
    :param end_page: Trang kết thúc (0-indexed, mặc định None = hết file)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Đọc thông tin file PDF nguồn
    doc = fitz.open(input_path)
    total_pages = len(doc)
    doc.close()

    if total_pages == 0:
        raise ValueError("Tài liệu PDF không có trang nào để chuyển đổi.")

    conversion_success = False

    # 1. Thử chuyển đổi bằng pdf2docx (độ chính xác bố cục, bảng biểu và font chữ cao nhất)
    try:
        from pdf2docx import Converter
        cv = Converter(input_path)
        if end_page is not None:
            cv.convert(output_path, start=start_page, end=end_page)
        else:
            cv.convert(output_path, start=start_page)
        cv.close()
        conversion_success = os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception as e:
        print(f"pdf2docx chuyển đổi gặp cảnh báo, chuyển sang cơ chế dự phòng: {e}")
        conversion_success = False

    # 2. Cơ chế dự phòng bằng python-docx + PyMuPDF nếu pdf2docx gặp lỗi đặc biệt
    if not conversion_success:
        try:
            import docx
            from docx.shared import Pt, Inches
            word_doc = docx.Document()
            doc = fitz.open(input_path)

            start = max(0, start_page)
            end = min(total_pages, end_page) if end_page is not None else total_pages

            for pno in range(start, end):
                page = doc[pno]
                text = page.get_text("text")
                if text.strip():
                    for para in text.split("\n\n"):
                        if para.strip():
                            word_doc.add_paragraph(para.strip())
                if pno < end - 1:
                    word_doc.add_page_break()

            doc.close()
            word_doc.save(output_path)
            conversion_success = True
        except Exception as e2:
            raise RuntimeError(f"Không thể chuyển đổi PDF sang Word: {e2}")

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "output_path": output_path,
        "total_pages": total_pages,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }


def pdf_to_excel(input_path: str, output_path: str) -> dict:
    """
    Trích xuất dữ liệu bảng tính từ PDF sang định dạng Excel (.xlsx).
    Sử dụng PyMuPDF find_tables() cao cấp kết hợp openpyxl.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file .xlsx kết quả
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    wb = openpyxl.Workbook()
    # Xóa sheet mặc định
    default_sheet = wb.active
    wb.remove(default_sheet)

    doc = fitz.open(input_path)
    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("Tài liệu PDF không có trang nào.")

    total_tables_found = 0

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1E5B9C", end_color="1E5B9C", fill_type="solid")
    data_font = Font(name="Calibri", size=10)
    thin_border = Border(
        left=Side(style='thin', color='D9D9D9'),
        right=Side(style='thin', color='D9D9D9'),
        top=Side(style='thin', color='D9D9D9'),
        bottom=Side(style='thin', color='D9D9D9')
    )

    for pno in range(total_pages):
        page = doc[pno]
        ws = wb.create_sheet(title=f"Trang {pno + 1}")
        current_row = 1

        # 1. Tìm các bảng bằng engine Table Finder của PyMuPDF
        tables = page.find_tables()
        if tables and len(tables.tables) > 0:
            for tab in tables:
                total_tables_found += 1
                tab_data = tab.extract()
                for r_idx, row in enumerate(tab_data):
                    for c_idx, val in enumerate(row):
                        cell = ws.cell(row=current_row, column=c_idx + 1)
                        clean_val = str(val).strip() if val is not None else ""
                        
                        # Chuyển đổi số nếu là định dạng số hợp lệ
                        if clean_val.replace('.', '', 1).replace(',', '', 1).isdigit():
                            try:
                                cell.value = float(clean_val.replace(',', '.'))
                            except ValueError:
                                cell.value = clean_val
                        else:
                            cell.value = clean_val

                        cell.border = thin_border
                        if r_idx == 0:
                            cell.font = header_font
                            cell.fill = header_fill
                            cell.alignment = Alignment(horizontal="center", vertical="center")
                        else:
                            cell.font = data_font
                            cell.alignment = Alignment(vertical="center")
                    current_row += 1
                current_row += 2  # Cách 2 dòng giữa các bảng
        else:
            # 2. Nếu không tìm thấy bảng kẻ viền, trích xuất các dòng văn bản theo hàng
            blocks = page.get_text("blocks")
            for b in blocks:
                block_text = b[4].strip()
                if block_text:
                    lines = block_text.split("\n")
                    for line in lines:
                        if line.strip():
                            # Thử tách theo tab hoặc 2 dấu cách liên tiếp
                            import re
                            cols = re.split(r'\t+|\s{3,}', line.strip())
                            for c_idx, col_text in enumerate(cols):
                                cell = ws.cell(row=current_row, column=c_idx + 1)
                                cell.value = col_text.strip()
                                cell.font = data_font
                            current_row += 1
                    current_row += 1

        # Tự động điều chỉnh độ rộng cột
        for col in ws.columns:
            max_len = 0
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            for cell in col:
                if cell.value:
                    val_str = str(cell.value)
                    if len(val_str) > max_len:
                        max_len = len(val_str)
            ws.column_dimensions[col_letter].width = max(10, min(max_len + 3, 50))

    doc.close()

    # Nếu file PDF không có nội dung gì, tạo 1 sheet trống
    if len(wb.sheetnames) == 0:
        wb.create_sheet(title="Du_lieu")

    wb.save(output_path)
    result_size = os.path.getsize(output_path)

    return {
        "status": "success",
        "output_path": output_path,
        "total_pages": total_pages,
        "tables_found": total_tables_found,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }


def pdf_to_powerpoint(input_path: str, output_path: str) -> dict:
    """
    Chuyển đổi từng trang slide trong PDF sang bài thuyết trình PowerPoint (.pptx).
    Sử dụng python-pptx và PyMuPDF render slide độ phân giải cao kèm text box.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file .pptx kết quả
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    import io
    from pptx import Presentation
    from pptx.util import Inches, Pt

    prs = Presentation()
    # Xóa slide mẫu nếu có
    blank_layout = prs.slide_layouts[6] # layout trống

    doc = fitz.open(input_path)
    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("Tài liệu PDF không có trang nào.")

    # Đặt kích thước slide theo trang đầu tiên (chuẩn 16:9 hoặc theo trang PDF)
    first_page = doc[0]
    p_w, p_h = first_page.rect.width, first_page.rect.height

    # Chuyển đổi points sang Inches (72 points = 1 inch)
    prs.slide_width = Inches(p_w / 72.0)
    prs.slide_height = Inches(p_h / 72.0)

    # Hệ số render ảnh nền chất lượng cao
    zoom = 150.0 / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    for pno in range(total_pages):
        page = doc[pno]
        slide = prs.slides.add_slide(blank_layout)

        # 1. Render ảnh trang làm nền slide để giữ trọn vẹn đồ họa, vector, gradient
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        img_bytes = io.BytesIO(pix.tobytes("png"))

        slide.shapes.add_picture(
            img_bytes,
            Inches(0),
            Inches(0),
            width=prs.slide_width,
            height=prs.slide_height
        )

        # 2. Trích xuất các khối văn bản để người dùng có thể chọn và sao chép/chỉnh sửa
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            if text:
                bx0, by0, bx1, by1 = b[0], b[1], b[2], b[3]
                tx = Inches(bx0 / 72.0)
                ty = Inches(by0 / 72.0)
                tw = Inches((bx1 - bx0) / 72.0)
                th = Inches((by1 - by0) / 72.0)

                txBox = slide.shapes.add_textbox(tx, ty, tw, th)
                tf = txBox.text_frame
                tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = text
                p.font.size = Pt(11)

    doc.close()
    prs.save(output_path)
    result_size = os.path.getsize(output_path)

    return {
        "status": "success",
        "output_path": output_path,
        "slides_count": total_pages,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }


def word_to_pdf(input_path: str, output_path: str) -> dict:
    """
    Chuyển đổi tài liệu Word (.docx, .doc) sang định dạng PDF chuẩn.
    Sử dụng docx2pdf / Word COM, có cơ chế dự phòng PyMuPDF + python-docx.
    :param input_path: Đường dẫn file Word nguồn
    :param output_path: Đường dẫn lưu file PDF kết quả
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File Word rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    conversion_success = False

    # 1. Thử dùng docx2pdf (chất lượng bản in Microsoft Word 100% gốc)
    try:
        import pythoncom
        pythoncom.CoInitialize()
        import docx2pdf
        docx2pdf.convert(input_path, output_path)
        conversion_success = os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception as e:
        print(f"docx2pdf chuyển đổi gặp lỗi: {e}, chuyển sang cơ chế dự phòng PyMuPDF...")
        conversion_success = False

    # 2. Cơ chế dự phòng thuần Python bằng python-docx + PyMuPDF
    if not conversion_success:
        try:
            import docx
            wdoc = docx.Document(input_path)
            doc = fitz.open()

            # Khổ A4 chuẩn (595 x 842 points)
            page_w, page_h = 595.0, 842.0
            margin = 54.0 # 0.75 inch
            rect = fitz.Rect(margin, margin, page_w - margin, page_h - margin)

            page = doc.new_page(width=page_w, height=page_h)
            current_y = margin

            for p in wdoc.paragraphs:
                text = p.text.strip()
                if not text:
                    current_y += 12
                    continue

                # Kích thước font
                fontsize = 12
                line_height = fontsize * 1.4

                # Nếu vượt quá chiều cao trang, sang trang mới
                if current_y + line_height > page_h - margin:
                    page = doc.new_page(width=page_w, height=page_h)
                    current_y = margin

                page.insert_text(
                    (margin, current_y + fontsize),
                    text,
                    fontsize=fontsize,
                    fontname="helv"
                )
                current_y += line_height + 4

            # Xử lý các bảng nếu có
            for table in wdoc.tables:
                for row in table.rows:
                    row_text = "  |  ".join([c.text.strip() for c in row.cells])
                    if row_text:
                        if current_y + 16 > page_h - margin:
                            page = doc.new_page(width=page_w, height=page_h)
                            current_y = margin
                        page.insert_text((margin, current_y + 12), row_text, fontsize=10, fontname="helv")
                        current_y += 18

            doc.save(output_path, garbage=4, deflate=True)
            doc.close()
            conversion_success = True
        except Exception as e2:
            raise RuntimeError(f"Không thể chuyển đổi file Word sang PDF: {e2}")

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "output_path": output_path,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }


def excel_to_pdf(input_path: str, output_path: str) -> dict:
    """
    Chuyển đổi bảng tính Excel (.xlsx, .xls) sang định dạng tài liệu PDF.
    Đọc dữ liệu bằng openpyxl và vẽ bảng biểu chuyên nghiệp bằng PyMuPDF.
    :param input_path: Đường dẫn file Excel nguồn
    :param output_path: Đường dẫn lưu file PDF kết quả
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File Excel rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    import openpyxl

    wb = openpyxl.load_workbook(input_path, data_only=True)
    doc = fitz.open()

    total_sheets = len(wb.sheetnames)
    if total_sheets == 0:
        wb.close()
        raise ValueError("File Excel không chứa trang tính (sheet) nào.")

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        # Lấy dữ liệu tất cả các hàng
        rows_data = []
        for row in ws.iter_rows(values_only=True):
            # Bỏ qua các hàng rỗng hoàn toàn
            if any(val is not None and str(val).strip() != "" for val in row):
                clean_row = [str(val).strip() if val is not None else "" for val in row]
                rows_data.append(clean_row)

        if not rows_data:
            continue

        # Xác định số cột thực tế
        max_cols = max(len(r) for r in rows_data)
        # Chuẩn hóa độ dài các hàng
        for r in rows_data:
            while len(r) < max_cols:
                r.append("")

        # Chọn hướng trang: nếu nhiều hơn 5 cột thì chọn khổ A4 ngang
        if max_cols > 5:
            page_w, page_h = 842.0, 595.0 # A4 Ngang
        else:
            page_w, page_h = 595.0, 842.0 # A4 Dọc

        margin = 36.0
        avail_w = page_w - 2 * margin
        avail_h = page_h - 2 * margin

        # Tính độ rộng cột tự động
        col_widths = [max(1, max(len(r[c]) for r in rows_data)) for c in range(max_cols)]
        total_chars = sum(col_widths)
        col_pixel_widths = [(w / total_chars) * avail_w for w in col_widths]

        # Đảm bảo độ rộng tối thiểu mỗi cột
        col_pixel_widths = [max(30.0, pw) for pw in col_pixel_widths]
        # Chuẩn hóa lại cho vừa khung
        scale_ratio = avail_w / sum(col_pixel_widths)
        col_pixel_widths = [pw * scale_ratio for pw in col_pixel_widths]

        row_height = 20.0
        current_y = margin

        # Tạo trang đầu tiên của Sheet
        page = doc.new_page(width=page_w, height=page_h)
        # Tiêu đề Sheet
        page.insert_text((margin, current_y), f"Trang tính: {sheet_name}", fontsize=12, fontname="helv", color=(0.12, 0.36, 0.61))
        current_y += 20.0

        for r_idx, row in enumerate(rows_data):
            # Nếu hết trang, sang trang mới
            if current_y + row_height > page_h - margin:
                page = doc.new_page(width=page_w, height=page_h)
                current_y = margin

            current_x = margin
            for c_idx, cell_text in enumerate(row):
                c_w = col_pixel_widths[c_idx]
                cell_rect = fitz.Rect(current_x, current_y, current_x + c_w, current_y + row_height)

                # Vẽ viền ô
                page.draw_rect(cell_rect, color=(0.8, 0.8, 0.8), fill=(0.92, 0.95, 0.98) if r_idx == 0 else (1, 1, 1))

                # Vẽ text ô
                fontsize = 9 if r_idx > 0 else 9.5
                font_color = (0, 0, 0)
                text_x = current_x + 4
                text_y = current_y + 14

                # Cắt bớt nếu text quá dài
                display_text = cell_text
                if len(display_text) > 40:
                    display_text = display_text[:37] + "..."

                page.insert_text(
                    (text_x, text_y),
                    display_text,
                    fontsize=fontsize,
                    fontname="helv",
                    color=font_color
                )
                current_x += c_w

            current_y += row_height

    wb.close()

    if len(doc) == 0:
        page = doc.new_page()
        page.insert_text((72, 72), "File Excel khong co du lieu bang tinh de hien thi.")

    doc.save(output_path, garbage=4, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "output_path": output_path,
        "sheets_count": total_sheets,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }


def powerpoint_to_pdf(input_path: str, output_path: str) -> dict:
    """
    Chuyển đổi bài thuyết trình PowerPoint (.pptx, .ppt) sang định dạng PDF chuẩn.
    Sử dụng python-pptx và PyMuPDF render trang chiếu chuyên nghiệp.
    :param input_path: Đường dẫn file PowerPoint nguồn
    :param output_path: Đường dẫn lưu file PDF kết quả
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PowerPoint rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    from pptx import Presentation
    from pptx.enum.shapes import MSO_SHAPE_TYPE

    prs = Presentation(input_path)
    doc = fitz.open()

    total_slides = len(prs.slides)
    if total_slides == 0:
        raise ValueError("Bài thuyết trình không chứa slide nào.")

    # Kích thước slide PowerPoint (chuyển đổi từ inches sang points: 1 inch = 72 points)
    slide_w_pt = prs.slide_width.inches * 72.0
    slide_h_pt = prs.slide_height.inches * 72.0

    for slide in prs.slides:
        page = doc.new_page(width=slide_w_pt, height=slide_h_pt)
        # Nền slide màu trắng nhẹ
        page.draw_rect(fitz.Rect(0, 0, slide_w_pt, slide_h_pt), color=(0.95, 0.95, 0.95), fill=(0.99, 0.99, 0.99))

        for shape in slide.shapes:
            # 1. Trích xuất text box và tiêu đề
            if shape.has_text_frame:
                tf = shape.text_frame
                text = tf.text.strip()
                if text:
                    sx = shape.left.inches * 72.0
                    sy = shape.top.inches * 72.0
                    sw = shape.width.inches * 72.0
                    sh = shape.height.inches * 72.0

                    rect = fitz.Rect(sx, sy, sx + sw, sy + sh)
                    page.insert_textbox(
                        rect,
                        text,
                        fontsize=14 if len(text) < 50 else 11,
                        fontname="helv",
                        color=(0.1, 0.1, 0.1)
                    )

            # 2. Trích xuất hình ảnh nếu có trong slide
            elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                try:
                    img_bytes = shape.image.blob
                    sx = shape.left.inches * 72.0
                    sy = shape.top.inches * 72.0
                    sw = shape.width.inches * 72.0
                    sh = shape.height.inches * 72.0
                    rect = fitz.Rect(sx, sy, sx + sw, sy + sh)
                    page.insert_image(rect, stream=img_bytes)
                except Exception as img_err:
                    print(f"Bỏ qua hình ảnh lỗi: {img_err}")

    doc.save(output_path, garbage=4, deflate=True)
    doc.close()

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "output_path": output_path,
        "slides_count": total_slides,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size)
    }
