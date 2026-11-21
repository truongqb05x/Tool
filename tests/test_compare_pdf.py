import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
from src.services.pdf.advanced_service import compare_pdfs

def test_compare_pdf_flow():
    file1 = "tests/test_comp_v1.pdf"
    file2 = "tests/test_comp_v2.pdf"
    rep_pdf = "tests/test_comp_report.pdf"

    try:
        # Tạo PDF v1
        doc1 = fitz.open()
        p1 = doc1.new_page(width=500, height=700)
        p1.insert_text((50, 100), "Dieu 1: Pham vi cong viec va thuc hien.\nDieu 2: Gia tri hop dong la 100 trieu VND.\nDieu 3: Thoi han thanh toan trong 30 ngay.")
        doc1.save(file1)
        doc1.close()

        # Tạo PDF v2 (thay đổi giá trị hợp đồng và thêm điều 4)
        doc2 = fitz.open()
        p2 = doc2.new_page(width=500, height=700)
        p2.insert_text((50, 100), "Dieu 1: Pham vi cong viec va thuc hien.\nDieu 2: Gia tri hop dong la 150 trieu VND.\nDieu 3: Thoi han thanh toan trong 15 ngay.\nDieu 4: Cam ket bao mat thong tin nghiem ngat.")
        doc2.save(file2)
        doc2.close()

        res = compare_pdfs(file1, file2, rep_pdf)
        assert res["status"] == "success"
        assert res["differences_found"] > 0
        assert os.path.exists(rep_pdf)
        assert os.path.getsize(rep_pdf) > 0
        print("TEST COMPARE PDF PASSED 100%!")

    finally:
        for f in (file1, file2, rep_pdf):
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    test_compare_pdf_flow()
