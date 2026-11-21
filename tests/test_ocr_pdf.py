import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
from src.services.pdf.advanced_service import ocr_pdf

def test_ocr_pdf_flow():
    test_pdf = "tests/test_ocr_sample.pdf"
    out_pdf = "tests/test_ocr_result.pdf"

    try:
        doc = fitz.open()
        p = doc.new_page(width=500, height=700)
        p.insert_text((50, 100), "Van ban mau kiem tra nhan dang ky tu quang hoc OCR")
        doc.save(test_pdf)
        doc.close()

        res = ocr_pdf(test_pdf, out_pdf, lang="vie+eng")
        assert res["status"] == "success"
        assert res["total_pages"] == 1
        assert res["total_words"] > 0
        assert os.path.exists(out_pdf)
        assert os.path.getsize(out_pdf) > 0
        print("TEST OCR PDF PASSED 100%!")

    finally:
        for f in (test_pdf, out_pdf):
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    test_ocr_pdf_flow()
