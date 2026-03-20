#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
宝贝日志 - 添加日志脚本

用法：
    python add_blog.py --content "日志内容" --babies "露西,垚垚" --author "爸爸"

参数：
    --content : 日志内容（必填）
    --babies  : 宝宝名称，多个用逗号分隔（必填）
    --author  : 添加者，家庭成员称呼，默认"爸爸"
"""

import sqlite3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# 数据库路径 (scripts -> babylog -> skills -> 项目根目录 -> express_back)
DB_PATH = Path(__file__).parent.parent.parent.parent / "express_back" / "babylog_data.db"


def get_connection():
    """获取数据库连接"""
    if not DB_PATH.exists():
        raise Exception(f"数据库文件不存在: {DB_PATH}")
    return sqlite3.connect(DB_PATH)


def find_baby_by_name(cursor, name):
    """根据名称查找宝宝，支持模糊匹配"""
    # 先精确匹配
    cursor.execute("SELECT id, name FROM baby WHERE name = ?", (name,))
    result = cursor.fetchone()
    if result:
        return [{"id": result[0], "name": result[1]}]
    
    # 模糊匹配
    cursor.execute("SELECT id, name FROM baby WHERE name LIKE ?", (f"%{name}%",))
    results = cursor.fetchall()
    return [{"id": r[0], "name": r[1]} for r in results]


def find_user_by_family_member(cursor, family_member):
    """根据家庭成员称呼查找用户"""
    cursor.execute(
        "SELECT id, username, familymember FROM user WHERE familymember = ? AND is_active = 1",
        (family_member,)
    )
    result = cursor.fetchone()
    if result:
        return {"id": result[0], "username": result[1], "familymember": result[2]}
    return None


def add_blog(content, babies, author="爸爸"):
    """
    添加日志
    
    Args:
        content: 日志内容
        babies: 宝宝名称列表，逗号分隔的字符串或列表
        author: 添加者，家庭成员称呼
    
    Returns:
        dict: {"success": bool, "message": str, "data": dict或None, "error": str或None}
    """
    result = {
        "success": False,
        "message": "",
        "data": None,
        "error": None
    }
    
    # 参数处理
    if isinstance(babies, str):
        babies = [b.strip() for b in babies.split(",") if b.strip()]
    
    # 验证日志内容
    if not content or not content.strip():
        result["error"] = "日志内容不能为空"
        result["message"] = "❌ 添加失败：日志内容不能为空"
        return result
    
    # 验证宝宝列表
    if not babies:
        result["error"] = "至少需要指定一个宝宝"
        result["message"] = "❌ 添加失败：至少需要指定一个宝宝"
        return result
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 查找作者
        author_info = find_user_by_family_member(cursor, author)
        if not author_info:
            result["error"] = f"未找到家庭成员「{author}」，请检查称呼是否正确"
            result["message"] = f"❌ 添加失败：未找到家庭成员「{author}」"
            return result
        
        # 查找所有宝宝
        baby_list = []
        for baby_name in babies:
            found = find_baby_by_name(cursor, baby_name)
            if not found:
                result["error"] = f"未找到宝宝「{baby_name}」"
                result["message"] = f"❌ 添加失败：未找到宝宝「{baby_name}」"
                conn.close()
                return result
            elif len(found) > 1:
                names = "、".join([b["name"] for b in found])
                result["error"] = f"宝宝名称「{baby_name}」匹配到多个：{names}，请使用完整名称"
                result["message"] = f"❌ 添加失败：「{baby_name}」匹配到多个宝宝，请使用完整名称"
                conn.close()
                return result
            else:
                baby_list.append(found[0])
        
        # 开始事务
        current_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " +00:00"
        
        # 插入日志
        cursor.execute(
            "INSERT INTO blog (blog, user_id, create_time, update_time) VALUES (?, ?, ?, ?)",
            (content.strip(), author_info["id"], current_time, current_time)
        )
        blog_id = cursor.lastrowid
        
        # 插入关联
        for baby in baby_list:
            cursor.execute(
                "INSERT INTO blog_baby (blog_id, baby_id) VALUES (?, ?)",
                (blog_id, baby["id"])
            )
        
        conn.commit()
        conn.close()
        
        # 构建成功结果
        baby_names = "、".join([b["name"] for b in baby_list])
        result["success"] = True
        result["message"] = f"✅ 日志添加成功！ID: {blog_id}，关联宝宝: {baby_names}，添加者: {author_info['familymember']}"
        result["data"] = {
            "blog_id": blog_id,
            "content": content.strip(),
            "babies": baby_list,
            "author": author_info,
            "create_time": current_time
        }
        
        return result
        
    except Exception as e:
        result["error"] = f"数据库错误: {str(e)}"
        result["message"] = f"❌ 添加失败：{str(e)}"
        return result


def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="宝贝日志 - 添加日志")
    parser.add_argument("--content", "-c", required=True, help="日志内容")
    parser.add_argument("--babies", "-b", required=True, help="宝宝名称，多个用逗号分隔")
    parser.add_argument("--author", "-a", default="爸爸", help="添加者，家庭成员称呼，默认爸爸")
    
    args = parser.parse_args()
    
    result = add_blog(
        content=args.content,
        babies=args.babies,
        author=args.author
    )
    
    # 输出 JSON 结果
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # 返回退出码
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()