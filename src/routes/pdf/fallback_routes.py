"""
=========================================================
FALLBACK ROUTES CHO CÁC API PDF - FALLBACK_ROUTES.PY
Điều hướng và phản hồi placeholder cho các công cụ PDF đang phát triển
=========================================================
"""

from flask import jsonify
from .view_routes import PDF_TOOLS
from .nen_pdf import api_compress_pdf
from .gop_pdf import api_merge_pdf


def handle_pdf_api(action):
    """
    Điểm tiếp nhận xử lý file PDF cho các API action:
    Nếu là 'nen-pdf' hoặc 'gop-pdf' thì chuyển tiếp trực tiếp vào logic xử lý thật.
    """
    if action == 'nen-pdf':
        return api_compress_pdf()
    if action == 'gop-pdf':
        return api_merge_pdf()

    valid_actions = {slug for slug, _ in PDF_TOOLS}
    if action not in valid_actions:
        return jsonify({'status': 'error', 'message': f'Hành động {action} không hợp lệ.'}), 400

    return jsonify({
        'status': 'success',
        'message': f'Tính năng {action} đã tiếp nhận yêu cầu thành công (backend placeholder).',
        'download_url': None
    })


def register_fallback_routes(bp):
    """Đăng ký route xử lý API chung vào blueprint."""
    bp.add_url_rule('/api/<action>', view_func=handle_pdf_api, methods=['POST'])
