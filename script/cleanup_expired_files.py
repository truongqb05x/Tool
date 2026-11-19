"""
=============================================================================
TOOLHUB - SCRIPT DỌN DẸP FILE QUÁ HẠN 30 NGÀY (CRON JOB)
Vị trí: script/cleanup_expired_files.py

Yêu cầu nghiệp vụ:
- Quét các tệp tin trong hệ thống có thời gian tạo quá 30 ngày (created_at < now - 30 days).
- CHỈ XÓA FILE VẬT LÝ TRÊN Ổ ĐĨA MÁY CHỦ, TUYỆT ĐỐI KHÔNG XÓA DỮ LIỆU TRONG DATABASE.
- Hỗ trợ chạy định kỳ tự động bằng Crontab (Linux) hoặc Task Scheduler (Windows).
=============================================================================
"""

import os
import sys
import argparse
from datetime import datetime, timedelta

# Đảm bảo Python nhận diện thư mục gốc của dự án
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.database import init_db, db_session
from src.database.models import UserFile, format_size


def cleanup_expired_user_files(days: int = 30, dry_run: bool = False):
    """
    Quét và xóa các file vật lý của người dùng đã quá số ngày quy định (mặc định 30 ngày).
    GIỮ NGUYÊN BẢN GHI TRONG CƠ SỞ DỮ LIỆU.
    """
    now = datetime.utcnow()
    cutoff_date = now - timedelta(days=days)

    print("=" * 70)
    print(f"TOOLHUB - DỌN DẸP FILE HẾT HẠN (MỐC: > {days} NGÀY)")
    print(f"Thời gian quét (UTC): {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Ngưỡng hết hạn      : Trước {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Chế độ chạy         : {'[DRY RUN - CHỈ KIỂM TRA, KHÔNG XÓA THẬT]' if dry_run else '[THỰC THI XÓA THẬT]'}")
    print("=" * 70)

    # 1. Truy vấn các bản ghi tệp tin quá hạn từ database
    expired_records = db_session.query(UserFile).filter(
        UserFile.created_at < cutoff_date
    ).all()

    total_scanned = len(expired_records)
    physical_deleted_count = 0
    already_missing_count = 0
    total_reclaimed_bytes = 0

    print(f">> Tìm thấy {total_scanned} bản ghi trong database quá hạn {days} ngày.")

    for record in expired_records:
        file_path = record.file_path

        if not file_path or not os.path.exists(file_path):
            already_missing_count += 1
            continue

        try:
            file_size = os.path.getsize(file_path)
        except OSError:
            file_size = record.file_size or 0

        if dry_run:
            print(f"  [DRY-RUN] Sẽ xóa: ID={record.id} | User={record.user_id} | Size={format_size(file_size)} | Path={file_path}")
            physical_deleted_count += 1
            total_reclaimed_bytes += file_size
        else:
            try:
                os.remove(file_path)
                physical_deleted_count += 1
                total_reclaimed_bytes += file_size
                print(f"  [ĐÃ XÓA] ID={record.id} | User={record.user_id} | Size={format_size(file_size)} | {os.path.basename(file_path)}")
            except Exception as e:
                print(f"  [LỖI] Không thể xóa file ID={record.id} ({file_path}): {e}")

    # 2. Quét dọn thư mục tạm thời uploads/compressed (file nén của khách vãng lai)
    temp_deleted_count = 0
    temp_reclaimed_bytes = 0
    compressed_dir = os.path.join(PROJECT_ROOT, 'uploads', 'compressed')

    if os.path.exists(compressed_dir):
        for fname in os.listdir(compressed_dir):
            if fname == '.gitkeep':
                continue
            fpath = os.path.join(compressed_dir, fname)
            if not os.path.isfile(fpath):
                continue
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(fpath))
                # File tạm của khách vãng lai nếu quá 2 ngày hoặc quá số ngày quy định
                if mtime < cutoff_date:
                    fsize = os.path.getsize(fpath)
                    if dry_run:
                        temp_deleted_count += 1
                        temp_reclaimed_bytes += fsize
                    else:
                        os.remove(fpath)
                        temp_deleted_count += 1
                        temp_reclaimed_bytes += fsize
                        print(f"  [ĐÃ XÓA TẠM] {fname} ({format_size(fsize)})")
            except Exception:
                pass

    # Tổng kết
    print("-" * 70)
    print("TỔNG KẾT HOÀN TẤT:")
    print(f" - Tổng số file vật lý người dùng đã xóa: {physical_deleted_count} tệp")
    print(f" - Tổng số file tạm thời đã xóa         : {temp_deleted_count} tệp")
    print(f" - Tổng dung lượng ổ đĩa đã giải phóng   : {format_size(total_reclaimed_bytes + temp_reclaimed_bytes)}")
    print(f" - Trạng thái database: GIỮ NGUYÊN {total_scanned} DỮ LIỆU BẢN GHI.")
    print("=" * 70)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Dọn dẹp file vật lý quá 30 ngày cho ToolHub (giữ nguyên CSDL)')
    parser.add_argument('--days', type=int, default=30, help='Số ngày hết hạn lưu trữ (mặc định: 30)')
    parser.add_argument('--dry-run', action='store_true', help='Chỉ quét và in kết quả, không xóa file thật')

    args = parser.parse_args()

    # Khởi tạo kết nối DB
    init_db()

    # Chạy dọn dẹp
    cleanup_expired_user_files(days=args.days, dry_run=args.dry_run)
