"""
=========================================================
LOGIC XỬ LÝ ĐỌC THÔNG TIN PDF - DOC_THONG_TIN_PDF.PY
Tiếp nhận file PDF, trích xuất toàn bộ siêu dữ liệu metadata
Hiển thị chi tiết thông tin tài liệu và cho phép tải báo cáo metadata
=========================================================
"""

import os
import uuid
import json
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app
from ...services.pdf import PdfService


def api_get_pdf_info():
    """API tiếp nhận file PDF và trích xuất thông tin siêu dữ liệu metadata."""
    file = request.files.get('file')
    if not file or not file.filename:
        files = request.files.getlist('files')
        if files and len(files) > 0:
            file = files[0]

    if not file or not file.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn 1 tệp tài liệu PDF để đọc thông tin metadata.'
        }), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Định dạng không hợp lệ. Vui lòng chọn tệp PDF (.pdf).'
        }), 400

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename) or 'tai_lieu.pdf'
    base_name = os.path.splitext(safe_name)[0]
    temp_input_path = os.path.join(temp_dir, f"{task_id}_{safe_name}")

    try:
        file.save(temp_input_path)

        # Trích xuất metadata
        result = PdfService.get_pdf_info(temp_input_path)

        # Tạo file báo cáo JSON metadata để người dùng có thể tải về nếu cần
        meta_filename = f"{base_name}_metadata.json"
        meta_output_path = os.path.join(converted_dir, f"{task_id}.json")
        with open(meta_output_path, 'w', encoding='utf-8') as mf:
            json.dump(result.get('metadata', {}), mf, ensure_ascii=False, indent=2)

        # Dọn dẹp file PDF tạm
        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass

        return jsonify({
            'status': 'success',
            'success': True,
            'message': 'Trích xuất siêu dữ liệu PDF thành công!',
            'data': result.get('metadata', {}),
            'download_url': f"/pdf/download/{task_id}/{meta_filename}",
            'download_name': meta_filename,
            'task_id': task_id
        })

    except Exception as e:
        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass
        return jsonify({
            'status': 'error',
            'success': False,
            'message': f"Lỗi khi đọc metadata PDF: {str(e)}"
        }), 500


def register_doc_thong_tin_pdf_routes(bp):
    """Đăng ký route API đọc thông tin PDF vào Blueprint."""
    bp.add_url_rule('/api/doc-thong-tin-pdf', view_func=api_get_pdf_info, methods=['POST'])
