#!/usr/bin/env python3
"""
仅补齐 video 表（可重复执行）

适用前提：
  数据库字段名已经是 3.1 结构（family_member / gender / content /
  health_record / storage_path 等），只缺 video 表。

旧版本（3.1 之前）请使用完整升级脚本：
  python3 scripts/upgrade_to_3_1.py --apply

本脚本不会重命名字段，也不会迁移旧数据。
"""
import argparse
import sqlite3
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB = BASE_DIR / "express_back" / "babylog_data.db"

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS video (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    file_name    VARCHAR(256) NOT NULL,
    storage_path VARCHAR(256) NOT NULL,
    file_url     VARCHAR(256) NOT NULL,
    duration     REAL,
    size_bytes   INTEGER,
    created_at   DATETIME     NOT NULL,
    updated_at   DATETIME     NOT NULL,
    user_id      INTEGER      NOT NULL REFERENCES user(id),
    blog_id      INTEGER      REFERENCES blog(id)
)
"""

# 部分唯一索引：blog_id 非空时唯一 —— 数据库层保证「一篇日志一个视频」
CREATE_INDEX_UNIQUE = """
CREATE UNIQUE INDEX IF NOT EXISTS video_blog_id_unique
    ON video(blog_id) WHERE blog_id IS NOT NULL
"""

CREATE_INDEX_USER = """
CREATE INDEX IF NOT EXISTS video_user_id ON video(user_id)
"""

REQUIRED_31 = {
    "user": [
        "id", "username", "hashed_password", "family_member", "gender",
        "is_active", "avatar", "created_at", "updated_at",
    ],
    "baby": ["id", "name", "birthday"],
    "blog": ["id", "content", "created_at", "updated_at", "user_id"],
    "blog_baby": ["id", "blog_id", "baby_id"],
    "health_record": ["id", "height", "weight", "created_at", "updated_at", "baby_id"],
    "photo": ["id", "file_name", "storage_path", "file_url", "user_id", "blog_id"],
}

VIDEO_COLUMNS = [
    "id", "file_name", "storage_path", "file_url", "duration",
    "size_bytes", "created_at", "updated_at", "user_id", "blog_id",
]


def table_exists(cur, name):
    return cur.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone() is not None


def columns(cur, table):
    return [row[1] for row in cur.execute(f'PRAGMA table_info("{table}")')]


def missing_31_schema(cur):
    missing = []
    for table, expected in REQUIRED_31.items():
        if not table_exists(cur, table):
            missing.append(table)
            continue
        actual = columns(cur, table)
        for column in expected:
            if column not in actual:
                missing.append(f"{table}.{column}")
    return missing


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="只给已经完成字段名升级的 3.1 数据库补 video 表"
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="SQLite 数据库路径")
    args = parser.parse_args(argv)

    db_path = args.db.expanduser().resolve()
    if not db_path.exists():
        print(f"❌ 数据库不存在: {db_path}")
        return 1

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    try:
        missing = missing_31_schema(cur)
        if missing:
            print("❌ 数据库还不是 3.1 字段结构，不能只补 video 表。")
            print("   缺少/不匹配: " + ", ".join(missing[:20]))
            print("   请先运行完整升级：")
            print("     python3 scripts/upgrade_to_3_1.py --apply")
            return 1

        existed = table_exists(cur, "video")

        print(f"数据库: {db_path}")
        print(f"video 表: {'已存在，检查结构' if existed else '不存在，开始创建'}")

        try:
            cur.execute(CREATE_TABLE)
            cur.execute(CREATE_INDEX_UNIQUE)
            cur.execute(CREATE_INDEX_USER)
            conn.commit()
        except sqlite3.DatabaseError as exc:
            conn.rollback()
            print(f"❌ 创建 video 表/索引失败: {exc}")
            print("   如果存在重复 blog_id，请使用完整升级脚本检查数据：")
            print("     python3 scripts/upgrade_to_3_1.py")
            return 1

        # ---------- 校验 ----------
        actual = columns(cur, "video")
        if actual != VIDEO_COLUMNS:
            print(f"❌ video 字段不符\n  期望: {VIDEO_COLUMNS}\n  实际: {actual}")
            print("   请使用完整升级脚本：python3 scripts/upgrade_to_3_1.py --apply")
            return 1

        indexes = [r[1] for r in cur.execute("PRAGMA index_list(video)")]
        if "video_blog_id_unique" not in indexes:
            print(f"❌ 唯一索引缺失，现有索引: {indexes}")
            return 1

        fk = cur.execute("PRAGMA foreign_key_list(video)").fetchall()
        fk_targets = {r[2] for r in fk}
        if not {"user", "blog"} <= fk_targets:
            print(f"❌ 外键不符: {fk_targets}")
            return 1

        count = cur.execute("SELECT COUNT(*) FROM video").fetchone()[0]

        # 确认没有动到 photo 表
        photo_count = cur.execute("SELECT COUNT(*) FROM photo").fetchone()[0]
        photo_cols = columns(cur, "photo")

        print("\n✅ 校验通过")
        print(f"   字段: {', '.join(actual)}")
        print(f"   索引: {', '.join(indexes)}")
        print(f"   外键: {', '.join(sorted(fk_targets))}")
        print(f"   video 现有记录: {count} 条")
        print(f"   photo 表未受影响: {photo_count} 条, 字段 {len(photo_cols)} 个")
        return 0

    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
