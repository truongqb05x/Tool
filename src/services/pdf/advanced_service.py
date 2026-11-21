"""
=========================================================
DỊCH VỤ NÂNG CAO CHO PDF - ADVANCED_SERVICE.PY
So sánh khác biệt, nhận dạng ký tự quang học (OCR) và đọc siêu dữ liệu metadata
=========================================================
"""

import os
import difflib
import fitz
from .utils import format_size


def compare_pdfs(file1_path: str, file2_path: str, output_path: str) -> dict:
    """
    So sánh hai phiên bản file PDF và xuất báo cáo khác biệt chi tiết.
    :param file1_path: Đường dẫn file PDF bản gốc (Bản cũ)
    :param file2_path: Đường dẫn file PDF bản sửa đổi (Bản mới)
    :param output_path: Đường dẫn lưu file PDF báo cáo kết quả so sánh
    """
    if not os.path.exists(file1_path):
        raise FileNotFoundError(f"Không tìm thấy file gốc: {file1_path}")
    if not os.path.exists(file2_path):
        raise FileNotFoundError(f"Không tìm thấy file đối chiếu: {file2_path}")

    size1 = os.path.getsize(file1_path)
    size2 = os.path.getsize(file2_path)
    if size1 == 0 or size2 == 0:
        raise ValueError("Một trong hai file PDF cần so sánh bị rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc1 = fitz.open(file1_path)
    doc2 = fitz.open(file2_path)

    try:
        pages1 = len(doc1)
        pages2 = len(doc2)
        max_pages = max(pages1, pages2)

        total_added = 0
        total_removed = 0
        page_diffs = []

        all_text1 = []
        all_text2 = []

        for p_idx in range(max_pages):
            text1 = doc1[p_idx].get_text() if p_idx < pages1 else ""
            text2 = doc2[p_idx].get_text() if p_idx < pages2 else ""

            all_text1.append(text1)
            all_text2.append(text2)

            lines1 = [line.strip() for line in text1.splitlines() if line.strip()]
            lines2 = [line.strip() for line in text2.splitlines() if line.strip()]

            diff = list(difflib.ndiff(lines1, lines2))
            added = [d[2:] for d in diff if d.startswith('+ ')]
            removed = [d[2:] for d in diff if d.startswith('- ')]

            total_added += len(added)
            total_removed += len(removed)

            if added or removed:
                page_diffs.append({
                    'page': p_idx + 1,
                    'added': added,
                    'removed': removed
                })

        # Tính toán tỷ lệ tương đồng
        full1 = "\n".join(all_text1)
        full2 = "\n".join(all_text2)
        sm = difflib.SequenceMatcher(None, full1, full2)
        similarity_ratio = round(sm.ratio() * 100, 1)

        # Tạo file PDF Báo cáo so sánh chuyên nghiệp bằng PyMuPDF
        rep_doc = fitz.open()
        rep_page = rep_doc.new_page(width=595.0, height=842.0) # A4

        # Tiêu đề báo cáo
        rep_page.draw_rect(fitz.Rect(36, 36, 559, 100), color=(0.12, 0.35, 0.61), fill=(0.95, 0.97, 1.0), width=1.5)
        rep_page.insert_textbox(
            fitz.Rect(50, 48, 545, 90),
            "BÁO CÁO KẾT QUẢ SO SÁNH 2 TÀI LIỆU PDF\nToolHub PDF Comparator Report",
            fontsize=13,
            fontname="helv",
            color=(0.12, 0.35, 0.61),
            align=fitz.TEXT_ALIGN_CENTER
        )

        # Bảng thông tin tệp & Thống kê
        info_y = 120
        rep_page.insert_text((50, info_y), f"• File gốc (Bản A): {pages1} trang - Dung lượng: {format_size(size1)}", fontsize=10, fontname="helv")
        rep_page.insert_text((50, info_y + 18), f"• File mới (Bản B): {pages2} trang - Dung lượng: {format_size(size2)}", fontsize=10, fontname="helv")
        rep_page.insert_text((50, info_y + 36), f"• Tỷ lệ tương đồng nội dung: {similarity_ratio}%", fontsize=10, fontname="helv")
        rep_page.insert_text((50, info_y + 54), f"• Tổng số dòng thêm mới (+): {total_added} dòng", fontsize=10, fontname="helv", color=(0.15, 0.65, 0.25))
        rep_page.insert_text((50, info_y + 72), f"• Tổng số dòng bị xóa bỏ (-): {total_removed} dòng", fontsize=10, fontname="helv", color=(0.85, 0.2, 0.2))

        # Danh sách chi tiết khác biệt theo trang
        cur_y = 220
        rep_page.insert_text((50, cur_y), "CHI TIẾT ĐIỂM KHÁC BIỆT TỪNG TRANG:", fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))
        cur_y += 20

        if not page_diffs:
            rep_page.insert_text((50, cur_y + 20), "Hai tài liệu hoàn toàn trùng khớp 100%, không phát hiện điểm khác biệt.", fontsize=10, fontname="helv", color=(0.2, 0.5, 0.2))
        else:
            for item in page_diffs:
                if cur_y > 780:
                    rep_page = rep_doc.new_page(width=595.0, height=842.0)
                    cur_y = 50

                rep_page.insert_text((50, cur_y), f"--- Trang {item['page']} ---", fontsize=10, fontname="helv", color=(0.12, 0.35, 0.61))
                cur_y += 16

                for rem in item['removed'][:5]:
                    if cur_y > 800:
                        rep_page = rep_doc.new_page(width=595.0, height=842.0)
                        cur_y = 50
                    clean_rem = rem[:80] + "..." if len(rem) > 80 else rem
                    rep_page.insert_text((60, cur_y), f"[-] {clean_rem}", fontsize=9, fontname="helv", color=(0.85, 0.2, 0.2))
                    cur_y += 14

                for add in item['added'][:5]:
                    if cur_y > 800:
                        rep_page = rep_doc.new_page(width=595.0, height=842.0)
                        cur_y = 50
                    clean_add = add[:80] + "..." if len(add) > 80 else add
                    rep_page.insert_text((60, cur_y), f"[+] {clean_add}", fontsize=9, fontname="helv", color=(0.15, 0.65, 0.25))
                    cur_y += 14

                cur_y += 8

        rep_doc.save(output_path, garbage=3, deflate=True)
        rep_doc.close()

    finally:
        doc1.close()
        doc2.close()

    result_size = os.path.getsize(output_path)
    return {
        'status': 'success',
        'differences_found': total_added + total_removed,
        'total_added': total_added,
        'total_removed': total_removed,
        'similarity_ratio': similarity_ratio,
        'changed_pages': len(page_diffs),
        'file1_pages': pages1,
        'file2_pages': pages2,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def ocr_pdf(input_path: str, output_path: str, lang: str = 'vie+eng') -> dict:
    """
    Nhận dạng ký tự quang học (OCR) từ tài liệu PDF scan để tạo file PDF có thể tìm kiếm
    hoặc trích xuất văn bản đầy đủ.
    :param input_path: Đường dẫn file PDF nguồn
    :param output_path: Đường dẫn lưu file PDF sau khi OCR
    :param lang: Ngôn ngữ nhận dạng (mặc định 'vie+eng' hoặc 'eng')
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
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi OCR.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    extracted_pages_text = []

    # Thử import pytesseract để OCR trang ảnh scan nếu có
    has_tesseract = False
    try:
        import pytesseract
        from PIL import Image
        import io
        has_tesseract = True
    except Exception:
        has_tesseract = False

    out_doc = fitz.open()

    for idx, page in enumerate(doc):
        # 1. Trích xuất text trực tiếp từ trang
        p_text = page.get_text().strip()

        # Nếu trang ít text (trang scan chứa ảnh), áp dụng OCR tesseract
        if len(p_text) < 30 and has_tesseract:
            try:
                pix = page.get_pixmap(dpi=150)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                # Thử với ngôn ngữ chỉ định, fallback 'eng'
                try:
                    ocr_res = pytesseract.image_to_string(img, lang=lang)
                except Exception:
                    ocr_res = pytesseract.image_to_string(img, lang='eng')
                if ocr_res.strip():
                    p_text = ocr_res.strip()
            except Exception as ocr_err:
                print(f"Lỗi OCR trang {idx+1}: {ocr_err}")

        extracted_pages_text.append(p_text)

        # Tạo trang mới trong file output với văn bản tìm kiếm được
        w = page.rect.width
        h = page.rect.height
        new_page = out_doc.new_page(width=w, height=h)

        # Render hình ảnh nền của trang gốc
        pix = page.get_pixmap(dpi=150)
        new_page.insert_image(page.rect, stream=pix.tobytes("png"))

        # Chèn lớp văn bản vô hình (hoặc chữ mờ) bên dưới để người dùng có thể tìm kiếm và bôi đen copy
        if p_text:
            new_page.insert_textbox(
                fitz.Rect(36, 36, w - 36, h - 36),
                p_text,
                fontsize=10,
                fontname="helv",
                fill_opacity=0.01 # Lớp văn bản trong suốt tìm kiếm được
            )

    out_doc.save(output_path, garbage=3, deflate=True)
    out_doc.close()
    doc.close()

    total_words = sum(len(t.split()) for t in extracted_pages_text)
    result_size = os.path.getsize(output_path)

    return {
        'status': 'success',
        'total_pages': total_pages,
        'total_words': total_words,
        'lang': lang,
        'has_ocr_engine': has_tesseract,
        'result_size': result_size,
        'result_size_formatted': format_size(result_size),
        'output_path': output_path
    }


def get_pdf_info(input_path: str) -> dict:
    """
    Trích xuất siêu dữ liệu (metadata), số trang, kích thước khổ giấy, phiên bản định dạng
    và trạng thái bảo mật của file PDF.
    :param input_path: Đường dẫn file PDF nguồn
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    file_size = os.path.getsize(input_path)
    if file_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    doc = fitz.open(input_path)
    try:
        is_encrypted = doc.is_encrypted
        total_pages = len(doc)
        meta = doc.metadata or {}

        # Lấy kích thước trang đầu tiên
        page_w = 0
        page_h = 0
        format_name = "Khổ tùy chỉnh"

        if total_pages > 0 and not is_encrypted:
            p0 = doc[0]
            page_w = round(p0.rect.width, 1)
            page_h = round(p0.rect.height, 1)

            # Xác định khổ giấy phổ biến
            if (590 <= page_w <= 600 and 835 <= page_h <= 850) or (590 <= page_h <= 600 and 835 <= page_w <= 850):
                format_name = "A4 (210 x 297 mm)"
            elif (605 <= page_w <= 618 and 785 <= page_h <= 800) or (605 <= page_h <= 618 and 785 <= page_w <= 800):
                format_name = "Letter (8.5 x 11 inch)"
            elif (835 <= page_w <= 850 and 1180 <= page_h <= 1200) or (835 <= page_h <= 850 and 1180 <= page_w <= 1200):
                format_name = "A3 (297 x 420 mm)"

        info_dict = {
            'title': meta.get('title') or 'Chưa đặt tiêu đề',
            'author': meta.get('author') or 'Không rõ tác giả',
            'subject': meta.get('subject') or 'Chưa có chủ đề',
            'keywords': meta.get('keywords') or 'Không có từ khóa',
            'creator': meta.get('creator') or 'Không rõ phần mềm tạo',
            'producer': meta.get('producer') or 'PyMuPDF Engine',
            'creation_date': meta.get('creationDate') or 'Không xác định',
            'mod_date': meta.get('modDate') or 'Không xác định',
            'total_pages': total_pages,
            'is_encrypted': is_encrypted,
            'page_width': page_w,
            'page_height': page_h,
            'page_format': format_name,
            'file_size': file_size,
            'file_size_formatted': format_size(file_size)
        }

        return {
            'status': 'success',
            'metadata': info_dict
        }
    finally:
        doc.close()
