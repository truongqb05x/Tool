import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
from PIL import Image
from src.services.pdf.convert_service import images_to_pdf

def test_images_to_pdf_flow():
    test_dir = "tests/test_data"
    os.makedirs(test_dir, exist_ok=True)
    img1_path = os.path.join(test_dir, "test1.png")
    img2_path = os.path.join(test_dir, "test2.jpg")
    out_pdf_path = os.path.join(test_dir, "output_from_images.pdf")
    out_a4_pdf_path = os.path.join(test_dir, "output_a4.pdf")

    # 1. Tạo 2 ảnh mẫu
    im1 = Image.new("RGB", (400, 300), color="blue")
    im1.save(img1_path, "PNG")

    im2 = Image.new("RGB", (500, 700), color="red")
    im2.save(img2_path, "JPEG")

    # 2. Test chuyển khổ fit
    res1 = images_to_pdf([img1_path, img2_path], out_pdf_path, page_size="fit")
    assert res1["status"] == "success"
    assert res1["image_count"] == 2
    assert os.path.exists(out_pdf_path)

    doc1 = fitz.open(out_pdf_path)
    assert len(doc1) == 2, f"Phải có 2 trang PDF, got {len(doc1)}"
    doc1.close()

    # 3. Test chuyển khổ A4 + lề 10
    res2 = images_to_pdf([img1_path, img2_path], out_a4_pdf_path, page_size="a4", orientation="portrait", margin=10)
    assert res2["status"] == "success"
    assert res2["image_count"] == 2
    assert os.path.exists(out_a4_pdf_path)

    doc2 = fitz.open(out_a4_pdf_path)
    assert len(doc2) == 2
    # Khổ A4 đứng xấp xỉ 595 x 842
    p = doc2[0]
    assert abs(p.rect.width - 595.0) < 2.0
    assert abs(p.rect.height - 842.0) < 2.0
    doc2.close()

    print("TEST IMAGES TO PDF PASSED 100%!")

if __name__ == "__main__":
    test_images_to_pdf_flow()
