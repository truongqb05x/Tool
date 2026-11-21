import sys
import os
sys.path.insert(0, os.path.abspath("."))
import fitz
from src.services.pdf.security_service import protect_pdf, unlock_pdf

def test_unlock_flow():
    test_dir = "tests/test_data"
    os.makedirs(test_dir, exist_ok=True)
    orig_path = os.path.join(test_dir, "orig.pdf")
    locked_path = os.path.join(test_dir, "locked.pdf")
    unlocked_path = os.path.join(test_dir, "unlocked.pdf")

    # 1. Tạo pdf gốc
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 100), "Hello Secret World!")
    doc.save(orig_path)
    doc.close()

    # 2. Khóa pdf với user_password
    protect_pdf(orig_path, locked_path, user_password="MySecretPassword123")
    
    # Kiểm tra file đã bị mã hóa
    locked_doc = fitz.open(locked_path)
    assert locked_doc.is_encrypted, "File phải được mã hóa!"
    locked_doc.close()

    # 3. Mở khóa với sai mật khẩu -> phải raise ValueError
    try:
        unlock_pdf(locked_path, unlocked_path, password="WrongPassword")
        assert False, "Phải báo lỗi khi sai password"
    except ValueError as e:
        print("Bắt lỗi mật khẩu sai chính xác:", e)

    # 4. Mở khóa với đúng mật khẩu
    res = unlock_pdf(locked_path, unlocked_path, password="MySecretPassword123")
    assert os.path.exists(res["output_path"]), "File unlocked phải tồn tại"

    # Kiểm tra file unlocked không còn bị mã hóa
    unlocked_doc = fitz.open(unlocked_path)
    assert not unlocked_doc.is_encrypted, "File sau khi mở khóa không được mã hóa nữa!"
    text = unlocked_doc[0].get_text()
    assert "Hello Secret World!" in text, f"Nội dung văn bản phải được bảo toàn, got: {text}"
    unlocked_doc.close()

    print("TEST UNLOCK PDF PASSED 100%!")

if __name__ == "__main__":
    test_unlock_flow()
