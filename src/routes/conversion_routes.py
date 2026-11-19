from flask import Blueprint, render_template

conversion_bp = Blueprint('conversion', __name__, url_prefix='/chuyen-doi')

@conversion_bp.route('/word-sang-pdf')
@conversion_bp.route('/word-sang-pdf.html')
def word_sang_pdf():
    """Trang chuyển Word sang PDF."""
    return render_template('pdf/nen-pdf.html')

@conversion_bp.route('/excel-sang-pdf')
@conversion_bp.route('/excel-sang-pdf.html')
def excel_sang_pdf():
    """Trang chuyển Excel sang PDF."""
    return render_template('pdf/nen-pdf.html')

@conversion_bp.route('/anh-sang-pdf')
@conversion_bp.route('/anh-sang-pdf.html')
def anh_sang_pdf():
    """Trang chuyển Ảnh sang PDF."""
    return render_template('pdf/nen-pdf.html')
