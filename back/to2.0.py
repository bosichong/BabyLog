# -*- coding: UTF-8 -*-
"""
@Author   : J.sky
@Mail     : bosichong@qq.com
@Site     : https://github.com/bosichong
@QQ交流群  : python交流学习群号:217840699
@file      :to2.0.py
@time     :2022/12/18
导入旧版程序数据
"""

import sqlite3
import os, datetime

import models, crud
from database import get_db

db = next(get_db())

baby = crud.get_baby_by_id(db, 1)
user = crud.get_user_by_id(db, 1)

# 导入旧版的babylog数据库
old_babylog_path = os.path.join(os.path.dirname(__file__), 'babylog.db')
conn = sqlite3.connect(old_babylog_path)
# 创建一个cursor对象，cursor.execute()将处理操作与数据库相关的几乎所有命令。
cursor = conn.cursor()
sql = "select * from blog"
res = conn.execute(sql)


def oleblogtonewblog(res):
    for r in res:
        blog = ''
        if r[1]:
            if '第一次' in r[1]:
                blog += r[1] + ' '
            else:
                blog += '第一次' + r[1] + ' '

        if r[2]:
            blog += '学会了语言：' + r[2] + ' '

        if r[3]:
            blog += '认知了：' + r[3] + ' '

        blog += r[4]
        # (730, '', '', '', '今天从姥姥家接回来，在楼下和妞妞玩了一会，说是要尿尿，让回家，还不乐意，到家还哭了半天。', '2017-08-06 10:40:18','2017-08-06 10:40:18', 1, 1)
        # print(r)
        new_blog = models.Blog()
        new_blog.blog = blog
        try:
            new_blog.create_time = datetime.datetime.strptime(r[5], '%Y-%m-%d %H:%M:%S')
        except ValueError:
            new_blog.create_time = datetime.datetime.strptime(r[5], '%Y-%m-%d %H:%M:%S.%f')

        new_blog.user_id = int(r[8])
        new_blog.babys.append(baby)

        print(new_blog.blog)
        db.add(new_blog)
        db.commit()


# 导入旧版的blog，并合并了一些字段的数据
# oleblogtonewblog(res)

sql = 'select * from healthy'
res = conn.execute(sql)


def olghealthytonew(res):
    for h in res:
        # print(h)
        hl = models.Healthy()
        hl.height = h[1]
        hl.weight = h[2]
        try:
            hl.create_time = datetime.datetime.strptime(h[3], '%Y-%m-%d %H:%M:%S')
        except ValueError:
            hl.create_time = datetime.datetime.strptime(h[3], '%Y-%m-%d %H:%M:%S.%f')
        hl.baby_id = baby.id

        db.add(hl)
        db.commit()

# 导入身高体重的数据
# olghealthytonew(res)


def s_img():
    blogs = crud._get_blogs(db)

    for blog in blogs:
        if 'uploads' in blog.blog :
            print(blog.id)
            print(blog.blog)

# s_img()


