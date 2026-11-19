from flask import Blueprint, render_template

utility_bp = Blueprint('utility', __name__, url_prefix='/tien-ich')

@utility_bp.route('/tao-ma-qr')
@utility_bp.route('/tao-ma-qr.html')
def tao_ma_qr():
    """Trang tạo mã QR trực tuyến."""
    return render_template('tien-ich/tao-ma-qr.html')

@utility_bp.route('/may-tinh-online')
@utility_bp.route('/may-tinh-online.html')
def may_tinh():
    """Trang máy tính online."""
    return render_template('index.html')
