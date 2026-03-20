#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
宝贝日志 - 修改日志脚本

用法：
    # 全量替换
    python edit_blog.py --id 123 --replace "全新的日志内容"
    
    # 部分替换（查找并替换）
    python edit_blog.py --id 123 --find "原内容" --replace "新内容"
    
    # 追加内容
    python edit_blog.py --id 123 --append "追加的内容"
    
    # 同时更新宝宝关联（可选）
    python edit_blog.py --id 123 --replace "新内容" --babies "露西,垚垚"

参数：
    --id      : 日志ID（必填）
    --replace : 替换内容（全量替换时填新内容；部分替换时填替换后的内容）
    --find    : 查找内容（部分替换时必填）
    --append  : 追加内容
    --babies  : 新的宝宝关联，多个用逗号分隔（可选）
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


def find_user_by_id(cursor, user_id):
    """根据用户ID查找用户"""
    cursor.execute(
        "SELECT id, username, familymember FROM user WHERE id = ?",
        (user_id,)
    )
    result = cursor.fetchone()
    if result:
        return {"id": result[0], "username": result[1], "familymember": result[2]}
    return None


def get_blog_by_id(cursor, blog_id):
    """根据ID获取日志详情"""
    cursor.execute(
        "SELECT id, blog, user_id, create_time FROM blog WHERE id = ?",
        (blog_id,)
    )
    result = cursor.fetchone()
    if result:
        return {
            "id": result[0],
            "content": result[1],
            "user_id": result[2],
            "create_time": result[3]
        }
    return None


def get_blog_babies(cursor, blog_id):
    """获取日志关联的宝宝"""
    cursor.execute(
        """
        SELECT b.id, b.name 
        FROM baby b 
        JOIN blog_baby bb ON b.id = bb.baby_id 
        WHERE bb.blog_id = ?
        """,
        (blog_id,)
    )
    results = cursor.fetchall()
    return [{"id": r[0], "name": r[1]} for r in results]


def edit_blog(blog_id, replace=None, find=None, append=None, babies=None):
    """
    修改日志
    
    Args:
        blog_id: 日志ID
        replace: 替换内容
        find: 查找内容（部分替换时使用）
        append: 追加内容
        babies: 新的宝宝关联列表（可选），逗号分隔的字符串或列表
    
    Returns:
        dict: {"success": bool, "message": str, "data": dict或None, "error": str或None}
    """
    result = {
        "success": False,
        "message": "",
        "data": None,
        "error": None
    }
    
    # 参数验证：必须指定一种修改方式
    if replace is None and append is None:
        result["error"] = "必须指定修改方式：--replace（替换）或 --append（追加）"
        result["message"] = "❌ 修改失败：必须指定修改方式"
        return result
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 查找日志
        blog = get_blog_by_id(cursor, blog_id)
        if not blog:
            result["error"] = f"未找到ID为 {blog_id} 的日志"
            result["message"] = f"❌ 修改失败：未找到ID为 {blog_id} 的日志"
            conn.close()
            return result
        
        # 获取作者信息
        author = find_user_by_id(cursor, blog["user_id"])
        
        # 获取原有宝宝关联
        old_babies = get_blog_babies(cursor, blog_id)
        
        # 计算新内容
        old_content = blog["content"]
        new_content = old_content
        edit_type = ""
        
        if find is not None and replace is not None:
            # 部分替换：查找并替换
            if find not in old_content:
                result["error"] = f"未找到要替换的内容：「{find}」"
                result["message"] = f"❌ 修改失败：原内容中未找到「{find}」"
                conn.close()
                return result
            new_content = old_content.replace(find, replace, 1)  # 只替换第一个匹配
            edit_type = "部分替换"
        elif replace is not None:
            # 全量替换
            new_content = replace.strip()
            edit_type = "全量替换"
        elif append is not None:
            # 追加内容
            new_content = old_content.rstrip() + append
            edit_type = "追加内容"
        
        # 验证新内容不为空
        if not new_content.strip():
            result["error"] = "修改后的内容不能为空"
            result["message"] = "❌ 修改失败：修改后的内容不能为空"
            conn.close()
            return result
        
        # 处理宝宝关联
        new_babies = None
        if babies is not None:
            # 参数处理
            if isinstance(babies, str):
                babies = [b.strip() for b in babies.split(",") if b.strip()]
            
            if not babies:
                result["error"] = "宝宝列表不能为空"
                result["message"] = "❌ 修改失败：宝宝列表不能为空"
                conn.close()
                return result
            
            # 查找所有宝宝
            baby_list = []
            for baby_name in babies:
                found = find_baby_by_name(cursor, baby_name)
                if not found:
                    result["error"] = f"未找到宝宝「{baby_name}」"
                    result["message"] = f"❌ 修改失败：未找到宝宝「{baby_name}」"
                    conn.close()
                    return result
                elif len(found) > 1:
                    names = "、".join([b["name"] for b in found])
                    result["error"] = f"宝宝名称「{baby_name}」匹配到多个：{names}，请使用完整名称"
                    result["message"] = f"❌ 修改失败：「{baby_name}」匹配到多个宝宝，请使用完整名称"
                    conn.close()
                    return result
                else:
                    baby_list.append(found[0])
            
            new_babies = baby_list
        
        # 开始事务
        current_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " +00:00"
        
        # 更新日志内容
        cursor.execute(
            "UPDATE blog SET blog = ?, update_time = ? WHERE id = ?",
            (new_content.strip(), current_time, blog_id)
        )
        
        # 如果提供了新的宝宝关联，更新关联
        if new_babies is not None:
            # 删除原有关联
            cursor.execute("DELETE FROM blog_baby WHERE blog_id = ?", (blog_id,))
            # 插入新关联
            for baby in new_babies:
                cursor.execute(
                    "INSERT INTO blog_baby (blog_id, baby_id) VALUES (?, ?)",
                    (blog_id, baby["id"])
                )
        
        conn.commit()
        
        # 获取最终的宝宝关联
        final_babies = new_babies if new_babies is not None else old_babies
        baby_names = "、".join([b["name"] for b in final_babies])
        
        result["success"] = True
        result["message"] = f"✅ 日志修改成功！ID: {blog_id}，修改方式: {edit_type}，关联宝宝: {baby_names}"
        result["data"] = {
            "blog_id": blog_id,
            "edit_type": edit_type,
            "old_content": old_content,
            "new_content": new_content.strip(),
            "babies": final_babies,
            "author": author,
            "create_time": blog["create_time"],
            "update_time": current_time
        }
        
        conn.close()
        return result
        
    except Exception as e:
        result["error"] = f"数据库错误: {str(e)}"
        result["message"] = f"❌ 修改失败：{str(e)}"
        return result


def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="宝贝日志 - 修改日志")
    parser.add_argument("--id", "-i", required=True, type=int, help="日志ID")
    parser.add_argument("--replace", "-r", help="替换内容（全量替换或部分替换的新内容）")
    parser.add_argument("--find", "-f", help="查找内容（部分替换时使用）")
    parser.add_argument("--append", "-a", help="追加内容")
    parser.add_argument("--babies", "-b", help="新的宝宝关联，多个用逗号分隔（可选）")
    
    args = parser.parse_args()
    
    result = edit_blog(
        blog_id=args.id,
        replace=args.replace,
        find=args.find,
        append=args.append,
        babies=args.babies
    )
    
    # 输出 JSON 结果
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # 返回退出码
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()