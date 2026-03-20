#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
宝贝日志 - 搜索日志脚本

用法：
    python search_blog.py                     # 最近10条日志
    python search_blog.py --limit 20          # 最近20条日志
    python search_blog.py --baby "露西"       # 露西的最近10条日志
    python search_blog.py --keyword "爱哭"    # 包含"爱哭"的最近10条日志
    python search_blog.py --baby "露西" --keyword "爱哭" --limit 10

参数：
    --limit   : 返回数量，默认10
    --baby    : 宝宝名称，可选
    --keyword : 搜索关键字，可选
"""

import sqlite3
import json
import sys
from pathlib import Path

# 数据库路径
DB_PATH = Path(__file__).parent.parent.parent.parent / "express_back" / "babylog_data.db"


def get_connection():
    """获取数据库连接"""
    if not DB_PATH.exists():
        raise Exception(f"数据库文件不存在: {DB_PATH}")
    return sqlite3.connect(DB_PATH)


def find_baby_by_name(cursor, name):
    """根据名称查找宝宝ID，支持模糊匹配"""
    # 先精确匹配
    cursor.execute("SELECT id, name FROM baby WHERE name = ?", (name,))
    result = cursor.fetchone()
    if result:
        return [{"id": result[0], "name": result[1]}]
    
    # 模糊匹配
    cursor.execute("SELECT id, name FROM baby WHERE name LIKE ?", (f"%{name}%",))
    results = cursor.fetchall()
    return [{"id": r[0], "name": r[1]} for r in results]


def search_blogs(limit=10, baby=None, keyword=None):
    """
    搜索日志
    
    Args:
        limit: 返回数量，默认10
        baby: 宝宝名称，可选
        keyword: 搜索关键字，可选
    
    Returns:
        dict: {"success": bool, "message": str, "data": list, "error": str}
    """
    result = {
        "success": False,
        "message": "",
        "data": None,
        "error": None
    }
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 构建 SQL
        sql = """
            SELECT 
                b.id,
                b.blog,
                b.create_time,
                u.familymember as author,
                GROUP_CONCAT(ba.name, '、') as babies
            FROM blog b
            LEFT JOIN user u ON b.user_id = u.id
            LEFT JOIN blog_baby bb ON b.id = bb.blog_id
            LEFT JOIN baby ba ON bb.baby_id = ba.id
        """
        
        where_clauses = []
        params = []
        
        # 宝宝筛选
        if baby:
            baby_list = find_baby_by_name(cursor, baby)
            if not baby_list:
                result["error"] = f"未找到宝宝「{baby}」"
                result["message"] = f"❌ 搜索失败：未找到宝宝「{baby}」"
                conn.close()
                return result
            elif len(baby_list) > 1:
                names = "、".join([b["name"] for b in baby_list])
                result["error"] = f"宝宝名称「{baby}」匹配到多个：{names}，请使用完整名称"
                result["message"] = f"❌ 搜索失败：「{baby}」匹配到多个宝宝，请使用完整名称"
                conn.close()
                return result
            
            where_clauses.append("bb.baby_id = ?")
            params.append(baby_list[0]["id"])
        
        # 关键字搜索
        if keyword:
            where_clauses.append("b.blog LIKE ?")
            params.append(f"%{keyword}%")
        
        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)
        
        sql += " GROUP BY b.id ORDER BY b.create_time DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()
        
        # 格式化结果
        blogs = []
        for row in rows:
            blogs.append({
                "id": row[0],
                "content": row[1],
                "create_time": row[2],
                "author": row[3],
                "babies": row[4] or ""
            })
        
        result["success"] = True
        result["data"] = blogs
        
        # 生成消息
        filter_desc = []
        if baby:
            filter_desc.append(f"宝宝「{baby}」")
        if keyword:
            filter_desc.append(f"关键字「{keyword}」")
        
        filter_str = "、".join(filter_desc) if filter_desc else "全部"
        result["message"] = f"✅ 找到 {len(blogs)} 条日志（筛选条件：{filter_str}，限制：{limit}条）"
        
        return result
        
    except Exception as e:
        result["error"] = f"数据库错误: {str(e)}"
        result["message"] = f"❌ 搜索失败：{str(e)}"
        return result


def format_table(blogs):
    """将结果格式化为表格字符串"""
    if not blogs:
        return "暂无数据"
    
    # 计算列宽
    id_width = max(len(str(b["id"])) for b in blogs)
    id_width = max(id_width, 2)  # 至少2个字符
    
    content_width = max(len(b["content"]) for b in blogs)
    content_width = min(max(content_width, 6), 50)  # 6-50字符
    
    time_width = 25  # 固定宽度
    author_width = max(len(b["author"] or "") for b in blogs)
    author_width = max(author_width, 4)
    
    babies_width = max(len(b["babies"] or "") for b in blogs)
    babies_width = max(babies_width, 6)
    
    # 表头
    header = f"| {'ID':^{id_width}} | {'内容':^{content_width}} | {'创建时间':^{time_width}} | {'家长':^{author_width}} | {'宝宝':^{babies_width}} |"
    separator = f"+-{'-'*id_width}-+-{'-'*content_width}-+-{'-'*time_width}-+-{'-'*author_width}-+-{'-'*babies_width}-+"
    
    lines = [separator, header, separator]
    
    for blog in blogs:
        # 截断内容
        content = blog["content"]
        if len(content) > content_width:
            content = content[:content_width-3] + "..."
        
        # 格式化时间（去掉毫秒和时区）
        create_time = blog["create_time"]
        if create_time:
            # 取前19个字符：YYYY-MM-DD HH:MM:SS
            create_time = create_time[:19]
        
        author = blog["author"] or "-"
        babies = blog["babies"] or "-"
        
        line = f"| {str(blog['id']):^{id_width}} | {content:^{content_width}} | {create_time:^{time_width}} | {author:^{author_width}} | {babies:^{babies_width}} |"
        lines.append(line)
    
    lines.append(separator)
    
    return "\n".join(lines)


def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="宝贝日志 - 搜索日志")
    parser.add_argument("--limit", "-l", type=int, default=10, help="返回数量，默认10")
    parser.add_argument("--baby", "-b", default=None, help="宝宝名称，可选")
    parser.add_argument("--keyword", "-k", default=None, help="搜索关键字，可选")
    
    args = parser.parse_args()
    
    result = search_blogs(
        limit=args.limit,
        baby=args.baby,
        keyword=args.keyword
    )
    
    # 输出结果
    if result["success"]:
        print(result["message"])
        print()
        print(format_table(result["data"]))
    else:
        print(result["message"])
    
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()