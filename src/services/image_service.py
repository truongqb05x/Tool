"""
Dịch vụ xử lý hình ảnh (Image Service)
Sẵn sàng để tích hợp thư viện Pillow (PIL) hoặc OpenCV / rembg.
"""

class ImageService:
    @staticmethod
    def crop_and_rotate(input_path: str, output_path: str, crop_box: tuple = None, angle: int = 0) -> dict:
        """Cắt ảnh theo vùng chọn và xoay góc ảnh."""
        # TODO: Điền logic xử lý ảnh qua Pillow (PIL)
        return {
            'status': 'success',
            'output_path': output_path
        }

    @staticmethod
    def remove_background(input_path: str, output_path: str) -> dict:
        """Tự động tách nền hình ảnh."""
        # TODO: Điền logic tách nền qua rembg
        return {
            'status': 'success',
            'output_path': output_path
        }
