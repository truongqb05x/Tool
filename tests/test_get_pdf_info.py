import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
from src.services.pdf.advanced_service import get_pdf_info

def test_get_pdf_info_flow():
    test_pdf = "tests/test_info_sample.pdf"

    try:
        doc = fitz.open()
        p = doc.new_page(width=595.0, height=842.0) # A4
        p.insert_text((50, 100), "Noi dung thu nghiem doc thong tin metadata")
        doc.set_metadata({
            "title": "Bao cao thu nghiem",
            "author": "ToolHub Tester",
            "subject": "Kiem thu he thong"
        })
        doc.save(test_pdf)
        doc.close()

        res = get_pdf_info(test_pdf)
        assert res["status"] == "success"
        meta = res["metadata"]
        assert meta["title"] == "Bao cao thu nghiem"
        assert meta["author"] == "ToolHub Tester"
        assert meta["total_pages"] == 1
        assert "A4" in meta["page_format"]
        print("TEST GET PDF INFO PASSED 100%!")

    finally:
        if os.path.exists(test_pdf):
            os.remove(test_pdf)

if __name__ == "__main__":
    test_get_pdf_info_flow()
