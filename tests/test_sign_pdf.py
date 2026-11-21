import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
from src.services.pdf.security_service import sign_pdf

def test_sign_pdf_flow():
    test_pdf = "tests/test_sign_sample.pdf"
    out_pdf = "tests/test_sign_result.pdf"

    try:
        # Tạo PDF hợp đồng mẫu 2 trang
        doc = fitz.open()
        p1 = doc.new_page(width=600, height=800)
        p1.insert_text((50, 100), "Trang 1: Hop dong kinh te")
        p2 = doc.new_page(width=600, height=800)
        p2.insert_text((50, 100), "Trang 2: Dai dien hai ben ky ten")
        doc.save(test_pdf)
        doc.close()

        # 1. Test ky bang ten / chu ky dien tu
        res = sign_pdf(
            input_path=test_pdf,
            output_path=out_pdf,
            signature_type="text",
            sign_name="Nguyen Van A",
            page_target="last",
            position="bottom-right",
            sign_date="21/11/2026"
        )
        assert res["status"] == "success"
        assert res["signed_pages"] == 1
        assert res["sign_name"] == "Nguyen Van A"
        assert os.path.exists(out_pdf)
        assert os.path.getsize(out_pdf) > 0
        print("TEST SIGN PDF PASSED 100%!")

    finally:
        if os.path.exists(test_pdf):
            os.remove(test_pdf)
        if os.path.exists(out_pdf):
            os.remove(out_pdf)

if __name__ == "__main__":
    test_sign_pdf_flow()
