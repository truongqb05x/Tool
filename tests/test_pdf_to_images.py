import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
import zipfile
from src.services.pdf.convert_service import pdf_to_images

def test_pdf_to_images_flow():
    test_dir = "tests/test_data"
    os.makedirs(test_dir, exist_ok=True)
    pdf_path = os.path.join(test_dir, "multi_page.pdf")
    zip_path = os.path.join(test_dir, "output_images.zip")

    # 1. Tạo PDF 3 trang
    doc = fitz.open()
    for i in range(1, 4):
        page = doc.new_page()
        page.insert_text((100, 100), f"Page {i} Sample Content", fontsize=20)
    doc.save(pdf_path)
    doc.close()

    # 2. Xuất toàn bộ 3 trang sang ảnh JPG
    res = pdf_to_images(pdf_path, zip_path, img_format="jpg", dpi=150)
    assert res["status"] == "success"
    assert res["exported_images"] == 3
    assert res["format"] == "JPG"
    assert os.path.exists(zip_path)

    # 3. Kiểm tra file zip
    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = zf.namelist()
        assert len(namelist) == 3, f"Phải có 3 ảnh trong zip, got {len(namelist)}"
        assert any("trang_001.jpg" in name for name in namelist)
        assert any("trang_002.jpg" in name for name in namelist)
        assert any("trang_003.jpg" in name for name in namelist)

    # 4. Xuất khoảng trang cụ thể '1, 3' dạng PNG
    zip_png_path = os.path.join(test_dir, "output_png.zip")
    res_png = pdf_to_images(pdf_path, zip_png_path, img_format="png", dpi=300, page_range_str="1, 3")
    assert res_png["exported_images"] == 2
    assert res_png["format"] == "PNG"

    with zipfile.ZipFile(zip_png_path, "r") as zf:
        namelist = zf.namelist()
        assert len(namelist) == 2
        assert any("trang_001.png" in name for name in namelist)
        assert any("trang_003.png" in name for name in namelist)

    print("TEST PDF TO IMAGES PASSED 100%!")

if __name__ == "__main__":
    test_pdf_to_images_flow()
