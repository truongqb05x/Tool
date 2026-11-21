"""
=========================================================
VIEW ROUTES CHO CÔNG CỤ HÌNH ẢNH - VIEW_ROUTES.PY
Quản lý giao diện, danh mục và điều hướng cho các công cụ hình ảnh
=========================================================
"""

import os
from flask import render_template, current_app

IMAGE_TOOLS = [
    ('nen-anh', 'Nén ảnh', 'Giảm dung lượng ảnh JPG, PNG, WEBP tối đa mà vẫn giữ nguyên độ nét.', 'fas fa-compress-alt'),
    ('thay-doi-kich-thuoc', 'Thay đổi kích thước ảnh', 'Thu phóng, chỉnh sửa chiều rộng và chiều cao ảnh chính xác theo pixel hoặc tỉ lệ %.', 'fas fa-expand-arrows-alt'),
    ('cat-anh', 'Cắt ảnh', 'Cắt xén hình ảnh trực tuyến theo khung tỉ lệ 1:1, 16:9, 4:3 hoặc tự do.', 'fas fa-crop-alt'),
    ('chuyen-sang-jpg', 'Chuyển đổi sang JPG', 'Chuyển đổi các định dạng PNG, GIF, TIF, PSD, SVG, WEBP sang file JPG nhanh chóng.', 'fas fa-file-image'),
    ('chuyen-tu-jpg', 'Chuyển đổi từ JPG', 'Chuyển đổi ảnh JPG sang PNG, GIF, WEBP hoặc các định dạng đồ họa khác.', 'fas fa-exchange-alt'),
    ('chinh-sua-anh', 'Trình chỉnh sửa ảnh', 'Thêm văn bản, sticker, bộ lọc màu nghệ thuật, hiệu ứng và vẽ lên ảnh online.', 'fas fa-sliders-h'),
    ('nang-cap-anh', 'Nâng cấp chất lượng ảnh', 'Tăng độ phân giải, khử mờ, khử nhiễu và làm sắc nét hình ảnh tự động bằng AI.', 'fas fa-wand-magic-sparkles'),
    ('xoa-phong', 'Xóa phông', 'Tự động tách nền khỏi chủ thể chỉ trong 1 chạm, xuất file PNG trong suốt chất lượng cao.', 'fas fa-magic'),
    ('dong-dau-anh', 'Đóng dấu bản quyền ảnh', 'Chèn Watermark logo hoặc chữ bản quyền lên nhiều bức ảnh để bảo vệ quyền sở hữu.', 'fas fa-stamp'),
    ('tao-anh-che', 'Tạo ảnh chế', 'Tạo meme hài hước vui nhộn nhanh chóng từ các mẫu meme thịnh hành nhất.', 'fas fa-laugh-squint'),
    ('xoay-anh', 'Xoay ảnh', 'Xoay ảnh 90 độ, 180 độ hoặc lật ảnh theo chiều ngang, dọc hàng loạt.', 'fas fa-redo'),
    ('html-sang-anh', 'Chuyển HTML sang ảnh', 'Chụp toàn bộ trang web từ liên kết URL hoặc chuyển đổi mã nguồn HTML thành hình ảnh.', 'fas fa-code'),
    ('lam-mo-mat', 'Làm mờ khuôn mặt', 'Tự động phát hiện khuôn mặt và làm mờ hoặc pixelate để bảo vệ sự riêng tư.', 'fas fa-user-secret'),
]

# Danh mục alias hỗ trợ tương thích ngược với các URL cũ
LEGACY_ALIASES = {
    'ghep-anh': 'cat-anh',
    'xoa-phong-nen': 'xoa-phong',
}


def make_view_func(slug, title, desc, icon):
    """Tạo hàm render view cho từng công cụ hình ảnh."""
    def view_func():
        template_name = f'anh/{slug}.html'
        template_path = os.path.join(current_app.template_folder, 'anh', f'{slug}.html')
        if os.path.exists(template_path):
            return render_template(template_name)
        # Sử dụng template tool-detail nếu chưa có file html riêng biệt
        return render_template(
            'anh/tool-detail.html',
            tool_slug=slug,
            tool_title=title,
            tool_desc=desc,
            tool_icon=icon
        )
    view_func.__name__ = f"image_tool_{slug.replace('-', '_')}"
    return view_func


def register_view_routes(bp):
    """Đăng ký các route giao diện view cho Image blueprint."""
    for slug, title, desc, icon in IMAGE_TOOLS:
        func = make_view_func(slug, title, desc, icon)
        bp.add_url_rule(f'/{slug}', view_func=func, methods=['GET'])
        bp.add_url_rule(f'/{slug}.html', view_func=func, methods=['GET'])

    for legacy_slug, target_slug in LEGACY_ALIASES.items():
        target_info = next((item for item in IMAGE_TOOLS if item[0] == target_slug), None)
        if target_info:
            func = make_view_func(legacy_slug, target_info[1], target_info[2], target_info[3])
            bp.add_url_rule(f'/{legacy_slug}', view_func=func, methods=['GET'])
            bp.add_url_rule(f'/{legacy_slug}.html', view_func=func, methods=['GET'])

    @bp.route('', methods=['GET'])
    @bp.route('/', methods=['GET'])
    @bp.route('/index.html', methods=['GET'])
    def image_index():
        """Trang danh mục tổng hợp toàn bộ công cụ hình ảnh."""
        return render_template('anh/index.html')
