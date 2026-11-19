from flask import Blueprint, render_template

image_bp = Blueprint('image', __name__, url_prefix='/anh')

@image_bp.route('/cat-anh')
@image_bp.route('/cat-anh.html')
def cat_anh():
    """Trang cắt & xoay hình ảnh trực tuyến."""
    return render_template('anh/cat-anh.html')

@image_bp.route('/ghep-anh')
@image_bp.route('/ghep-anh.html')
def ghep_anh():
    """Trang ghép nhiều ảnh."""
    return render_template('anh/cat-anh.html')

@image_bp.route('/xoa-phong-nen')
@image_bp.route('/xoa-phong-nen.html')
def xoa_phong_nen():
    """Trang tách nền ảnh."""
    return render_template('anh/cat-anh.html')
