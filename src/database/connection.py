"""
=========================================================
DATABASE CONNECTION & AUTO-MIGRATION - CONNECTION.PY
Quản lý Engine, Scoped Session và Cơ chế Tự động Đồng bộ
Schema (Auto-Migrate) - Thêm bảng/cột trực tiếp từ Python code!
=========================================================
"""

import os
from contextlib import contextmanager
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import scoped_session, sessionmaker
from .models import Base

# Biến toàn cục lưu trữ engine và scoped session
_engine = None
_sessionmaker_instance = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False)
db_session = scoped_session(_sessionmaker_instance)


def get_engine(database_uri: str = None):
    """Lấy hoặc khởi tạo SQLAlchemy Engine."""
    global _engine
    if _engine is None:
        if not database_uri:
            # Mặc định lưu trữ tại src/database/toolhub.db
            db_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(db_dir, 'toolhub.db')
            database_uri = f"sqlite:///{db_path}"

        connect_args = {}
        if database_uri.startswith('sqlite'):
            # Hỗ trợ đa luồng an toàn cho SQLite
            connect_args = {'check_same_thread': False}

        _engine = create_engine(
            database_uri,
            connect_args=connect_args,
            echo=False,
            future=True
        )
    return _engine


def sync_schema(engine, metadata=Base.metadata):
    """
    CƠ CHẾ AUTO-MIGRATE THÔNG MINH:
    Tự động đồng bộ cấu trúc database từ Python Model:
    1. Tạo bảng mới nếu chưa có.
    2. Tự động thêm cột mới (ALTER TABLE ADD COLUMN) nếu bạn thêm thuộc tính mới trong class Python.
    Bạn hoàn toàn KHÔNG CẦN gõ lệnh SQL hay thao tác bên ngoài database!
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    # 1. Tạo các bảng mới chưa tồn tại
    metadata.create_all(bind=engine)

    # 2. Kiểm tra và tự động thêm các cột mới vào các bảng đã tồn tại
    with engine.connect() as conn:
        for table in metadata.tables.values():
            if table.name in existing_tables:
                # Lấy danh sách cột thực tế đang có trong SQLite
                existing_columns = {col['name'] for col in inspector.get_columns(table.name)}

                # 1. Tự động thêm cột mới nếu có trong Python mà chưa có trong DB
                for col in table.columns:
                    if col.name not in existing_columns:
                        # Sinh kiểu dữ liệu tương ứng với dialect của DB
                        col_type = col.type.compile(engine.dialect)
                        
                        # Xây dựng câu lệnh ALTER TABLE an toàn
                        # Với SQLite: nếu thêm cột NOT NULL thì cần có giá trị default
                        default_clause = ""
                        if col.default is not None and col.default.is_scalar:
                            val = col.default.arg
                            if isinstance(val, (int, float)):
                                default_clause = f" DEFAULT {val}"
                            elif isinstance(val, bool):
                                default_clause = f" DEFAULT {1 if val else 0}"
                            elif isinstance(val, str):
                                default_clause = f" DEFAULT '{val}'"

                        alter_sql = f"ALTER TABLE {table.name} ADD COLUMN {col.name} {col_type}{default_clause}"
                        try:
                            conn.execute(text(alter_sql))
                            conn.commit()
                            print(f"[DB Auto-Migrate] Đã tự động thêm cột mới: '{col.name}' ({col_type}) vào bảng '{table.name}'.")
                        except Exception as e:
                            print(f"[DB Auto-Migrate Warning] Không thể tự động thêm cột '{col.name}': {e}")

                # 2. Tự động xóa cột cũ nếu đã xóa khỏi Python Model (hỗ trợ SQLite 3.35.0+)
                model_column_names = {col.name for col in table.columns}
                for old_col_name in existing_columns:
                    if old_col_name not in model_column_names:
                        # Trước khi xóa cột trong SQLite, cần xóa bỏ các index gắn với cột đó
                        try:
                            indexes = inspector.get_indexes(table.name)
                            for idx in indexes:
                                if old_col_name in idx.get('column_names', []):
                                    conn.execute(text(f"DROP INDEX IF EXISTS {idx['name']}"))
                                    conn.commit()
                        except Exception:
                            pass

                        drop_sql = f"ALTER TABLE {table.name} DROP COLUMN {old_col_name}"
                        try:
                            conn.execute(text(drop_sql))
                            conn.commit()
                            print(f"[DB Auto-Migrate] Đã tự động xóa cột cũ: '{old_col_name}' khỏi bảng '{table.name}'.")
                        except Exception as e:
                            print(f"[DB Auto-Migrate Warning] Không thể tự động xóa cột '{old_col_name}': {e}")


def init_db(database_uri: str = None):
    """
    Khởi tạo toàn bộ hệ thống cơ sở dữ liệu:
    - Tạo engine
    - Tự động sync schema (bảng & cột mới)
    - Thiết lập session factory
    """
    global _engine, db_session
    _engine = get_engine(database_uri)

    db_session.remove()
    db_session.configure(bind=_engine)

    # Đồng bộ schema tự động từ Python Models
    sync_schema(_engine, Base.metadata)

    return _engine, db_session


@contextmanager
def get_db():
    """
    Context manager hỗ trợ transaction an toàn:
    Tự động commit khi hoàn thành, rollback nếu có lỗi và close session.
    Cách dùng:
        with get_db() as db:
            user = db.query(User).first()
    """
    session = db_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
