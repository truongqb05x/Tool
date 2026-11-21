"""
=========================================================
LOGIC XỬ LÝ SẮP XẾP TRANG PDF - SAP_XEP_TRANG_PDF.PY
Tiếp nhận file PDF và danh sách thứ tự sắp xếp trang mới
Thực thi tái tạo thứ tự trang bằng PyMuPDF và hỗ trợ lưu vào tài khoản
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


def parse_order_input(raw_input):
    """
    Phân tích thứ tự trang từ mảng JSON, dict list hoặc chuỗi '3,1,2,4'.
    Trả về list các int hoặc dict [{'page': int, 'rotation': int}].
    """
    if not raw_input:
        return []

    if isinstance(raw_input, list):
        return raw_input

    raw_str = str(raw_input).strip()
    if raw_str.startswith('[') and raw_str.endswith(']'):
        try:
            return json.loads(raw_str)
        except Exception:
            pass

    # Nếu là chuỗi phân tách bởi dấu phẩy '3, 1, 2, 4'
    result = []
    for item in raw_str.split(','):
        item = item.strip()
        if not item:
            continue
        try:
            result.append(int(item))
        except ValueError:
            continue
    return result


def api_reorder_pages():
    """API tiếp nhận file PDF và danh sách thứ tự trang mới để xuất ra tài liệu mới."""
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

    raw_order = request.form.get('new_order', '')
    new_order = parse_order_input(raw_order)

    if not new_order:
        return jsonify({
            'status': 'error',
            'message': 'Vui lòng cung cấp danh sách thứ tự trang cần sắp xếp.'
        }), 400

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    reordered_dir = os.path.join(upload_dir, 'reordered')
    temp_dir = os.path.join(reordered_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tailieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    download_name = f"{base_name}_da_sap_xep.pdf"
    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")
    output_path = os.path.join(reordered_dir, f"{task_id}_reordered.pdf")

    try:
        file.save(temp_input_path)

        # Thực thi sắp xếp trang bằng PyMuPDF
        result = PdfService.reorder_pages(temp_input_path, output_path, new_order)

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
                file_type='pdf',
                tool_slug='sap-xep-trang-pdf',
                tool_title='Sắp xếp trang PDF',
                meta_dict={
                    'task_id': task_id,
                    'total_pages': result['total_pages'],
                    'new_order': result['new_order'],
                    'result_size_formatted': result['result_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id

        return jsonify({
            'status': 'success',
            'message': f"Đã sắp xếp thành công {result['total_pages']} trang theo yêu cầu!",
            'data': {
                'task_id': task_id,
                'download_url': download_url,
                'download_name': download_name,
                'total_pages': result['total_pages'],
                'new_order': result['new_order'],
                'result_size': result['result_size'],
                'result_size_formatted': result['result_size_formatted'],
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        })

    except Exception as e:
        current_app.logger.error(f"[SAP_XEP_TRANG_PDF] Lỗi xử lý: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f"Lỗi trong quá trình sắp xếp trang: {str(e)}"
        }), 500

    finally:
        # Dọn dẹp file tạm nguồn
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except Exception:
                pass


def register_sap_xep_trang_pdf_routes(bp):
    """Đăng ký các route liên quan đến sắp xếp trang PDF."""
    bp.add_url_rule(
        '/api/sap-xep-trang-pdf',
        view_func=api_reorder_pages,
        methods=['POST']
    )
