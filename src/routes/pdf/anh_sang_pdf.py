"""
=========================================================
LOGIC XỬ LÝ CHUYỂN ĐỔI ẢNH SANG PDF - ANH_SANG_PDF.PY
Tiếp nhận danh sách các tệp hình ảnh (JPG, PNG, WEBP),
gộp thành một tài liệu PDF hoàn chỉnh theo thứ tự
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


def api_images_to_pdf():
    """API tiếp nhận nhiều file ảnh và gộp lại thành 1 file PDF."""
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        single_file = request.files.get('file')
        if single_file:
            files = [single_file]

    if not files or len(files) == 0:
        return jsonify({
            'status': 'error',
            'success': False,
            'message': 'Vui lòng chọn ít nhất 1 tệp hình ảnh (JPG, PNG, WEBP).'
        }), 400

    page_size = request.form.get('pageSize', 'fit').lower().strip()
    orientation = request.form.get('orientation', 'auto').lower().strip()
    margin = request.form.get('margin', 0)

    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    converted_dir = os.path.join(upload_dir, 'converted_pdf')
    temp_dir = os.path.join(converted_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    task_id = str(uuid.uuid4())
    temp_image_paths = []

    try:
        # Lưu các file ảnh tạm thời
        for i, file in enumerate(files):
            if not file or not file.filename:
                continue
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.bmp']:
                continue
            safe_name = f"{task_id}_{i:03d}_{secure_filename(file.filename)}"
            temp_path = os.path.join(temp_dir, safe_name)
            file.save(temp_path)
            temp_image_paths.append(temp_path)

        if not temp_image_paths:
            return jsonify({
                'status': 'error',
                'success': False,
                'message': 'Không có tệp hình ảnh hợp lệ nào được chọn (Hỗ trợ: JPG, PNG, WEBP, BMP).'
            }), 400

        output_path = os.path.join(converted_dir, f"{task_id}.pdf")
        download_name = f"anh_sang_pdf_{task_id[:8]}.pdf"

        # Gọi service ghép ảnh thành PDF
        result = PdfService.images_to_pdf(
            image_paths=temp_image_paths,
            output_path=output_path,
            page_size=page_size,
            orientation=orientation,
            margin=margin
        )

        # Kiểm tra đăng nhập để lưu file vào tài khoản nếu có
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
                        tool='anh-sang-pdf'
                    )
                    saved_to_account = True
                    user_info = {
                        'id': user.get('id'),
                        'name': user.get('name'),
                        'email': user.get('email')
                    }
            except Exception as user_err:
                current_app.logger.warning(f"Lỗi khi lưu file vào tài khoản: {user_err}")

        download_url = f"/pdf/download/{task_id}/{download_name}"

        return jsonify({
            'status': 'success',
            'success': True,
            'message': f"Đã ghép thành công {result['image_count']} hình ảnh thành tài liệu PDF!",
            'task_id': task_id,
            'download_url': download_url,
            'filename': download_name,
            'image_count': result['image_count'],
            'result_size': result['result_size'],
            'result_size_formatted': result['result_size_formatted'],
            'saved_to_account': saved_to_account,
            'user': user_info
        })

    except ValueError as ve:
        return jsonify({'status': 'error', 'success': False, 'message': str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Lỗi khi chuyển đổi Ảnh sang PDF: {e}", exc_info=True)
        return jsonify({'status': 'error', 'success': False, 'message': f'Lỗi hệ thống khi tạo PDF: {str(e)}'}), 500
    finally:
        # Xóa các file ảnh tạm nguồn
        for p in temp_image_paths:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass


def register_anh_sang_pdf_routes(bp):
    """Đăng ký route API chuyển Ảnh sang PDF vào blueprint."""
    bp.add_url_rule('/api/anh-sang-pdf', view_func=api_images_to_pdf, methods=['POST'])
