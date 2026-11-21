"""
=========================================================
LOGIC XỬ LÝ TRÍCH XUẤT TRANG PDF - TRICH_XUAT_TRANG_PDF.PY
Tiếp nhận file PDF và danh sách các trang cần bóc tách
Hỗ trợ trích xuất thành 1 file PDF mới hoặc các file riêng lẻ nén .ZIP
=========================================================
"""

import os
import uuid
import json
import shutil
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app, session
from ...services.pdf import PdfService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


def parse_pages_input(raw_input, max_page=9999):
    """Phân tích danh sách số trang từ JSON array hoặc chuỗi (ví dụ: '1, 3, 5-8')."""
    pages = set()
    if not raw_input:
        return []

    # Nếu là mảng JSON
    if isinstance(raw_input, list):
        for item in raw_input:
            try:
                p = int(item)
                if 1 <= p <= max_page:
                    pages.add(p)
            except (ValueError, TypeError):
                continue
        return sorted(list(pages))

    raw_str = str(raw_input).strip()
    if raw_str.startswith('[') and raw_str.endswith(']'):
        try:
            arr = json.loads(raw_str)
            return parse_pages_input(arr, max_page)
        except Exception:
            pass

    for part in raw_str.split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            bounds = part.split('-')
            try:
                start = int(bounds[0].strip())
                end = int(bounds[1].strip())
                f = max(1, min(start, end))
                t = min(max_page, max(start, end))
                for p in range(f, t + 1):
                    pages.add(p)
            except ValueError:
                continue
        else:
            try:
                p = int(part)
                if 1 <= p <= max_page:
                    pages.add(p)
            except ValueError:
                continue

    return sorted(list(pages))


def api_extract_pages():
    """API tiếp nhận file PDF và danh sách các trang cần trích xuất."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'message': 'Vui lòng chọn 1 tệp tài liệu định dạng PDF hợp lệ.'
        }), 400

    raw_pages = request.form.get('pages', '')
    pages_to_extract = parse_pages_input(raw_pages)

    if not pages_to_extract:
        return jsonify({
            'status': 'error',
            'message': 'Vui lòng chỉ định ít nhất 1 số trang cần trích xuất (ví dụ: 1, 3, 5-8).'
        }), 400

    extract_mode = request.form.get('extract_mode', 'merged').strip().lower()
    if extract_mode not in ['merged', 'separate']:
        extract_mode = 'merged'

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    extracted_dir = os.path.join(upload_dir, 'extracted')
    temp_dir = os.path.join(extracted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    base_name = os.path.splitext(safe_name)[0]

    if extract_mode == 'separate':
        download_name = f"{base_name}_trich_xuat.zip"
        output_path = os.path.join(extracted_dir, f"{task_id}.zip")
    else:
        download_name = f"{base_name}_trich_xuat.pdf"
        output_path = os.path.join(extracted_dir, f"{task_id}_extracted.pdf")

    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")

    try:
        file.save(temp_input_path)

        # Thực thi trích xuất trang bằng PyMuPDF
        result = PdfService.extract_pages(
            temp_input_path,
            output_path,
            pages_to_extract,
            extract_mode=extract_mode
        )

        # Kiểm tra đăng nhập
        user_id = session.get('user_id')
        if not user_id:
            auth_id = request.headers.get('X-User-Id') or request.form.get('user_id')
            if auth_id and str(auth_id).isdigit():
                user_id = int(auth_id)

        user = get_user_by_id(user_id) if user_id else None

        saved_in_account = False
        user_file_id = None
        download_url = f"/pdf/download/{task_id}/{download_name}"

        if user and user.is_active:
            user_storage_dir = os.path.join(upload_dir, 'users', str(user.id))
            os.makedirs(user_storage_dir, exist_ok=True)
            user_file_dest = os.path.join(user_storage_dir, f"{task_id}_{download_name}")
            shutil.copy2(output_path, user_file_dest)

            user_file = save_user_file(
                user_id=user.id,
                original_name=file.filename,
                file_name=download_name,
                file_path=user_file_dest,
                file_size=result['result_size'],
                file_type='zip' if result['is_zip'] else 'pdf',
                tool_slug='trich-xuat-trang-pdf',
                tool_title='Trích xuất trang PDF',
                meta_dict={
                    'task_id': task_id,
                    'extracted_count': result['extracted_count'],
                    'extracted_pages': result['extracted_pages'],
                    'total_original_pages': result['total_original_pages'],
                    'extract_mode': result['extract_mode'],
                    'result_size_formatted': result['result_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id

        return jsonify({
            'status': 'success',
            'message': f"Đã trích xuất thành công {result['extracted_count']} trang theo yêu cầu!",
            'data': {
                'task_id': task_id,
                'download_url': download_url,
                'download_name': download_name,
                'extracted_count': result['extracted_count'],
                'extracted_pages': result['extracted_pages'],
                'total_original_pages': result['total_original_pages'],
                'extract_mode': result['extract_mode'],
                'is_zip': result['is_zip'],
                'result_size': result['result_size'],
                'result_size_formatted': result['result_size_formatted'],
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        })

    except Exception as e:
        current_app.logger.error(f"[TRICH_XUAT_TRANG_PDF] Lỗi xử lý: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f"Lỗi trong quá trình trích xuất trang: {str(e)}"
        }), 500

    finally:
        # Dọn dẹp file tạm nguồn
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except Exception:
                pass


def register_trich_xuat_trang_pdf_routes(bp):
    """Đăng ký các route liên quan đến trích xuất trang PDF."""
    bp.add_url_rule(
        '/api/trich-xuat-trang-pdf',
        view_func=api_extract_pages,
        methods=['POST']
    )
