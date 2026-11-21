"""
=========================================================
DOWNLOAD ROUTES CHO TỆP PDF - DOWNLOAD_ROUTES.PY
Cung cấp endpoint tải về các tệp PDF đã xử lý (nén, gộp, v.v.)
=========================================================
"""

import os
from flask import jsonify, send_file, current_app


def download_pdf_result(task_id, filename):
    """Gửi tệp đã xử lý (nén, gộp, tách .pdf hoặc .zip) về máy tính của người dùng."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')

    # Kiểm tra trong các thư mục converted_office, converted_images, converted_pdf, unlocked, protected, watermarked, numbered_pages, extracted, reordered, deleted_pages, rotated, split, merged, compressed
    candidates = [
        (os.path.join(upload_dir, 'converted_office', f"{task_id}.docx"), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        (os.path.join(upload_dir, 'converted_office', f"{task_id}.xlsx"), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        (os.path.join(upload_dir, 'converted_office', f"{task_id}.pptx"), 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
        (os.path.join(upload_dir, 'converted_images', f"{task_id}.zip"), 'application/zip'),
        (os.path.join(upload_dir, 'converted_pdf', f"{task_id}.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'converted_pdf', f"{task_id}.json"), 'application/json'),
        (os.path.join(upload_dir, 'unlocked', f"{task_id}_unlocked.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'protected', f"{task_id}_protected.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'watermarked', f"{task_id}_watermark.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'numbered_pages', f"{task_id}_numbered.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'extracted', f"{task_id}.zip"), 'application/zip'),
        (os.path.join(upload_dir, 'extracted', f"{task_id}_extracted.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'reordered', f"{task_id}_reordered.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'deleted_pages', f"{task_id}_deleted.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'rotated', f"{task_id}_rotated.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'split', f"{task_id}.zip"), 'application/zip'),
        (os.path.join(upload_dir, 'split', f"{task_id}.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'merged', f"{task_id}_merged.pdf"), 'application/pdf'),
        (os.path.join(upload_dir, 'compressed', f"{task_id}_compressed.pdf"), 'application/pdf'),
    ]

    target_file_path = None
    target_mimetype = 'application/pdf'

    for path, mime in candidates:
        if os.path.exists(path):
            target_file_path = path
            target_mimetype = mime
            break

    if not target_file_path:
        return jsonify({'status': 'error', 'message': 'Tệp không tồn tại hoặc phiên tải đã hết hạn.'}), 404

    # Điều chỉnh mimetype theo đuôi file thực tế nếu cần
    if filename.lower().endswith('.zip'):
        target_mimetype = 'application/zip'
    elif filename.lower().endswith('.docx'):
        target_mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    elif filename.lower().endswith('.xlsx'):
        target_mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    elif filename.lower().endswith('.pptx'):
        target_mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    elif filename.lower().endswith('.json'):
        target_mimetype = 'application/json'

    return send_file(
        target_file_path,
        as_attachment=True,
        download_name=filename,
        mimetype=target_mimetype
    )


def register_download_routes(bp):
    """Đăng ký route tải file PDF vào blueprint."""
    bp.add_url_rule('/download/<task_id>/<path:filename>', view_func=download_pdf_result, methods=['GET'])
