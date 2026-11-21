"""
=========================================================
LOGIC XỬ LÝ GỘP PDF - GOP_PDF.PY
Tiếp nhận danh sách file, sắp xếp theo thứ tự, xoay trang và ghép nối
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


def api_merge_pdf():
    """
    Tiếp nhận danh sách các file PDF từ giao diện:
    - Nhận thứ tự các file đã kéo thả và góc xoay tương ứng từng file.
    - Gọi PdfService.merge_pdfs để ghép nối và xoay trang thực tế bằng PyMuPDF.
    - Trả về thông số kết quả (số file, tổng số trang, dung lượng) và link download.
    """
    uploaded_files = request.files.getlist('files')
    if not uploaded_files or len(uploaded_files) < 2:
        return jsonify({'status': 'error', 'message': 'Vui lòng chọn từ 2 file PDF trở lên để thực hiện ghép nối.'}), 400

    # Lấy góc xoay từng file (nếu có)
    rotations_raw = request.form.get('rotations')
    rotations = []
    if rotations_raw:
        try:
            rotations = json.loads(rotations_raw)
        except Exception:
            rotations = []

    # Tên file đầu ra người dùng yêu cầu
    output_name = request.form.get('output_name', 'tailieu_da_gop.pdf').strip()
    if not output_name:
        output_name = 'tailieu_da_gop.pdf'
    if not output_name.lower().endswith('.pdf'):
        output_name += '.pdf'

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    merged_dir = os.path.join(upload_dir, 'merged')
    temp_dir = os.path.join(merged_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    temp_input_paths = []
    file_configs = []
    output_path = os.path.join(merged_dir, f"{task_id}_merged.pdf")

    try:
        for idx, file in enumerate(uploaded_files):
            if not file or not file.filename.lower().endswith('.pdf'):
                return jsonify({'status': 'error', 'message': f"Tệp thứ {idx + 1} không đúng định dạng PDF."}), 400

            safe_name = secure_filename(file.filename) or 'file.pdf'
            temp_path = os.path.join(temp_dir, f"{task_id}_{idx}_{safe_name}")
            file.save(temp_path)
            temp_input_paths.append(temp_path)

            rot = 0
            if idx < len(rotations):
                try:
                    rot = int(rotations[idx])
                except (ValueError, TypeError):
                    rot = 0

            file_configs.append({
                'path': temp_path,
                'rotation': rot
            })

        # Thực thi ghép nối và xoay bằng PyMuPDF
        result = PdfService.merge_pdfs(file_configs, output_path)

        # Kiểm tra xem người dùng đã đăng nhập chưa
        user_id = session.get('user_id')
        if not user_id:
            auth_id = request.headers.get('X-User-Id') or request.form.get('user_id')
            if auth_id and str(auth_id).isdigit():
                user_id = int(auth_id)

        user = get_user_by_id(user_id) if user_id else None

        saved_in_account = False
        user_file_id = None
        download_url = f"/pdf/download/{task_id}/{output_name}"

        # NẾU ĐÃ ĐĂNG NHẬP: Tự động lưu file vào kho lưu trữ tài khoản của người dùng
        if user and user.is_active:
            user_storage_dir = os.path.join(upload_dir, 'users', str(user.id))
            os.makedirs(user_storage_dir, exist_ok=True)
            user_file_dest = os.path.join(user_storage_dir, f"{task_id}_{output_name}")
            shutil.copy2(output_path, user_file_dest)

            user_file = save_user_file(
                user_id=user.id,
                original_name=f"{len(uploaded_files)} files ({uploaded_files[0].filename}...)",
                file_name=output_name,
                file_path=user_file_dest,
                file_size=result['merged_size'],
                file_type='pdf',
                tool_slug='gop-pdf',
                tool_title='Gộp PDF',
                meta_dict={
                    'total_files': result['merged_count'],
                    'total_pages': result['total_pages'],
                    'file_size': result['merged_size'],
                    'file_size_formatted': result['merged_size_formatted']
                }
            )
            saved_in_account = True
            user_file_id = user_file.id
            download_url = f"/api/user/files/{user_file.id}/download"

        return jsonify({
            'status': 'success',
            'message': 'Gộp các file PDF thành công!',
            'data': {
                'task_id': task_id,
                'download_name': output_name,
                'total_files': result['merged_count'],
                'total_pages': result['total_pages'],
                'merged_size': result['merged_size'],
                'merged_size_formatted': result['merged_size_formatted'],
                'download_url': download_url,
                'saved_in_account': saved_in_account,
                'user_file_id': user_file_id
            }
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Lỗi trong quá trình gộp file PDF: {str(e)}'}), 500
    finally:
        # Dọn dẹp các file tạm đã tải lên
        for p in temp_input_paths:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass


def register_gop_pdf_routes(bp):
    """Đăng ký route gộp PDF vào blueprint."""
    bp.add_url_rule('/api/gop-pdf', view_func=api_merge_pdf, methods=['POST'])
