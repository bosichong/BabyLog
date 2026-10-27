#!/usr/bin/env python3
"""
BabyLog 3.1 数据库升级脚本

适用场景：
  - 3.1 之前的任意数据库结构（旧字段名 / 3.0 新字段名但缺 video 表）
  - 自动把旧表和旧字段迁移到 3.1 结构
  - 自动创建 video 表、索引和外键
  - 校验行数、内容摘要、外键和完整性

推荐用法：
  # 先生成 babylog_data.new.db，查看校验结果，不替换原库
  python3 scripts/upgrade_to_3_1.py

  # 确认无误后替换原库（会自动备份为 babylog_data.db.bak-时间戳）
  python3 scripts/upgrade_to_3_1.py --apply

注意：升级前请先停止服务，并备份 uploads 目录。
"""
from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB = BASE_DIR / "express_back" / "babylog_data.db"

TABLES_SQL = """
CREATE TABLE IF NOT EXISTS user (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        VARCHAR(32)  NOT NULL UNIQUE,
    hashed_password VARCHAR(128) NOT NULL,
    family_member   VARCHAR(255),
    gender          VARCHAR(10)  NOT NULL DEFAULT 'male',
    is_active       BOOLEAN      DEFAULT 0,
    avatar          VARCHAR(128),
    created_at      DATETIME     NOT NULL,
    updated_at      DATETIME     NOT NULL
);

CREATE TABLE IF NOT EXISTS baby (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     VARCHAR(32) NOT NULL UNIQUE,
    birthday DATE        NOT NULL
);

CREATE TABLE IF NOT EXISTS blog (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    content    TEXT     NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    user_id    INTEGER  NOT NULL REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS blog_baby (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL REFERENCES blog(id),
    baby_id INTEGER NOT NULL REFERENCES baby(id),
    UNIQUE (blog_id, baby_id)
);

CREATE TABLE IF NOT EXISTS health_record (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    height     INTEGER  NOT NULL,
    weight     INTEGER  NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    baby_id    INTEGER  NOT NULL REFERENCES baby(id)
);

CREATE TABLE IF NOT EXISTS photo (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name    VARCHAR(256) NOT NULL,
    storage_path VARCHAR(256) NOT NULL,
    file_url     VARCHAR(256) NOT NULL,
    user_id      INTEGER      NOT NULL REFERENCES user(id),
    blog_id      INTEGER      REFERENCES blog(id)
);

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
);
"""

INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_blog_user_id       ON blog(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_created_at    ON blog(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_baby_blog_id  ON blog_baby(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_baby_baby_id  ON blog_baby(baby_id);
CREATE INDEX IF NOT EXISTS idx_health_record_baby_id ON health_record(baby_id);
CREATE INDEX IF NOT EXISTS idx_photo_user_id      ON photo(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_blog_id      ON photo(blog_id);

CREATE UNIQUE INDEX IF NOT EXISTS video_blog_id_unique
    ON video(blog_id) WHERE blog_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS video_user_id ON video(user_id);
"""

# 3.1 目标字段。顺序与建表语句一致，便于报告。
EXPECTED_COLUMNS = {
    "user": [
        "id", "username", "hashed_password", "family_member", "gender",
        "is_active", "avatar", "created_at", "updated_at",
    ],
    "baby": ["id", "name", "birthday"],
    "blog": ["id", "content", "created_at", "updated_at", "user_id"],
    "blog_baby": ["id", "blog_id", "baby_id"],
    "health_record": ["id", "height", "weight", "created_at", "updated_at", "baby_id"],
    "photo": ["id", "file_name", "storage_path", "file_url", "user_id", "blog_id"],
    "video": [
        "id", "file_name", "storage_path", "file_url", "duration",
        "size_bytes", "created_at", "updated_at", "user_id", "blog_id",
    ],
}

# 源表候选名：3.1 之前的 healthy 表需要改名为 health_record。
SOURCE_TABLE_CANDIDATES = {
    "user": ("user",),
    "baby": ("baby",),
    "blog": ("blog",),
    "blog_baby": ("blog_baby",),
    "health_record": ("health_record", "healthy"),
    "photo": ("photo",),
    "video": ("video",),  # 旧库可能没有
}

# 目标字段 -> 可能的旧字段名。
COLUMN_ALIASES = {
    "user": {
        "family_member": ("family_member", "familymember"),
        "gender": ("gender", "sex"),
        "created_at": ("created_at", "create_time"),
        "updated_at": ("updated_at", "update_time"),
    },
    "blog": {
        "content": ("content", "blog"),
        "created_at": ("created_at", "create_time"),
        "updated_at": ("updated_at", "update_time"),
    },
    "health_record": {
        "created_at": ("created_at", "create_time"),
        "updated_at": ("updated_at", "update_time"),
    },
    "photo": {
        "storage_path": ("storage_path", "file_path"),
    },
    "video": {
        "created_at": ("created_at", "create_time"),
        "updated_at": ("updated_at", "update_time"),
    },
}

MISSING = object()


class UpgradeError(Exception):
    """升级前检查或数据校验失败。"""


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def table_exists(conn: sqlite3.Connection, table: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone() is not None


def table_columns(conn: sqlite3.Connection, table: str) -> list[str]:
    return [row[1] for row in conn.execute(f"PRAGMA table_info({quote_ident(table)})")]


def find_source_table(conn: sqlite3.Connection, target: str) -> str | None:
    for candidate in SOURCE_TABLE_CANDIDATES[target]:
        if table_exists(conn, candidate):
            return candidate
    return None


def find_source_column(columns: list[str], target_table: str, target_column: str) -> str | None:
    for candidate in COLUMN_ALIASES.get(target_table, {}).get(target_column, (target_column,)):
        if candidate in columns:
            return candidate
    return None


def get_value(
    row: sqlite3.Row,
    columns: list[str],
    target_table: str,
    target_column: str,
    default: Any = MISSING,
) -> Any:
    source_column = find_source_column(columns, target_table, target_column)
    if source_column is not None:
        return row[source_column]
    if default is not MISSING:
        return default
    raise UpgradeError(
        f"{target_table} 缺少可用字段 {target_column!r}；"
        f"源表字段为 {', '.join(columns)}"
    )


def need(value: Any, label: str) -> Any:
    if value is None:
        raise UpgradeError(f"{label} 为 NULL，无法安全迁移")
    return value


def normalize_gender(value: Any, warnings: list[str], label: str) -> str:
    text = "" if value is None else str(value).strip()
    mapping = {
        "男": "male", "male": "male", "m": "male", "1": "male",
        "女": "female", "female": "female", "f": "female", "2": "female",
    }
    if text in mapping:
        return mapping[text]
    if text:
        warnings.append(f"{label}: gender/sex={value!r} 无法识别，按 male 处理")
    else:
        warnings.append(f"{label}: gender/sex 为空，按 male 处理")
    return "male"


def normalize_active(value: Any, warnings: list[str], label: str) -> int:
    if value is None:
        return 0
    if isinstance(value, str):
        text = value.strip().lower()
        if text in ("1", "true", "yes", "on"):
            return 1
        if text in ("0", "false", "no", "off", ""):
            return 0
        try:
            return 1 if int(float(text)) else 0
        except ValueError:
            warnings.append(f"{label}: is_active={value!r} 无法识别，按 0 处理")
            return 0
    try:
        return 1 if int(value) else 0
    except (TypeError, ValueError):
        warnings.append(f"{label}: is_active={value!r} 无法识别，按 0 处理")
        return 0


def to_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def to_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")


def get_timestamps(
    row: sqlite3.Row,
    columns: list[str],
    target_table: str,
    label: str,
    warnings: list[str],
) -> tuple[str, str]:
    created = get_value(row, columns, target_table, "created_at", None)
    updated = get_value(row, columns, target_table, "updated_at", None)
    fallback = now_text()

    if not created:
        if updated:
            created = updated
            warnings.append(f"{label}: created_at 为空，使用 updated_at 回填")
        else:
            created = fallback
            warnings.append(f"{label}: created_at/updated_at 为空，使用当前时间回填")
    if not updated:
        updated = created
        warnings.append(f"{label}: updated_at 为空，使用 created_at 回填")
    return created, updated


def precheck_source(conn: sqlite3.Connection, source_tables: dict[str, str | None]) -> None:
    """在写新库前检查会导致建表失败的数据问题。"""
    checks = [
        (
            "user.username 重复",
            "SELECT username, COUNT(*) FROM user GROUP BY username HAVING COUNT(*) > 1",
        ),
        (
            "baby.name 重复",
            "SELECT name, COUNT(*) FROM baby GROUP BY name HAVING COUNT(*) > 1",
        ),
        (
            "blog_baby 关联重复",
            "SELECT blog_id, baby_id, COUNT(*) FROM blog_baby "
            "GROUP BY blog_id, baby_id HAVING COUNT(*) > 1",
        ),
    ]

    if source_tables.get("video"):
        video_columns = table_columns(conn, source_tables["video"])
        if "blog_id" in video_columns:
            checks.append(
                (
                    "video.blog_id 重复（一篇日志只能有一个视频）",
                    "SELECT blog_id, COUNT(*) FROM video "
                    "WHERE blog_id IS NOT NULL GROUP BY blog_id HAVING COUNT(*) > 1",
                )
            )

    problems: list[str] = []
    for label, sql in checks:
        rows = conn.execute(sql).fetchall()
        if rows:
            preview = "; ".join(repr(tuple(row)) for row in rows[:8])
            problems.append(f"{label}: {len(rows)} 组，示例 {preview}")

    if problems:
        raise UpgradeError(
            "源数据库存在重复数据，直接迁移会违反 3.1 唯一约束。\n"
            + "\n".join("  - " + item for item in problems)
        )

    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
    if integrity != "ok":
        raise UpgradeError(f"源数据库完整性检查失败: {integrity}")


def copy_users(src: sqlite3.Connection, dst: sqlite3.Connection, warnings: list[str]) -> int:
    source = find_source_table(src, "user")
    if not source:
        raise UpgradeError("源数据库缺少 user 表")
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()

    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "user", "id"), f"user.id={raw_id}")
        label = f"user.id={row_id}"
        created, updated = get_timestamps(row, columns, "user", label, warnings)
        dst.execute(
            "INSERT INTO user "
            "(id, username, hashed_password, family_member, gender, is_active, avatar, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                row_id,
                need(get_value(row, columns, "user", "username"), f"{label}.username"),
                need(get_value(row, columns, "user", "hashed_password"), f"{label}.hashed_password"),
                get_value(row, columns, "user", "family_member", None),
                normalize_gender(get_value(row, columns, "user", "gender", "male"), warnings, label),
                normalize_active(get_value(row, columns, "user", "is_active", 0), warnings, label),
                get_value(row, columns, "user", "avatar", None),
                created,
                updated,
            ),
        )
    return len(rows)


def copy_babies(src: sqlite3.Connection, dst: sqlite3.Connection) -> int:
    source = find_source_table(src, "baby")
    if not source:
        raise UpgradeError("源数据库缺少 baby 表")
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()
    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "baby", "id"), f"baby.id={raw_id}")
        dst.execute(
            "INSERT INTO baby (id, name, birthday) VALUES (?, ?, ?)",
            (
                row_id,
                need(get_value(row, columns, "baby", "name"), f"baby.id={row_id}.name"),
                need(get_value(row, columns, "baby", "birthday"), f"baby.id={row_id}.birthday"),
            ),
        )
    return len(rows)


def copy_blogs(src: sqlite3.Connection, dst: sqlite3.Connection, warnings: list[str]) -> int:
    source = find_source_table(src, "blog")
    if not source:
        raise UpgradeError("源数据库缺少 blog 表")
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()

    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "blog", "id"), f"blog.id={raw_id}")
        label = f"blog.id={row_id}"
        created, updated = get_timestamps(row, columns, "blog", label, warnings)
        content = get_value(row, columns, "blog", "content", None)
        if content is None:
            content = ""
            warnings.append(f"{label}: 内容为空，按空字符串处理")
        dst.execute(
            "INSERT INTO blog (id, content, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?)",
            (
                row_id,
                content,
                created,
                updated,
                need(get_value(row, columns, "blog", "user_id"), f"{label}.user_id"),
            ),
        )
    return len(rows)


def copy_blog_babies(src: sqlite3.Connection, dst: sqlite3.Connection) -> int:
    source = find_source_table(src, "blog_baby")
    if not source:
        raise UpgradeError("源数据库缺少 blog_baby 表")
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()
    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "blog_baby", "id"), f"blog_baby.id={raw_id}")
        dst.execute(
            "INSERT INTO blog_baby (id, blog_id, baby_id) VALUES (?, ?, ?)",
            (
                row_id,
                need(get_value(row, columns, "blog_baby", "blog_id"), f"blog_baby.id={row_id}.blog_id"),
                need(get_value(row, columns, "blog_baby", "baby_id"), f"blog_baby.id={row_id}.baby_id"),
            ),
        )
    return len(rows)


def copy_health(src: sqlite3.Connection, dst: sqlite3.Connection, warnings: list[str]) -> int:
    source = find_source_table(src, "health_record")
    if not source:
        raise UpgradeError("源数据库缺少 health_record/healthy 表")
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()
    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "health_record", "id"), f"health_record.id={raw_id}")
        label = f"health_record.id={row_id}"
        created, updated = get_timestamps(row, columns, "health_record", label, warnings)
        dst.execute(
            "INSERT INTO health_record "
            "(id, height, weight, created_at, updated_at, baby_id) VALUES (?, ?, ?, ?, ?, ?)",
            (
                row_id,
                need(get_value(row, columns, "health_record", "height"), f"{label}.height"),
                need(get_value(row, columns, "health_record", "weight"), f"{label}.weight"),
                created,
                updated,
                need(get_value(row, columns, "health_record", "baby_id"), f"{label}.baby_id"),
            ),
        )
    return len(rows)


def copy_photos(src: sqlite3.Connection, dst: sqlite3.Connection, warnings: list[str]) -> int:
    source = find_source_table(src, "photo")
    if not source:
        raise UpgradeError("源数据库缺少 photo 表")
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()
    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "photo", "id"), f"photo.id={raw_id}")
        label = f"photo.id={row_id}"
        storage_path = need(
            get_value(row, columns, "photo", "storage_path"), f"{label}.storage_path"
        )
        file_url = get_value(row, columns, "photo", "file_url", None)
        if file_url is None:
            file_url = storage_path
            warnings.append(f"{label}: file_url 为空，使用 storage_path 回填")
        file_name = get_value(row, columns, "photo", "file_name", None)
        if not file_name:
            file_name = Path(str(storage_path)).name
            warnings.append(f"{label}: file_name 为空，使用 storage_path 文件名回填")
        dst.execute(
            "INSERT INTO photo (id, file_name, storage_path, file_url, user_id, blog_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                row_id,
                file_name,
                storage_path,
                file_url,
                need(get_value(row, columns, "photo", "user_id"), f"{label}.user_id"),
                get_value(row, columns, "photo", "blog_id", None),
            ),
        )
    return len(rows)


def copy_videos(src: sqlite3.Connection, dst: sqlite3.Connection, warnings: list[str]) -> int:
    source = find_source_table(src, "video")
    if not source:
        return 0
    columns = table_columns(src, source)
    rows = src.execute(f"SELECT * FROM {quote_ident(source)} ORDER BY id").fetchall()
    for row in rows:
        raw_id = row["id"] if "id" in columns else "?"
        row_id = need(get_value(row, columns, "video", "id"), f"video.id={raw_id}")
        label = f"video.id={row_id}"
        created, updated = get_timestamps(row, columns, "video", label, warnings)
        storage_path = need(
            get_value(row, columns, "video", "storage_path"), f"{label}.storage_path"
        )
        file_url = get_value(row, columns, "video", "file_url", None)
        if file_url is None:
            file_url = storage_path
            warnings.append(f"{label}: file_url 为空，使用 storage_path 回填")
        file_name = get_value(row, columns, "video", "file_name", None)
        if not file_name:
            file_name = Path(str(storage_path)).name
            warnings.append(f"{label}: file_name 为空，使用 storage_path 文件名回填")
        dst.execute(
            "INSERT INTO video "
            "(id, file_name, storage_path, file_url, duration, size_bytes, created_at, updated_at, user_id, blog_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                row_id,
                file_name,
                storage_path,
                file_url,
                to_float(get_value(row, columns, "video", "duration", None)),
                to_int(get_value(row, columns, "video", "size_bytes", None)),
                created,
                updated,
                need(get_value(row, columns, "video", "user_id"), f"{label}.user_id"),
                get_value(row, columns, "video", "blog_id", None),
            ),
        )
    return len(rows)


def collect_source_tables(conn: sqlite3.Connection) -> dict[str, str | None]:
    return {
        target: find_source_table(conn, target)
        for target in EXPECTED_COLUMNS
    }


def print_mapping(conn: sqlite3.Connection, source_tables: dict[str, str | None]) -> None:
    print("\n字段/表映射：")
    notes: list[str] = []
    for target in EXPECTED_COLUMNS:
        source = source_tables.get(target)
        if not source:
            notes.append(f"{target}: 源表缺失，将新建空表")
            continue
        columns = table_columns(conn, source)
        if source != target:
            notes.append(f"{source} -> {target}")
        for target_column in EXPECTED_COLUMNS[target]:
            source_column = find_source_column(columns, target, target_column)
            if source_column is not None and source_column != target_column:
                notes.append(f"{source}.{source_column} -> {target}.{target_column}")
    if not notes:
        print("  字段名已经是 3.1 结构")
    else:
        for note in notes:
            print(f"  - {note}")

    known_tables = set(source_tables.values()) | set(EXPECTED_COLUMNS) | {"sqlite_sequence"}
    all_tables = [
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
    ]
    ignored = [name for name in all_tables if name not in known_tables]
    if ignored:
        print("忽略旧表（不迁移）：" + ", ".join(ignored))


def hash_query(conn: sqlite3.Connection, sql: str) -> str:
    digest = hashlib.sha256()
    for row in conn.execute(sql):
        digest.update(repr(tuple(row)).encode("utf-8", "surrogatepass"))
        digest.update(b"\n")
    return digest.hexdigest()


def count_table(conn: sqlite3.Connection, table: str | None) -> int | None:
    if not table:
        return None
    return conn.execute(f"SELECT COUNT(*) FROM {quote_ident(table)}").fetchone()[0]


def verify_data(
    src: sqlite3.Connection,
    dst: sqlite3.Connection,
    source_tables: dict[str, str | None],
) -> list[str]:
    issues: list[str] = []

    print("\n数据校验：")
    print(f"{'表':<28}{'旧库':>8}{'新库':>8}  状态")
    print("-" * 58)
    for target in EXPECTED_COLUMNS:
        source = source_tables.get(target)
        old_count = count_table(src, source)
        new_count = count_table(dst, target)
        label = f"{source} -> {target}" if source and source != target else target
        if old_count is None:
            status = "OK（新建空表）" if new_count == 0 else "异常"
            if new_count != 0:
                issues.append(f"{target}: 旧库没有该表，新库却有 {new_count} 行")
        else:
            status = "OK" if old_count == new_count else "数量不一致"
            if old_count != new_count:
                issues.append(f"{target}: 旧库 {old_count} 行，新库 {new_count} 行")
        print(f"{label:<28}{str(old_count if old_count is not None else '-'):>8}"
              f"{new_count:>8}  {status}")

    # 字段完整性
    print("-" * 58)
    for target, expected in EXPECTED_COLUMNS.items():
        actual = table_columns(dst, target)
        missing = [column for column in expected if column not in actual]
        status = "OK" if not missing else "缺字段: " + ", ".join(missing)
        if missing:
            issues.append(f"{target} 缺少字段: {', '.join(missing)}")
        print(f"{target + ' 字段':<28}{len(actual):>8}{len(expected):>8}  {status}")

    # 内容摘要
    print("-" * 58)
    checks: list[tuple[str, str | None, str]] = []
    source = source_tables.get("user")
    if source:
        checks.append((
            "user 账号/密码",
            f"SELECT id, username, hashed_password FROM {quote_ident(source)} ORDER BY id",
            "SELECT id, username, hashed_password FROM user ORDER BY id",
        ))
    source = source_tables.get("baby")
    if source:
        checks.append((
            "baby 姓名/生日",
            f"SELECT id, name, birthday FROM {quote_ident(source)} ORDER BY id",
            "SELECT id, name, birthday FROM baby ORDER BY id",
        ))
    source = source_tables.get("blog")
    if source:
        columns = table_columns(src, source)
        content_column = find_source_column(columns, "blog", "content")
        if content_column:
            checks.append((
                "blog 内容",
                f"SELECT id, {quote_ident(content_column)} FROM {quote_ident(source)} ORDER BY id",
                "SELECT id, content FROM blog ORDER BY id",
            ))
    source = source_tables.get("blog_baby")
    if source:
        checks.append((
            "blog_baby 关联",
            f"SELECT id, blog_id, baby_id FROM {quote_ident(source)} ORDER BY id",
            "SELECT id, blog_id, baby_id FROM blog_baby ORDER BY id",
        ))
    source = source_tables.get("health_record")
    if source:
        checks.append((
            "health 身高体重",
            f"SELECT id, height, weight, baby_id FROM {quote_ident(source)} ORDER BY id",
            "SELECT id, height, weight, baby_id FROM health_record ORDER BY id",
        ))
    source = source_tables.get("photo")
    if source:
        columns = table_columns(src, source)
        path_column = find_source_column(columns, "photo", "storage_path")
        if path_column:
            checks.append((
                "photo 路径",
                f"SELECT id, {quote_ident(path_column)} FROM {quote_ident(source)} ORDER BY id",
                "SELECT id, storage_path FROM photo ORDER BY id",
            ))
    source = source_tables.get("video")
    if source:
        columns = table_columns(src, source)
        path_column = find_source_column(columns, "video", "storage_path")
        if path_column:
            checks.append((
                "video 路径",
                f"SELECT id, {quote_ident(path_column)} FROM {quote_ident(source)} ORDER BY id",
                "SELECT id, storage_path FROM video ORDER BY id",
            ))

    for label, source_sql, target_sql in checks:
        if source_sql is None:
            continue
        old_hash = hash_query(src, source_sql)
        new_hash = hash_query(dst, target_sql)
        ok = old_hash == new_hash
        if not ok:
            issues.append(f"{label} 摘要不一致")
        print(f"{label:<28}{old_hash[:10]:>10}{new_hash[:10]:>10}  {'OK' if ok else '不一致'}")

    # 外键和完整性
    print("-" * 58)
    integrity = dst.execute("PRAGMA integrity_check").fetchone()[0]
    if integrity != "ok":
        issues.append(f"新库完整性检查失败: {integrity}")
    print(f"{'完整性检查':<28}{'':>18}  {'OK' if integrity == 'ok' else integrity}")

    fk_rows = dst.execute("PRAGMA foreign_key_check").fetchall()
    if fk_rows:
        preview = "; ".join(repr(tuple(row)) for row in fk_rows[:8])
        issues.append(f"新库存在 {len(fk_rows)} 条外键异常，示例 {preview}")
    print(f"{'外键检查':<28}{'':>18}  {'OK' if not fk_rows else str(len(fk_rows)) + ' 条异常'}")

    bad_gender = dst.execute(
        "SELECT COUNT(*) FROM user WHERE gender NOT IN ('male', 'female')"
    ).fetchone()[0]
    if bad_gender:
        issues.append(f"user.gender 存在 {bad_gender} 条非法值")
    print(f"{'gender 取值':<28}{'':>18}  {'OK' if not bad_gender else str(bad_gender) + ' 条异常'}")

    video_dups = dst.execute(
        "SELECT COUNT(*) FROM ("
        "SELECT blog_id FROM video WHERE blog_id IS NOT NULL "
        "GROUP BY blog_id HAVING COUNT(*) > 1)"
    ).fetchone()[0]
    if video_dups:
        issues.append(f"video.blog_id 存在 {video_dups} 组重复")
    print(f"{'video 一日志一视频':<28}{'':>18}  {'OK' if not video_dups else str(video_dups) + ' 组异常'}")

    video_indexes = [row[1] for row in dst.execute("PRAGMA index_list(video)")]
    if table_exists(dst, "video") and "video_blog_id_unique" not in video_indexes:
        issues.append("video 缺少 video_blog_id_unique 索引")
    print(f"{'video 唯一索引':<28}{'':>18}  "
          f"{'OK' if 'video_blog_id_unique' in video_indexes else '缺失'}")

    return issues


def is_31_schema(conn: sqlite3.Connection) -> bool:
    for table, expected in EXPECTED_COLUMNS.items():
        if not table_exists(conn, table):
            return False
        actual = set(table_columns(conn, table))
        if not set(expected).issubset(actual):
            return False
    return True


def ensure_indexes(conn: sqlite3.Connection) -> None:
    conn.executescript(INDEXES_SQL)
    conn.commit()


def backup_path(source: Path) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    candidate = source.with_name(f"{source.name}.bak-{stamp}")
    counter = 1
    while candidate.exists():
        candidate = source.with_name(f"{source.name}.bak-{stamp}-{counter}")
        counter += 1
    return candidate


def apply_output(source: Path, output: Path) -> Path:
    for suffix in ("-wal", "-shm", "-journal"):
        sidecar = Path(str(source) + suffix)
        if sidecar.exists():
            raise UpgradeError(
                f"检测到 {sidecar.name}，请先停止服务并让 SQLite 正常关闭后再试"
            )

    backup = backup_path(source)
    shutil.copy2(source, backup)
    print(f"\n已备份原数据库: {backup}")

    try:
        os.replace(output, source)
    except OSError:
        shutil.copy2(output, source)
        output.unlink()

    # 替换后再做一次轻量完整性检查；失败则自动恢复备份。
    try:
        conn = sqlite3.connect(source)
        try:
            integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
            if integrity != "ok":
                raise UpgradeError(f"替换后完整性检查失败: {integrity}")
        finally:
            conn.close()
    except Exception:
        shutil.copy2(backup, source)
        raise UpgradeError(f"替换后校验失败，已自动恢复备份: {backup}")

    return backup


def default_output(source: Path) -> Path:
    if source.name.endswith(".db"):
        return source.with_name(source.name[:-3] + ".new.db")
    return source.with_name(source.name + ".new.db")


def print_ai_tip() -> None:
    print("\n提示：数据库是多年记录，建议把以上字段映射和校验结果交给 AI 助手复核，")
    print("      确认每张表行数、内容摘要和外键都正常后，再执行 --apply。")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="将 BabyLog 3.1 之前的数据库升级到 3.1（字段名迁移 + video 表）"
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="待升级的 SQLite 数据库")
    parser.add_argument("--output", type=Path, help="新数据库输出路径（默认 xxx.new.db）")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="校验通过后自动备份并替换原数据库；不加时只生成新库",
    )
    args = parser.parse_args(argv)

    source = args.db.expanduser().resolve()
    output = (args.output.expanduser().resolve() if args.output else default_output(source))

    if not source.exists():
        print(f"❌ 数据库不存在: {source}")
        return 1
    if source == output:
        print("❌ --output 不能和 --db 相同")
        return 1

    print("=" * 62)
    print("BabyLog 3.1 数据库升级")
    print(f"源数据库: {source}")
    print(f"输出数据库: {output}")
    print(f"模式: {'生成并替换' if args.apply else '仅生成，不替换'}")
    print("=" * 62)

    src: sqlite3.Connection | None = None
    try:
        src = sqlite3.connect(source)
        src.row_factory = sqlite3.Row

        tables = [
            row[0]
            for row in src.execute(
                "SELECT name FROM sqlite_master WHERE type='table' "
                "AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
        ]
        if not tables:
            print("\n数据库为空，无需升级；启动后端会自动创建 3.1 表结构。")
            return 0

        if is_31_schema(src):
            print("\n检测结果: 已经是 3.1 结构，无需迁移。")
            try:
                ensure_indexes(src)
                print("已检查/补齐 3.1 索引。")
            except sqlite3.DatabaseError as exc:
                print(f"❌ 补齐索引失败: {exc}")
                return 1
            source_tables = {target: target for target in EXPECTED_COLUMNS}
            issues = verify_data(src, src, source_tables)
            if issues:
                print("\n⚠️ 当前库存在以下问题（未修改数据）：")
                for issue in issues:
                    print(f"  - {issue}")
            return 0

        print("\n检测结果: 不是 3.1 结构，需要迁移字段并补齐 video 表。")
        source_tables = collect_source_tables(src)
        required_tables = {
            "user": "user",
            "baby": "baby",
            "blog": "blog",
            "blog_baby": "blog_baby",
            "health_record": "health_record/healthy",
            "photo": "photo",
        }
        missing_tables = [
            label for key, label in required_tables.items()
            if not source_tables.get(key)
        ]
        if missing_tables:
            print(f"❌ 源数据库缺少核心表，无法自动升级: {', '.join(missing_tables)}")
            return 1

        print_mapping(src, source_tables)
        print("\n开始检查源数据...")
        precheck_source(src, source_tables)
        print("源数据检查通过。")

        if output.exists():
            print(f"\n删除旧的输出文件: {output}")
            output.unlink()
        output.parent.mkdir(parents=True, exist_ok=True)

        warnings: list[str] = []
        dst = sqlite3.connect(output)
        try:
            dst.executescript(TABLES_SQL)
            dst.executescript(INDEXES_SQL)
            dst.execute("PRAGMA foreign_keys=OFF")
            counts = {
                "user": copy_users(src, dst, warnings),
                "baby": copy_babies(src, dst),
                "blog": copy_blogs(src, dst, warnings),
                "blog_baby": copy_blog_babies(src, dst),
                "health_record": copy_health(src, dst, warnings),
                "photo": copy_photos(src, dst, warnings),
                "video": copy_videos(src, dst, warnings),
            }
            dst.commit()
        except Exception:
            dst.close()
            if output.exists():
                output.unlink()
            raise
        finally:
            try:
                dst.close()
            except Exception:
                pass

        print("\n已写入新库:")
        for table, count in counts.items():
            print(f"  {table:<16}{count:>6} 行")

        if warnings:
            print("\n数据修正提示:")
            for warning in warnings[:40]:
                print(f"  - {warning}")
            if len(warnings) > 40:
                print(f"  ... 其余 {len(warnings) - 40} 条省略")

        dst_check = sqlite3.connect(output)
        dst_check.row_factory = sqlite3.Row
        try:
            issues = verify_data(src, dst_check, source_tables)
        finally:
            dst_check.close()

        if issues:
            print("\n❌ 校验未通过，未替换原数据库：")
            for issue in issues:
                print(f"  - {issue}")
            print(f"\n新库保留在: {output}")
            print("请让 AI 助手根据以上差异检查后再决定是否处理。")
            return 1

        print("\n✅ 全部校验通过")

        if args.apply:
            src.close()
            src = None
            backup = apply_output(source, output)
            print(f"✅ 已替换数据库: {source}")
            print(f"   原库备份: {backup}")
            print("   请运行 node start.js，并检查页面数据。")
        else:
            print(f"\n新库已生成: {output}")
            print("确认无误后执行以下命令替换（会自动备份原库）：")
            print(f"  python3 scripts/upgrade_to_3_1.py --db {source} --apply")
            print_ai_tip()
        return 0

    except UpgradeError as exc:
        print(f"\n❌ 升级失败: {exc}")
        return 1
    except sqlite3.DatabaseError as exc:
        print(f"\n❌ SQLite 错误: {exc}")
        return 1
    finally:
        if src is not None:
            src.close()


if __name__ == "__main__":
    sys.exit(main())
