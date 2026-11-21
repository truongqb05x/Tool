"""
=========================================================
DỊCH VỤ XÓA PHÔNG TÁCH NỀN ẢNH - BG_REMOVE_SERVICE.PY
Tự động tách chủ thể và xuất file PNG nền trong suốt
=========================================================
"""

import os
import cv2
import numpy as np
from PIL import Image
from .utils import open_image_safe, format_size


def remove_background(
    input_path: str,
    output_path: str
) -> dict:
    """
    Tách nền tự động và xuất ảnh PNG với kênh alpha trong suốt.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    success_rembg = False

    # 1. Thử dùng thư viện rembg nếu có
    try:
        from rembg import remove
        with open(input_path, 'rb') as fi:
            input_bytes = fi.read()
        output_bytes = remove(input_bytes)
        with open(output_path, 'wb') as fo:
            fo.write(output_bytes)
        success_rembg = os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception:
        success_rembg = False

    # 2. Cơ chế dự phòng bằng OpenCV GrabCut
    if not success_rembg:
        img_array = np.fromfile(input_path, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Không thể giải mã file ảnh.")

        h, w = img.shape[:2]

        # Khởi tạo mặt nạ và mô hình GrabCut
        mask = np.zeros((h, w), np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)

        # Định nghĩa hình chữ nhật vùng quan tâm (ROI) trừ viền ngoài 5%
        margin_x = int(w * 0.05)
        margin_y = int(h * 0.05)
        rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)

        # Chạy GrabCut 3 vòng lặp
        cv2.grabCut(img, mask, rect, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_RECT)

        # Mặt nạ tiền cảnh (chủ thể)
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

        # Ghép kênh Alpha để tạo ảnh trong suốt
        b, g, r = cv2.split(img)
        alpha = (mask2 * 255).astype(np.uint8)
        rgba = cv2.merge([b, g, r, alpha])

        # Đảm bảo đuôi là .png
        if not output_path.lower().endswith('.png'):
            output_path = os.path.splitext(output_path)[0] + '.png'

        is_success, buffer = cv2.imencode('.png', rgba)
        if is_success:
            with open(output_path, 'wb') as f:
                f.write(buffer)

    result_size = os.path.getsize(output_path)
    with Image.open(output_path) as res_img:
        rw, rh = res_img.size

    return {
        "status": "success",
        "format": "PNG",
        "width": rw,
        "height": rh,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
