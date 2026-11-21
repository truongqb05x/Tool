"""
=========================================================
VIEW ROUTES CHO CÔNG CỤ VĂN BẢN & DANH SÁCH - TEXT_ROUTES.PY
Quản lý giao diện, danh mục và điều hướng cho các công cụ văn bản
=========================================================
"""

import os
from flask import Blueprint, render_template, current_app

text_bp = Blueprint('text', __name__, url_prefix='/van-ban')

# Danh sách 33 công cụ xử lý văn bản (Text)
TEXT_TOOLS = [
    ('dem-tu', 'Đếm từ', 'Đếm tổng số lượng từ chính xác trong đoạn văn bản.', 'fas fa-calculator', 'dem tu dem so tu word count'),
    ('dem-ky-tu', 'Đếm ký tự', 'Đếm tổng số ký tự có hoặc không bao gồm khoảng trắng.', 'fas fa-text-width', 'dem ky tu character count'),
    ('dem-dong', 'Đếm dòng', 'Đếm tổng số dòng văn bản và số dòng chứa nội dung.', 'fas fa-bars', 'dem dong line count so dong'),
    ('dem-cau', 'Đếm câu', 'Phân tích và đếm số câu dựa trên các dấu kết thúc câu.', 'fas fa-align-left', 'dem cau sentence count'),
    ('dem-doan-van', 'Đếm đoạn văn', 'Đếm số đoạn văn bản phân cách bởi dấu xuống dòng.', 'fas fa-paragraph', 'dem doan van paragraph count'),
    ('chuyen-chu-thuong', 'Chuyển chữ thường', 'Chuyển toàn bộ văn bản sang chữ viết thường (lowercase).', 'fas fa-font', 'chuyen chu thuong lowercase to lowercase'),
    ('chuyen-chu-hoa', 'Chuyển chữ hoa', 'Chuyển toàn bộ văn bản sang chữ in hoa (UPPERCASE).', 'fas fa-heading', 'chuyen chu hoa uppercase in hoa'),
    ('viet-hoa-chu-cai-dau', 'Viết hoa chữ cái đầu', 'Viết hoa ký tự đầu tiên của câu hoặc toàn bộ văn bản (Sentence case).', 'fas fa-text-height', 'viet hoa chu cai dau sentence case'),
    ('viet-hoa-dau-moi-tu', 'Viết hoa đầu mỗi từ', 'Viết hoa chữ cái đầu tiên của từng từ trong câu (Title Case).', 'fas fa-spell-check', 'viet hoa dau moi tu title case capitalize'),
    ('loai-bo-khoang-trang-thua', 'Loại bỏ khoảng trắng thừa', 'Xóa các dấu cách thừa ở đầu, cuối và giữa các từ.', 'fas fa-compress', 'loai bo khoang trang thua trim remove extra spaces'),
    ('loai-bo-dong-trong', 'Loại bỏ dòng trống', 'Xóa các dòng trống hoặc khoảng trắng vô nghĩa trong văn bản.', 'fas fa-backspace', 'loai bo dong trong remove empty lines'),
    ('loai-bo-dong-trung-lap', 'Loại bỏ dòng trùng lặp', 'Loại bỏ các dòng bị lặp lại, chỉ giữ lại một dòng duy nhất.', 'fas fa-clone', 'loai bo dong trung lap remove duplicate lines'),
    ('sap-xep-dong-a-z', 'Sắp xếp dòng A-Z', 'Sắp xếp các dòng văn bản theo thứ tự bảng chữ cái từ A đến Z.', 'fas fa-sort-alpha-down', 'sap xep dong a z sort lines az'),
    ('sap-xep-dong-z-a', 'Sắp xếp dòng Z-A', 'Sắp xếp các dòng văn bản theo thứ tự đảo ngược từ Z về A.', 'fas fa-sort-alpha-up-alt', 'sap xep dong z a sort lines za'),
    ('sap-xep-dong-theo-do-dai', 'Sắp xếp dòng theo độ dài', 'Sắp xếp thứ tự các dòng văn bản dựa theo độ dài ký tự ngắn đến dài.', 'fas fa-sort-amount-down-alt', 'sap xep dong theo do dai sort by length'),
    ('dao-nguoc-van-ban', 'Đảo ngược văn bản', 'Đảo ngược toàn bộ trật tự ký tự trong chuỗi văn bản (Reverse text).', 'fas fa-exchange-alt', 'dao nguoc van ban reverse text dao chu'),
    ('dao-nguoc-tung-dong', 'Đảo ngược từng dòng', 'Đảo ngược trật tự các dòng văn bản từ dưới lên trên.', 'fas fa-stream', 'dao nguoc tung dong reverse lines'),
    ('them-tien-to-tung-dong', 'Thêm tiền tố vào từng dòng', 'Thêm chuỗi ký tự hoặc ký hiệu vào đầu mỗi dòng văn bản.', 'fas fa-arrow-circle-right', 'them tien to add prefix dau dong'),
    ('them-hau-to-tung-dong', 'Thêm hậu tố vào từng dòng', 'Thêm chuỗi ký tự hoặc ký hiệu vào cuối mỗi dòng văn bản.', 'fas fa-arrow-circle-left', 'them hau to add suffix cuoi dong'),
    ('danh-so-dong', 'Đánh số dòng', 'Tự động đánh số thứ tự (1, 2, 3...) cho từng dòng văn bản.', 'fas fa-list-ol', 'danh so dong add line numbers'),
    ('xoa-so-thu-tu-dong', 'Xóa số thứ tự dòng', 'Tự động nhận diện và xóa số thứ tự ở đầu các dòng văn bản.', 'fas fa-eraser', 'xoa so thu tu dong remove line numbers'),
    ('tim-va-thay-the', 'Tìm và thay thế', 'Tìm kiếm từ khóa và thay thế nhanh bằng văn bản mới hoặc Regex.', 'fas fa-search', 'tim va thay the find and replace regex'),
    ('trich-xuat-email', 'Trích xuất email', 'Tự động lọc và trích xuất tất cả địa chỉ email trong đoạn văn bản.', 'fas fa-envelope', 'trich xuat email extract email loc mail'),
    ('trich-xuat-so-dien-thoai', 'Trích xuất số điện thoại', 'Tự động trích xuất các số điện thoại liên lạc từ nội dung văn bản.', 'fas fa-phone-alt', 'trich xuat so dien thoai extract phone'),
    ('trich-xuat-url', 'Trích xuất URL', 'Trích xuất toàn bộ liên kết web (http/https/domain) có trong văn bản.', 'fas fa-link', 'trich xuat url extract links'),
    ('trich-xuat-hashtag', 'Trích xuất hashtag', 'Trích xuất các thẻ #hashtag từ bài viết hoặc caption mạng xã hội.', 'fas fa-hashtag', 'trich xuat hashtag extract tags'),
    ('trich-xuat-tu-khoa', 'Trích xuất từ khóa', 'Phân tích tần suất và trích xuất các từ khóa quan trọng trong văn bản.', 'fas fa-key', 'trich xuat tu khoa extract keywords'),
    ('so-sanh-van-ban', 'So sánh văn bản', 'So sánh sự khác nhau (diff) giữa hai đoạn văn bản trực quan.', 'fas fa-columns', 'so sanh van ban text diff compare'),
    ('kiem-tra-van-ban-trung-lap', 'Kiểm tra văn bản trùng lặp', 'Đối chiếu phát hiện mức độ trùng lặp hoặc đạo văn giữa các đoạn văn.', 'fas fa-copy', 'kiem tra van ban trung lap duplicate text check plagiarism'),
    ('tao-van-ban-lorem-ipsum', 'Tạo văn bản Lorem Ipsum', 'Tạo các đoạn văn bản mẫu ngẫu nhiên cho thiết kế và lập trình.', 'fas fa-file-alt', 'tao van ban lorem ipsum dummy text generator'),
    ('chuyen-van-ban-sang-slug', 'Chuyển văn bản sang slug', 'Chuyển tiêu đề tiếng Việt có dấu thành URL thân thiện chuẩn SEO.', 'fas fa-globe', 'chuyen van ban sang slug slugify url generator'),
    ('chuyen-van-ban-sang-markdown', 'Chuyển văn bản sang Markdown', 'Chuyển đổi định dạng văn bản thô hoặc HTML sang cú pháp Markdown.', 'fab fa-markdown', 'chuyen van ban sang markdown text to markdown'),
    ('chuyen-markdown-sang-van-ban-thuan', 'Chuyển Markdown sang văn bản thuần', 'Loại bỏ các cú pháp định dạng Markdown và xuất văn bản thuần Plain Text.', 'fas fa-file-invoice', 'chuyen markdown sang van ban thuan markdown to text'),
]

# Danh sách 18 công cụ xử lý danh sách (List tools)
LIST_TOOLS = [
    ('gop-danh-sach', 'Gộp danh sách', 'Hợp nhất hai hoặc nhiều danh sách thành một danh sách tổng hợp.', 'fas fa-layer-group', 'gop danh sach merge list join list'),
    ('tach-danh-sach', 'Tách danh sách', 'Chia tách một danh sách lớn thành nhiều phần nhỏ theo số lượng hoặc tiêu chí.', 'fas fa-cut', 'tach danh sach split list'),
    ('xoa-phan-tu-trung-lap', 'Xóa phần tử trùng lặp', 'Loại bỏ các mục bị lặp lại trong danh sách, chỉ giữ giá trị duy nhất.', 'fas fa-filter', 'xoa phan tu trung lap remove duplicate list unique'),
    ('sap-xep-danh-sach', 'Sắp xếp danh sách', 'Sắp xếp các phần tử trong danh sách theo thứ tự chữ cái hoặc chữ số.', 'fas fa-sort', 'sap xep danh sach sort list'),
    ('dao-nguoc-danh-sach', 'Đảo ngược danh sách', 'Đảo ngược hoàn toàn thứ tự các phần tử trong danh sách.', 'fas fa-history', 'dao nguoc danh sach reverse list'),
    ('loc-danh-sach', 'Lọc danh sách', 'Lọc các phần tử theo điều kiện độ dài, chữ hoa chữ thường hoặc quy tắc.', 'fas fa-sliders-h', 'loc danh sach filter list'),
    ('loc-dong-chua-tu-khoa', 'Lọc dòng chứa từ khóa', 'Giữ lại các dòng trong danh sách có chứa từ khóa được chỉ định.', 'fas fa-check-circle', 'loc dong chua tu khoa filter lines contain'),
    ('loc-dong-khong-chua-tu-khoa', 'Lọc dòng không chứa từ khóa', 'Loại trừ các dòng trong danh sách có chứa từ khóa không mong muốn.', 'fas fa-times-circle', 'loc dong khong chua tu khoa filter lines not contain'),
    ('so-sanh-hai-danh-sach', 'So sánh hai danh sách', 'Đối chiếu hai danh sách để tìm điểm giống và khác nhau giữa chúng.', 'fas fa-balance-scale', 'so sanh hai danh sach compare two lists diff'),
    ('tim-phan-tu-thieu', 'Tìm phần tử thiếu', 'Tìm các phần tử có trong danh sách A nhưng thiếu trong danh sách B.', 'fas fa-minus-circle', 'tim phan tu thieu missing items diff list'),
    ('tim-phan-tu-chung', 'Tìm phần tử chung', 'Tìm các phần tử giao nhau xuất hiện đồng thời trong cả hai danh sách.', 'fas fa-handshake', 'tim phan tu chung common items list intersection'),
    ('chuyen-danh-sach-thanh-csv', 'Chuyển danh sách thành CSV', 'Định dạng các dòng trong danh sách thành chuỗi bảng dữ liệu CSV.', 'fas fa-file-csv', 'chuyen danh sach thanh csv list to csv'),
    ('chuyen-csv-thanh-danh-sach', 'Chuyển CSV thành danh sách', 'Tách các cột hoặc giá trị trong chuỗi CSV thành các dòng danh sách.', 'fas fa-list', 'chuyen csv thanh danh sach csv to list'),
    ('chuyen-danh-sach-thanh-json', 'Chuyển danh sách thành JSON', 'Chuyển đổi danh sách các dòng văn bản thành mảng dữ liệu JSON Array.', 'fas fa-code', 'chuyen danh sach thanh json list to json array'),
    ('chuyen-json-thanh-danh-sach', 'Chuyển JSON thành danh sách', 'Chuyển đổi mảng JSON Array thành từng dòng văn bản thông thường.', 'fas fa-list-ul', 'chuyen json thanh danh sach json to list array'),
    ('them-dau-phay-vao-danh-sach', 'Thêm dấu phẩy vào danh sách', 'Thêm dấu phẩy (,) vào cuối mỗi dòng để tạo danh sách cách nhau bởi dấu phẩy.', 'fas fa-quote-right', 'them dau phay vao danh sach add comma to list'),
    ('them-dau-cham-phay-vao-danh-sach', 'Thêm dấu chấm phẩy vào danh sách', 'Thêm dấu chấm phẩy (;) vào cuối mỗi dòng cho các câu lệnh code.', 'fas fa-ellipsis-v', 'them dau cham phay vao danh sach add semicolon list'),
    ('them-dau-ngoac-vao-tung-dong', 'Thêm dấu ngoặc vào từng dòng', 'Đặt mỗi dòng trong ngoặc kép (""), ngoặc đơn (\'\') hoặc ngoặc nhọn.', 'fas fa-code-branch', 'them dau ngoac vao tung dong wrap lines quotes brackets'),
]

ALL_TEXT_TOOLS = TEXT_TOOLS + LIST_TOOLS


@text_bp.route('', methods=['GET'])
@text_bp.route('/', methods=['GET'])
@text_bp.route('/index.html', methods=['GET'])
def index():
    """Trang danh mục tất cả công cụ Văn bản & Danh sách."""
    return render_template('van-ban/index.html', text_tools=TEXT_TOOLS, list_tools=LIST_TOOLS)


def make_text_view_func(slug, title, desc, icon):
    """Tạo hàm render view cho từng công cụ văn bản."""
    def view_func():
        template_name = f'van-ban/{slug}.html'
        template_path = os.path.join(current_app.template_folder, 'van-ban', f'{slug}.html')
        if os.path.exists(template_path):
            return render_template(template_name)
        return render_template(
            'van-ban/tool-detail.html',
            tool_slug=slug,
            tool_title=title,
            tool_desc=desc,
            tool_icon=icon
        )
    view_func.__name__ = f"text_tool_{slug.replace('-', '_')}"
    return view_func


for slug, title, desc, icon, _ in ALL_TEXT_TOOLS:
    func = make_text_view_func(slug, title, desc, icon)
    text_bp.add_url_rule(f'/{slug}', view_func=func, methods=['GET'])
    text_bp.add_url_rule(f'/{slug}.html', view_func=func, methods=['GET'])
