"""
=========================================================
VIEW ROUTES CHO CÔNG CỤ DEVELOPER - DEVELOPER_ROUTES.PY
Quản lý giao diện, danh mục và điều hướng cho các công cụ Developer
=========================================================
"""

import os
from flask import Blueprint, render_template, current_app

developer_bp = Blueprint('developer', __name__, url_prefix='/developer')

DEVELOPER_TOOLS = [
    ('json-formatter', 'JSON Formatter', 'Định dạng, làm đẹp và căn lề mã JSON (Prettify) trực quan, chuẩn cú pháp.', 'fas fa-indent', 'json formatter beautify json lam dep json format'),
    ('json-minifier', 'JSON Minifier', 'Nén mã JSON, loại bỏ dấu cách và xuống dòng để tối ưu kích thước.', 'fas fa-compress-arrows-alt', 'json minifier nen json compact json'),
    ('json-validator', 'JSON Validator', 'Kiểm tra cú pháp JSON, phát hiện chi tiết vị trí lỗi cú pháp.', 'fas fa-check-double', 'json validator validate check error kiem tra json'),
    ('json-to-txt', 'JSON to TXT', 'Chuyển đổi dữ liệu JSON thành văn bản thô dễ đọc hoặc tệp text phẳng.', 'fas fa-file-alt', 'json to txt chuyen json sang text flat'),
    ('xml-formatter', 'XML Formatter', 'Tự động căn lề và định dạng cấu trúc cây dữ liệu mã XML rõ ràng.', 'fas fa-code', 'xml formatter beautify xml format xml'),
    ('xml-minifier', 'XML Minifier', 'Thu nhỏ file XML bằng cách xóa bỏ khoảng trống và dòng thừa.', 'fas fa-compress', 'xml minifier nen xml compact xml'),
    ('html-formatter', 'HTML Formatter', 'Định dạng, thụt dòng mã nguồn HTML chuẩn W3C đẹp mắt.', 'fab fa-html5', 'html formatter beautify html format html indent'),
    ('html-minifier', 'HTML Minifier', 'Nén mã HTML tối ưu hóa tốc độ tải trang web cho lập trình viên.', 'fas fa-compress-alt', 'html minifier nen html compact web'),
    ('css-formatter', 'CSS Formatter', 'Sắp xếp và định dạng các bộ chọn, thuộc tính CSS theo quy chuẩn.', 'fab fa-css3-alt', 'css formatter beautify css format style'),
    ('css-minifier', 'CSS Minifier', 'Giảm dung lượng file style CSS bằng cách nén cú pháp tối đa.', 'fas fa-file-code', 'css minifier nen css minify style'),
    ('javascript-formatter', 'JavaScript Formatter', 'Làm đẹp mã nguồn JS (Beautify JavaScript) với thụt dòng chuẩn.', 'fab fa-js-square', 'javascript formatter js beautify js format code'),
    ('javascript-minifier', 'JavaScript Minifier', 'Thu nhỏ mã JavaScript để tối ưu dung lượng và bảo mật code.', 'fas fa-file-contract', 'javascript minifier nen js minify js uglify'),
    ('base64-encode', 'Base64 Encode', 'Mã hóa chuỗi văn bản hoặc dữ liệu nhị phân sang định dạng Base64.', 'fas fa-lock', 'base64 encode ma hoa base64 text to base64'),
    ('base64-decode', 'Base64 Decode', 'Giải mã chuỗi Base64 ngược trở lại văn bản gốc chuẩn xác.', 'fas fa-unlock', 'base64 decode giai ma base64 base64 to text'),
    ('url-encode', 'URL Encode', 'Mã hóa URL (Percent-encoding) để truyền tham số an toàn trên web.', 'fas fa-link', 'url encode percent encoding ma hoa link'),
    ('url-decode', 'URL Decode', 'Giải mã các ký tự mã hóa %20, %2F trên liên kết URL về văn bản đọc được.', 'fas fa-unlink', 'url decode giai ma link url decode percent'),
    ('unicode-encode', 'Unicode Encode', 'Chuyển đổi các ký tự Unicode sang định dạng mã escape (\\uXXXX).', 'fas fa-font', 'unicode encode ma hoa unicode escape uxxxx'),
    ('unicode-decode', 'Unicode Decode', 'Chuyển đổi chuỗi mã escape Unicode ngược lại thành chữ ký tự hiển thị.', 'fas fa-language', 'unicode decode giai ma unicode uxxxx to text'),
    ('escape-text', 'Escape Text', 'Thoát ký tự đặc biệt cho chuỗi HTML, SQL, regex tránh xung đột code.', 'fas fa-shield-alt', 'escape text thoat ky tu html escape sql escape'),
    ('unescape-text', 'Unescape Text', 'Phục hồi chuỗi văn bản đã bị escape về định dạng hiển thị nguyên bản.', 'fas fa-shield-virus', 'unescape text giai ma escape unescape html'),
    ('binary-to-text', 'Binary to Text', 'Chuyển đổi chuỗi mã nhị phân 0 và 1 (Binary) thành văn bản chữ.', 'fas fa-calculator', 'binary to text nhi phan sang chu binary converter'),
    ('hex-to-text', 'Hex to Text', 'Chuyển đổi mã thập lục phân (Hexadecimal) sang văn bản ASCII/Unicode.', 'fas fa-hashtag', 'hex to text thap luc phan sang chu hex string'),
    ('text-to-binary', 'Text to Binary', 'Chuyển đổi văn bản thông thường sang chuỗi số nhị phân 0-1.', 'fas fa-binary', 'text to binary chu sang nhi phan convert binary'),
    ('text-to-hex', 'Text to Hex', 'Chuyển đổi văn bản chuỗi chữ sang mã thập lục phân Hex.', 'fas fa-th-large', 'text to hex chu sang hex hexadecimal string'),
    ('text-to-qr-code', 'Text to QR Code', 'Tạo mã QR Code từ chuỗi văn bản, đoạn code hoặc dữ liệu tùy chỉnh.', 'fas fa-qrcode', 'text to qr code tao ma qr van ban code qr generator'),
]


@developer_bp.route('', methods=['GET'])
@developer_bp.route('/', methods=['GET'])
@developer_bp.route('/index.html', methods=['GET'])
def index():
    """Trang danh mục tất cả công cụ dành cho Developer."""
    return render_template('developer/index.html', developer_tools=DEVELOPER_TOOLS)


def make_dev_view_func(slug, title, desc, icon):
    """Tạo hàm render view cho từng công cụ Developer."""
    def view_func():
        template_name = f'developer/{slug}.html'
        template_path = os.path.join(current_app.template_folder, 'developer', f'{slug}.html')
        if os.path.exists(template_path):
            return render_template(template_name)
        return render_template(
            'developer/tool-detail.html',
            tool_slug=slug,
            tool_title=title,
            tool_desc=desc,
            tool_icon=icon
        )
    view_func.__name__ = f"dev_tool_{slug.replace('-', '_')}"
    return view_func


for slug, title, desc, icon, _ in DEVELOPER_TOOLS:
    func = make_dev_view_func(slug, title, desc, icon)
    developer_bp.add_url_rule(f'/{slug}', view_func=func, methods=['GET'])
    developer_bp.add_url_rule(f'/{slug}.html', view_func=func, methods=['GET'])
