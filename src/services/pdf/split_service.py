"""
=========================================================
DỊCH VỤ TÁCH PDF - SPLIT_SERVICE.PY
Bóc tách file PDF theo phạm vi, theo trang hoặc theo giới hạn dung lượng
Hỗ trợ xoay trang, tùy chọn gộp và đóng gói ZIP tự động
=========================================================
"""

import os
import uuid
import zipfile
import shutil
import fitz
from .utils import format_size


def split_pdf(input_path: str, output_dir: str, config: dict, original_name: str = 'tailieu.pdf', task_id: str = None) -> dict:
    """
    Bóc tách file PDF linh hoạt theo 3 phương thức:
    - Phạm vi (Range): Tùy chọn các khoảng trang hoặc chia đều theo số trang cố định.
    - Theo trang (Pages): Tách tất cả các trang độc lập hoặc chọn chuỗi trang tùy ý (vd: 1, 3, 5-8).
    - Dung lượng (Size): Chia nhỏ theo giới hạn dung lượng tối đa mỗi file (KB/MB).
    Hỗ trợ xoay trang, tùy chọn gộp thành 1 file hoặc đóng gói toàn bộ vào tệp ZIP.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File PDF rỗng (0 bytes).")

    if not task_id:
        task_id = str(uuid.uuid4())

    os.makedirs(output_dir, exist_ok=True)
    temp_split_dir = os.path.join(output_dir, f"temp_{task_id}")
    os.makedirs(temp_split_dir, exist_ok=True)

    doc = fitz.open(input_path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("File PDF đang được cài mật khẩu bảo vệ. Vui lòng mở khóa trước khi bóc tách.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("File PDF không có trang nào.")

    # Áp dụng góc xoay nếu người dùng đã thao tác xoay xem trước
    rotation = int(config.get('rotation', 0)) % 360
    if rotation in (90, 180, 270):
        for page in doc:
            page.set_rotation((page.rotation + rotation) % 360)

    base_name = os.path.splitext(original_name)[0] or 'tailieu'
    tab = config.get('tab', 'range')
    created_files = []

    try:
        # ================= TAB 1: PHẠM VI (RANGE) =================
        if tab == 'range':
            mode = config.get('range_mode', 'custom')
            if mode == 'custom':
                ranges = config.get('ranges', [])
                merge = bool(config.get('merge_ranges', False))

                if not ranges:
                    ranges = [{'from': 1, 'to': total_pages}]

                valid_ranges = []
                for r in ranges:
                    try:
                        f = max(1, min(int(r.get('from', 1)), total_pages))
                        t = max(1, min(int(r.get('to', total_pages)), total_pages))
                        if f <= t:
                            valid_ranges.append((f, t))
                        else:
                            valid_ranges.append((t, f))
                    except (ValueError, TypeError):
                        continue

                if not valid_ranges:
                    valid_ranges = [(1, total_pages)]

                if merge:
                    out_doc = fitz.open()
                    for f, t in valid_ranges:
                        out_doc.insert_pdf(doc, from_page=f - 1, to_page=t - 1)
                    out_path = os.path.join(temp_split_dir, f"{base_name}_gop_khoang.pdf")
                    out_doc.save(out_path, garbage=3, deflate=True)
                    out_doc.close()
                    created_files.append(out_path)
                else:
                    for idx, (f, t) in enumerate(valid_ranges, start=1):
                        out_doc = fitz.open()
                        out_doc.insert_pdf(doc, from_page=f - 1, to_page=t - 1)
                        out_path = os.path.join(temp_split_dir, f"{base_name}_khoang_{idx}_trang_{f}-{t}.pdf")
                        out_doc.save(out_path, garbage=3, deflate=True)
                        out_doc.close()
                        created_files.append(out_path)

            elif mode == 'fixed':
                fixed_pages = max(1, int(config.get('fixed_pages', 1)))
                part_idx = 1
                for start_p in range(0, total_pages, fixed_pages):
                    end_p = min(start_p + fixed_pages - 1, total_pages - 1)
                    out_doc = fitz.open()
                    out_doc.insert_pdf(doc, from_page=start_p, to_page=end_p)
                    out_path = os.path.join(temp_split_dir, f"{base_name}_phan_{part_idx}_trang_{start_p + 1}-{end_p + 1}.pdf")
                    out_doc.save(out_path, garbage=3, deflate=True)
                    out_doc.close()
                    created_files.append(out_path)
                    part_idx += 1

        # ================= TAB 2: THEO TRANG (PAGES) =================
        elif tab == 'pages':
            mode = config.get('extract_mode', 'all')
            if mode == 'all':
                for p_idx in range(total_pages):
                    out_doc = fitz.open()
                    out_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)
                    out_path = os.path.join(temp_split_dir, f"{base_name}_trang_{p_idx + 1}.pdf")
                    out_doc.save(out_path, garbage=3, deflate=True)
                    out_doc.close()
                    created_files.append(out_path)
            elif mode == 'select':
                pages_str = str(config.get('pages_to_extract', '')).strip()
                merge = bool(config.get('merge_pages', False))

                # Phân tích chuỗi số trang (vd: 1, 3, 5-8)
                selected_pages = []
                seen_pages = set()
                for part in pages_str.split(','):
                    part = part.strip()
                    if not part:
                        continue
                    if '-' in part:
                        p_bounds = part.split('-')
                        try:
                            b_start = int(p_bounds[0].strip())
                            b_end = int(p_bounds[1].strip())
                            f = max(1, min(b_start, b_end))
                            t = min(total_pages, max(b_start, b_end))
                            for p in range(f, t + 1):
                                if p not in seen_pages:
                                    seen_pages.add(p)
                                    selected_pages.append(p)
                        except ValueError:
                            continue
                    else:
                        try:
                            p = int(part)
                            if 1 <= p <= total_pages and p not in seen_pages:
                                seen_pages.add(p)
                                selected_pages.append(p)
                        except ValueError:
                            continue

                if not selected_pages:
                    selected_pages = list(range(1, total_pages + 1))

                if merge:
                    out_doc = fitz.open()
                    for p in selected_pages:
                        out_doc.insert_pdf(doc, from_page=p - 1, to_page=p - 1)
                    out_path = os.path.join(temp_split_dir, f"{base_name}_trich_xuat.pdf")
                    out_doc.save(out_path, garbage=3, deflate=True)
                    out_doc.close()
                    created_files.append(out_path)
                else:
                    for p in selected_pages:
                        out_doc = fitz.open()
                        out_doc.insert_pdf(doc, from_page=p - 1, to_page=p - 1)
                        out_path = os.path.join(temp_split_dir, f"{base_name}_trang_{p}.pdf")
                        out_doc.save(out_path, garbage=3, deflate=True)
                        out_doc.close()
                        created_files.append(out_path)

        # ================= TAB 3: DUNG LƯỢNG (SIZE) =================
        elif tab == 'size':
            max_size_kb = float(config.get('max_size_kb', 500))
            max_bytes = max(10 * 1024, int(max_size_kb * 1024))
            allow_compression = bool(config.get('allow_compression', True))
            garbage_val = 4 if allow_compression else 3

            current_chunk = []
            part_idx = 1

            for p_idx in range(total_pages):
                test_doc = fitz.open()
                for cp in (current_chunk + [p_idx]):
                    test_doc.insert_pdf(doc, from_page=cp, to_page=cp)
                test_bytes = len(test_doc.tobytes(garbage=garbage_val, deflate=True))
                test_doc.close()

                if test_bytes > max_bytes and len(current_chunk) > 0:
                    out_doc = fitz.open()
                    for cp in current_chunk:
                        out_doc.insert_pdf(doc, from_page=cp, to_page=cp)
                    out_path = os.path.join(temp_split_dir, f"{base_name}_phan_{part_idx}.pdf")
                    out_doc.save(out_path, garbage=garbage_val, deflate=True)
                    out_doc.close()
                    created_files.append(out_path)
                    part_idx += 1
                    current_chunk = [p_idx]
                else:
                    current_chunk.append(p_idx)

            if current_chunk:
                out_doc = fitz.open()
                for cp in current_chunk:
                    out_doc.insert_pdf(doc, from_page=cp, to_page=cp)
                out_path = os.path.join(temp_split_dir, f"{base_name}_phan_{part_idx}.pdf")
                out_doc.save(out_path, garbage=garbage_val, deflate=True)
                out_doc.close()
                created_files.append(out_path)

        # Dự phòng nếu không có file nào được tạo
        if not created_files:
            out_path = os.path.join(temp_split_dir, f"{base_name}_trang_1.pdf")
            out_doc = fitz.open()
            out_doc.insert_pdf(doc, from_page=0, to_page=0)
            out_doc.save(out_path, garbage=3, deflate=True)
            out_doc.close()
            created_files.append(out_path)

        # Đóng file nguồn
        doc.close()

        # Đóng gói kết quả: 1 file -> .pdf, nhiều file -> .zip
        if len(created_files) == 1:
            final_filename = os.path.basename(created_files[0])
            final_output_path = os.path.join(output_dir, f"{task_id}.pdf")
            shutil.copy2(created_files[0], final_output_path)
            is_zip = False
            download_name = final_filename
        else:
            final_output_path = os.path.join(output_dir, f"{task_id}.zip")
            with zipfile.ZipFile(final_output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
                for f in created_files:
                    zf.write(f, arcname=os.path.basename(f))
            is_zip = True
            download_name = f"{base_name}_da_tach.zip"

        result_size = os.path.getsize(final_output_path)

        return {
            'status': 'success',
            'task_id': task_id,
            'total_files': len(created_files),
            'total_source_pages': total_pages,
            'is_zip': is_zip,
            'download_name': download_name,
            'output_path': final_output_path,
            'result_size': result_size,
            'result_size_formatted': format_size(result_size)
        }

    except Exception as e:
        if doc:
            try:
                doc.close()
            except Exception:
                pass
        raise e
    finally:
        # Dọn dẹp thư mục tạm của task
        if os.path.exists(temp_split_dir):
            try:
                shutil.rmtree(temp_split_dir, ignore_errors=True)
            except Exception:
                pass
