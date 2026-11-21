"""
=========================================================
VIEW ROUTES CHO CÔNG CỤ TXT - TXT_ROUTES.PY
Quản lý giao diện, danh mục và điều hướng cho các công cụ file TXT
=========================================================
"""

import os
from flask import Blueprint, render_template, current_app

txt_bp = Blueprint('txt', __name__, url_prefix='/txt')

TXT_TOOLS = [
    ('gop-file-txt', 'Gộp file txt', 'Nối nhiều file text .txt thành một file duy nhất với tùy chọn ngăn cách.', 'fas fa-object-group', 'gop file txt merge txt files join txt'),
    ('tach-file-txt', 'Tách file txt', 'Chia tách file txt dung lượng lớn theo số dòng hoặc dung lượng MB.', 'fas fa-cut', 'tach file txt split txt file'),
    ('nen-file-txt', 'Nén file txt (.zip)', 'Nén một hoặc nhiều file văn bản txt thành file nén zip tiết kiệm bộ nhớ.', 'fas fa-file-archive', 'nen file txt zip txt compress text'),
    ('txt-sang-pdf', 'Chuyển đổi txt sang pdf', 'Chuyển đổi nội dung file TXT thành tài liệu PDF chuẩn định dạng.', 'fas fa-file-pdf', 'chuyen doi txt sang pdf txt to pdf convert'),
    ('pdf-sang-txt', 'Chuyển đổi pdf sang txt', 'Trích xuất toàn bộ văn bản thuần từ tài liệu PDF ra file TXT.', 'fas fa-file-alt', 'chuyen doi pdf sang txt pdf to txt extract text'),
    ('txt-sang-docx', 'Chuyển đổi txt sang docx', 'Chuyển đổi văn bản TXT sang tài liệu Microsoft Word (.docx).', 'fas fa-file-word', 'chuyen doi txt sang docx txt to word docx'),
    ('docx-sang-txt', 'Chuyển đổi docx sang txt', 'Xuất nội dung từ tài liệu Word (.docx) sang file văn bản thuần TXT.', 'fas fa-file-alt', 'chuyen doi docx sang txt word to txt'),
    ('txt-sang-html', 'Chuyển đổi txt sang html', 'Định dạng văn bản TXT thành mã HTML hoàn chỉnh với các thẻ p, br.', 'fas fa-file-code', 'chuyen doi txt sang html txt to html'),
    ('html-sang-txt', 'Chuyển đổi html sang txt', 'Bóc tách thẻ mã HTML giữ lại nội dung văn bản thuần túy.', 'fas fa-file-alt', 'chuyen doi html sang txt html to txt strip html'),
    ('txt-sang-csv', 'Chuyển đổi txt sang csv', 'Chuyển file văn bản phân cách theo khoảng trắng/tab sang bảng tính CSV.', 'fas fa-file-csv', 'chuyen doi txt sang csv txt to csv convert'),
    ('csv-sang-txt', 'Chuyển đổi csv sang txt', 'Chuyển dữ liệu từ bảng tính CSV sang file văn bản text phẳng.', 'fas fa-file-alt', 'chuyen doi csv sang txt csv to txt'),
    ('ma-hoa-file-txt', 'Mã hóa file txt', 'Bảo vệ nội dung file TXT bằng thuật toán mã hóa mật khẩu an toàn.', 'fas fa-lock', 'ma hoa file txt encrypt txt file password protect'),
    ('giai-ma-file-txt', 'Giải mã file txt', 'Mở khóa và phục hồi nội dung file TXT đã mã hóa với mật khẩu chính xác.', 'fas fa-unlock-alt', 'giai ma file txt decrypt txt file decode'),
    ('sua-loi-encoding-txt', 'Sửa lỗi encoding txt', 'Tự động phát hiện và khắc phục lỗi font chữ tiếng Việt, ký tự lạ trong file txt.', 'fas fa-tools', 'sua loi encoding txt fix encoding charset utf8 font'),
    ('utf-8-sang-ansi', 'Chuyển đổi UTF-8 sang ANSI', 'Chuyển bảng mã từ UTF-8 quốc tế sang ANSI tương thích phần mềm cũ.', 'fas fa-exchange-alt', 'chuyen doi utf 8 sang ansi utf8 to ansi encoding'),
    ('ansi-sang-utf-8', 'Chuyển đổi ANSI sang UTF-8', 'Chuyển bảng mã ANSI sang chuẩn UTF-8 hỗ trợ đầy đủ tiếng Việt Unicode.', 'fas fa-sync-alt', 'chuyen doi ansi sang utf 8 ansi to utf8 unicode'),
    ('utf-8-sang-utf-8-bom', 'Chuyển đổi UTF-8 sang UTF-8 BOM', 'Thêm hoặc sửa dấu nhận dạng BOM (Byte Order Mark) cho file UTF-8.', 'fas fa-file-signature', 'chuyen doi utf 8 sang utf 8 bom add bom byte order mark'),
    ('xoa-noi-dung-file-txt', 'Xóa nội dung file txt', 'Làm trống toàn bộ nội dung trong file TXT nhanh chóng và an toàn.', 'fas fa-eraser', 'xoa noi dung file txt clear txt file empty text'),
    ('doi-ten-hang-loat-file-txt', 'Đổi tên hàng loạt file txt', 'Đổi tên nhiều file txt cùng lúc theo mẫu, thêm tiền tố hoặc số thứ tự.', 'fas fa-edit', 'doi ten hang loat file txt batch rename txt files'),
]


@txt_bp.route('', methods=['GET'])
@txt_bp.route('/', methods=['GET'])
@txt_bp.route('/index.html', methods=['GET'])
def index():
    """Trang danh mục tất cả công cụ File TXT."""
    return render_template('txt/index.html', txt_tools=TXT_TOOLS)


def make_txt_view_func(slug, title, desc, icon):
    """Tạo hàm render view cho từng công cụ TXT."""
    def view_func():
        template_name = f'txt/{slug}.html'
        template_path = os.path.join(current_app.template_folder, 'txt', f'{slug}.html')
        if os.path.exists(template_path):
            return render_template(template_name)
        return render_template(
            'txt/tool-detail.html',
            tool_slug=slug,
            tool_title=title,
            tool_desc=desc,
            tool_icon=icon
        )
    view_func.__name__ = f"txt_tool_{slug.replace('-', '_')}"
    return view_func


for slug, title, desc, icon, _ in TXT_TOOLS:
    func = make_txt_view_func(slug, title, desc, icon)
    txt_bp.add_url_rule(f'/{slug}', view_func=func, methods=['GET'])
    txt_bp.add_url_rule(f'/{slug}.html', view_func=func, methods=['GET'])
