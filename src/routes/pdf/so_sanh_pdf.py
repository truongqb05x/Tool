"""
=========================================================
LOGIC XỬ LÝ SO SÁNH PDF - SO_SANH_PDF.PY
Tiếp nhận 2 file PDF (Bản gốc và Bản mới), so sánh văn bản từng trang
Xuất báo cáo PDF chi tiết các điểm thêm mới, xóa bỏ và tỷ lệ tương đồng
=========================================================
"""

import os
import uuid
import shutil
from werkzeug.utils import secure_filename
from flask import request, jsonify, current_app, session
from ...services.pdf import PdfService
from ...services.user_service import get_user_by_id
from ...services.user_file_service import save_user_file


def api_compare_pdf():
    """API tiếp nhận 2 file PDF để so sánh khác biệt."""
    # Lấy file 1 và file 2 từ form
    file1 = request.files.get('file1') or request.files.get('file_a')
    file2 = request.files.get('file2') or request.files.get('file_b')

    # Nếu gửi qua mảng 'files'
    if not file1 or not file2:
        files = request.files.getlist('files')
        if files and len(files) >= 2:
            file1 = files[0]
            file2 = files[1]

    if not file1 or not file1.filename or not file2 or not file2.filename:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn đủ 2 tệp PDF (Bản gốc và Bản đối chiếu) để thực hiện so sánh.'
        }), 400

    if not file1.filename.lower().endswith('.pdf') or not file2.filename.lower().endswith('.pdf'):
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Cả hai tệp tải lên phải có định dạng PDF (.pdf).'
        }), 400

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    name1 = secure_filename(file1.filename) or 'ban_goc.pdf'
    name2 = secure_filename(file2.filename) or 'ban_moi.pdf'
    download_name = f"Bao_cao_so_sanh_{task_id[:8]}.pdf"

    temp1_path = os.path.join(temp_dir, f"{task_id}_1_{name1}")
    temp2_path = os.path.join(temp_dir, f"{task_id}_2_{name2}")
    output_path = os.path.join(converted_dir, f"{task_id}.pdf")

    try:
        file1.save(temp1_path)
        file2.save(temp2_path)

        # Tiến hành so sánh 2 file
        result = PdfService.compare_pdfs(
            file1_path=temp1_path,
            file2_path=temp2_path,
            output_path=output_path
        )

        # Lưu file vào tài khoản nếu đã đăng nhập
        user_id = session.get('user_id')
        if not user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                user_id = auth_header.split(' ')[1]

        saved_to_account = False
        user_info = None

        if user_id:
            try:
                user = get_user_by_id(user_id)
                if user:
                    user_folder = os.path.join(upload_dir, 'users', str(user_id), 'pdf')
                    os.makedirs(user_folder, exist_ok=True)
                    user_dest_path = os.path.join(user_folder, f"{task_id}_{download_name}")
                    shutil.copy2(output_path, user_dest_path)

                    save_user_file(
                        user_id=user_id,
                        file_name=download_name,
                        file_path=user_dest_path,
                        file_type='application/pdf',
                        file_size=result.get('result_size', 0),
                        category='pdf',
                        tool='so-sanh-pdf'
                    )
                    saved_to_account = True
                    user_info = {
                        'id': user.get('id'),
                        'name': user.get('name'),
                        'email': user.get('email')
                    }
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        # Dọn dẹp file tạm
        for p in (temp1_path, temp2_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass

        return jsonify({
            'status': 'success',
            'success': True,
            'message': f"Đã so sánh xong! Tìm thấy {result.get('differences_found', 0)} điểm khác biệt. Tỷ lệ tương đồng {result.get('similarity_ratio', 100)}%.",
            'download_url': f"/pdf/download/{task_id}/{download_name}",
            'download_name': download_name,
            'task_id': task_id,
            'data': result,
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except Exception as e:
        for p in (temp1_path, temp2_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
        return jsonify({
            'status': 'error',
            'success': False,
            'message': f"Lỗi trong quá trình so sánh PDF: {str(e)}"
        }), 500


def register_so_sanh_pdf_routes(bp):
    """Đăng ký route API so sánh PDF vào Blueprint."""
    bp.add_url_rule('/api/so-sanh-pdf', view_func=api_compare_pdf, methods=['POST'])
