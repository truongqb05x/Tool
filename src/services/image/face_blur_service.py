"""
=========================================================
DỊCH VỤ LÀM MỜ KHUÔN MẶT - FACE_BLUR_SERVICE.PY
Tự động nhận diện khuôn mặt bằng OpenCV và làm mờ bảo mật
=========================================================
"""

import os
import cv2
import numpy as np
from .utils import format_size


def blur_faces(
    input_path: str,
    output_path: str,
    mode: str = "blur",
    blur_strength: int = 35
) -> dict:
    """
    Tự động phát hiện khuôn mặt và áp dụng làm mờ (Blur) hoặc Pixelate.
    :param mode: 'blur' (làm mờ Gaussian), 'pixelate' (hạt điểm ảnh)
    :param blur_strength: Độ mạnh làm mờ (15 - 75)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Không tìm thấy file nguồn: {input_path}")

    orig_size = os.path.getsize(input_path)
    if orig_size == 0:
        raise ValueError("File ảnh rỗng (0 bytes).")

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Đọc ảnh qua OpenCV hỗ trợ đường dẫn tiếng Việt an toàn
    img_array = np.fromfile(input_path, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Không thể giải mã file ảnh.")

    h, w = img.shape[:2]

    # Tải mô hình nhận diện khuôn mặt Haar Cascade chuẩn của OpenCV
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    # Chuyển ảnh xám để nhận diện
    if len(img.shape) == 3 and img.shape[2] == 4:
        gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    elif len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    k_size = int(blur_strength or 35)
    if k_size % 2 == 0:
        k_size += 1

    faces_count = len(faces)

    if faces_count > 0:
        for (fx, fy, fw, fh) in faces:
            # Mở rộng vùng mặt thêm một chút để che toàn bộ khuôn mặt
            pad_x = int(fw * 0.1)
            pad_y = int(fh * 0.1)
            x1 = max(0, fx - pad_x)
            y1 = max(0, fy - pad_y)
            x2 = min(w, fx + fw + pad_x)
            y2 = min(h, fy + fh + pad_y)

            sub_face = img[y1:y2, x1:x2]

            if mode == 'pixelate':
                # Pixelate: Thu nhỏ rồi phóng to lại với nội suy Nearest
                pw = max(1, (x2 - x1) // 12)
                ph = max(1, (y2 - y1) // 12)
                temp = cv2.resize(sub_face, (pw, ph), interpolation=cv2.INTER_LINEAR)
                pixelated = cv2.resize(temp, (x2 - x1, y2 - y1), interpolation=cv2.INTER_NEAREST)
                img[y1:y2, x1:x2] = pixelated
            else:
                # Gaussian Blur
                blurred = cv2.GaussianBlur(sub_face, (k_size, k_size), 30)
                img[y1:y2, x1:x2] = blurred

    else:
        # Nếu không tự động tìm thấy mặt, làm mờ vùng trung tâm
        cw, ch = int(w * 0.4), int(h * 0.4)
        x1, y1 = (w - cw) // 2, (h - ch) // 2
        sub_area = img[y1:y1+ch, x1:x1+cw]
        blurred = cv2.GaussianBlur(sub_area, (k_size, k_size), 30)
        img[y1:y1+ch, x1:x1+cw] = blurred

    # Lưu kết quả an toàn với đường dẫn tiếng Việt
    ext = os.path.splitext(output_path)[1].lower()
    is_success, buffer = cv2.imencode(ext if ext else '.jpg', img)
    if is_success:
        with open(output_path, 'wb') as f:
            f.write(buffer)

    result_size = os.path.getsize(output_path)
    return {
        "status": "success",
        "faces_detected": faces_count,
        "mode": mode,
        "width": w,
        "height": h,
        "orig_size": orig_size,
        "orig_size_formatted": format_size(orig_size),
        "result_size": result_size,
        "result_size_formatted": format_size(result_size),
        "output_path": output_path
    }
