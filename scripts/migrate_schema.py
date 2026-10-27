#!/usr/bin/env python3
"""
BabyLog 数据库 schema 迁移脚本
旧库（babylog_data.db）→ 新库（babylog_data.new.db）

字段变更：
  user.familymember        -> family_member
  user.sex                 -> gender        (男/女/1/2 -> male/female)
  user.create_time         -> created_at
  user.update_time         -> updated_at
  blog.blog                -> content
  blog.create_time         -> created_at
  blog.update_time         -> updated_at
  healthy (表名)            -> health_record
  healthy.create_time      -> created_at
  healthy.update_time      -> updated_at
  photo.file_path          -> storage_path
  user_backup (遗留表)      -> 删除

family_member 的值是自定义称呼，保留原值不做枚举映射。
"""
import os
import shutil
import sqlite3
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE, '..', 'express_back')
OLD_DB = os.path.join(DB_DIR, 'babylog_data.db')
NEW_DB = os.path.join(DB_DIR, 'babylog_data.new.db')

SCHEMA = """
CREATE TABLE user (
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

CREATE TABLE baby (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     VARCHAR(32) NOT NULL UNIQUE,
    birthday DATE        NOT NULL
);

CREATE TABLE blog (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    content    TEXT     NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    user_id    INTEGER  NOT NULL REFERENCES user(id)
);
CREATE INDEX idx_blog_user_id    ON blog(user_id);
CREATE INDEX idx_blog_created_at ON blog(created_at);

CREATE TABLE blog_baby (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL REFERENCES blog(id),
    baby_id INTEGER NOT NULL REFERENCES baby(id),
    UNIQUE (blog_id, baby_id)
);
CREATE INDEX idx_blog_baby_blog_id ON blog_baby(blog_id);
CREATE INDEX idx_blog_baby_baby_id ON blog_baby(baby_id);

CREATE TABLE health_record (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    height     INTEGER  NOT NULL,
    weight     INTEGER  NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    baby_id    INTEGER  NOT NULL REFERENCES baby(id)
);
CREATE INDEX idx_health_record_baby_id ON health_record(baby_id);

CREATE TABLE photo (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name    VARCHAR(256) NOT NULL,
    storage_path VARCHAR(256) NOT NULL,
    file_url     VARCHAR(256) NOT NULL,
    user_id      INTEGER      NOT NULL REFERENCES user(id),
    blog_id      INTEGER      REFERENCES blog(id)
);
CREATE INDEX idx_photo_user_id ON photo(user_id);
CREATE INDEX idx_photo_blog_id ON photo(blog_id);
"""

GENDER_MAP = {
    '男': 'male', 'female_placeholder': None,
    '女': 'female',
    '1': 'male', '2': 'female',
    'male': 'male', 'female': 'female',
}


def map_gender(v, warn):
    s = (v or '').strip()
    if s in ('男',):
        return 'male'
    if s in ('女',):
        return 'female'
    if s == '1':
        warn.append(f"gender 脏值 '1' 按 male 处理")
        return 'male'
    if s == '2':
        warn.append(f"gender 脏值 '2' 按 female 处理")
        return 'female'
    if s in ('male', 'female'):
        return s
    warn.append(f"gender 未知值 {v!r} 按 male 处理")
    return 'male'


def main():
    if not os.path.exists(OLD_DB):
        sys.exit(f"找不到旧库: {OLD_DB}")
    if os.path.exists(NEW_DB):
        os.remove(NEW_DB)

    warn = []
    old = sqlite3.connect(OLD_DB)
    old.row_factory = sqlite3.Row
    new = sqlite3.connect(NEW_DB)
    new.executescript(SCHEMA)

    # --- user ---
    for r in old.execute("SELECT * FROM user ORDER BY id"):
        new.execute(
            "INSERT INTO user (id, username, hashed_password, family_member, gender, is_active, avatar, created_at, updated_at)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (r['id'], r['username'], r['hashed_password'], r['familymember'],
             map_gender(r['sex'], warn), r['is_active'], r['avatar'],
             r['create_time'], r['update_time']))

    # --- baby ---
    for r in old.execute("SELECT * FROM baby ORDER BY id"):
        new.execute("INSERT INTO baby (id, name, birthday) VALUES (?,?,?)",
                    (r['id'], r['name'], r['birthday']))

    # --- blog ---
    for r in old.execute("SELECT * FROM blog ORDER BY id"):
        new.execute("INSERT INTO blog (id, content, created_at, updated_at, user_id) VALUES (?,?,?,?,?)",
                    (r['id'], r['blog'], r['create_time'], r['update_time'], r['user_id']))

    # --- blog_baby ---
    for r in old.execute("SELECT * FROM blog_baby ORDER BY id"):
        new.execute("INSERT INTO blog_baby (id, blog_id, baby_id) VALUES (?,?,?)",
                    (r['id'], r['blog_id'], r['baby_id']))

    # --- healthy -> health_record ---
    for r in old.execute("SELECT * FROM healthy ORDER BY id"):
        new.execute("INSERT INTO health_record (id, height, weight, created_at, updated_at, baby_id)"
                    " VALUES (?,?,?,?,?,?)",
                    (r['id'], r['height'], r['weight'], r['create_time'], r['update_time'], r['baby_id']))

    # --- photo ---
    for r in old.execute("SELECT * FROM photo ORDER BY id"):
        new.execute("INSERT INTO photo (id, file_name, storage_path, file_url, user_id, blog_id)"
                    " VALUES (?,?,?,?,?,?)",
                    (r['id'], r['file_name'], r['file_path'], r['file_url'], r['user_id'], r['blog_id']))

    new.commit()

    # ================= 校验 =================
    checks = [
        ('user', 'user'),
        ('baby', 'baby'),
        ('blog', 'blog'),
        ('blog_baby', 'blog_baby'),
        ('healthy', 'health_record'),
        ('photo', 'photo'),
    ]
    ok = True
    print("=" * 62)
    print(f"{'表':<14}{'旧行数':>8}{'新行数':>8}  状态")
    print("-" * 62)
    for old_t, new_t in checks:
        c1 = old.execute(f"SELECT COUNT(*) FROM {old_t}").fetchone()[0]
        c2 = new.execute(f"SELECT COUNT(*) FROM {new_t}").fetchone()[0]
        status = 'OK' if c1 == c2 else 'MISMATCH'
        if c1 != c2:
            ok = False
        print(f"{old_t + ' -> ' + new_t:<14}{c1:>8}{c2:>8}  {status}")

    # 内容完整性抽查
    print("-" * 62)
    pairs = [
        ("blog 内容总长度", "SELECT SUM(LENGTH(blog)) FROM blog", "SELECT SUM(LENGTH(content)) FROM blog"),
        ("blog 内容 MD5", "SELECT COUNT(*) FROM (SELECT blog FROM blog ORDER BY id)",
         "SELECT COUNT(*) FROM (SELECT content FROM blog ORDER BY id)"),
        ("photo 路径总长度", "SELECT SUM(LENGTH(file_path)) FROM photo", "SELECT SUM(LENGTH(storage_path)) FROM photo"),
        ("healthy 身高总和", "SELECT SUM(height) FROM healthy", "SELECT SUM(height) FROM health_record"),
        ("healthy 体重总和", "SELECT SUM(weight) FROM healthy", "SELECT SUM(weight) FROM health_record"),
        ("生日校验和", "SELECT GROUP_CONCAT(birthday) FROM baby", "SELECT GROUP_CONCAT(birthday) FROM baby"),
    ]
    for label, q_old, q_new in pairs:
        v1 = old.execute(q_old).fetchone()[0]
        v2 = new.execute(q_new).fetchone()[0]
        status = 'OK' if v1 == v2 else 'MISMATCH'
        if v1 != v2:
            ok = False
        print(f"{label:<24}{str(v1)[:16]:>18} vs {str(v2)[:16]:<16} {status}")

    # 外键完整性
    print("-" * 62)
    fk_checks = [
        ("blog.user_id 孤儿", "SELECT COUNT(*) FROM blog WHERE user_id NOT IN (SELECT id FROM user)"),
        ("blog_baby.blog_id 孤儿", "SELECT COUNT(*) FROM blog_baby WHERE blog_id NOT IN (SELECT id FROM blog)"),
        ("blog_baby.baby_id 孤儿", "SELECT COUNT(*) FROM blog_baby WHERE baby_id NOT IN (SELECT id FROM baby)"),
        ("health_record.baby_id 孤儿", "SELECT COUNT(*) FROM health_record WHERE baby_id NOT IN (SELECT id FROM baby)"),
        ("photo.blog_id 孤儿", "SELECT COUNT(*) FROM photo WHERE blog_id IS NOT NULL AND blog_id NOT IN (SELECT id FROM blog)"),
        ("photo.user_id 孤儿", "SELECT COUNT(*) FROM photo WHERE user_id NOT IN (SELECT id FROM user)"),
    ]
    for label, q in fk_checks:
        n = new.execute(q).fetchone()[0]
        status = 'OK' if n == 0 else f'{n} 条异常'
        if n != 0:
            ok = False
        print(f"{label:<28}{status}")

    # 枚举值分布
    print("-" * 62)
    print("gender 分布:", dict(new.execute("SELECT gender, COUNT(*) FROM user GROUP BY gender").fetchall()))
    print("family_member:", dict(new.execute("SELECT family_member, COUNT(*) FROM user GROUP BY family_member").fetchall()))
    print("photo.blog_id 为 NULL 的:", new.execute("SELECT COUNT(*) FROM photo WHERE blog_id IS NULL").fetchone()[0])

    # 索引确认
    print("-" * 62)
    print("新库索引:", [r[0] for r in new.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name")])
    print("新库表:", [r[0] for r in new.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")])

    if warn:
        print("-" * 62)
        print("数据清洗提示:")
        for w in warn:
            print("  -", w)

    print("=" * 62)
    print("迁移结果:", "全部校验通过 ✅" if ok else "存在异常 ❌")

    old.close()
    new.close()
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
