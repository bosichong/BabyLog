'''
Author: J.sky bosichong@qq.com
Date: 2022-11-21 09:16:37
LastEditors: J.sky bosichong@qq.com
LastEditTime: 2023-02-25 08:53:30
FilePath: /MiniAdmin/back/main.py
MiniAdmin,一个简洁轻快的后台管理框架
'''

import os
import sys
from utils import create_directory


# 将当前目录添加到系统变量中
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 解决跨域
import uvicorn as uvicorn

from database import Base, engine, get_db
from api_v1 import router
import crud

from fastapi.responses import HTMLResponse  # 响应html
from fastapi.staticfiles import StaticFiles  # 设置静态目录

__version__ = "2.0.3"
description = '''Mini Admin,一个简洁轻快的后台管理框架.支持拥有多用户组的RBAC管理后台 🚀'''

app = FastAPI(
    title="MiniAdmin",
    description=description,
    version=__version__,
    terms_of_service="#",
    license_info={
        "name": "MIT",
        "url":  "https://opensource.org/licenses/MIT",
    },
)

# 配置允许域名
origins = [
    "http://localhost",
    "http://localhost:8888",
    "http://192.168.0.88:8888",
    "http://localhost:5173",
    "http://127.0.0.1:5173",

]
# 配置允许域名列表、允许方法、请求头、cookie等
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

create_directory("uploads")

# 静态资源
app.mount("/dist", StaticFiles(directory=os.path.join(BASE_DIR, 'dist')), name="dist")
app.mount("/assets", StaticFiles(directory=os.path.join(BASE_DIR, 'dist/assets')), name="assets")
app.mount("/uploads", StaticFiles(directory=os.path.join(BASE_DIR, 'uploads')), name="uploads")

# 删除表，当更新表的结构时可以使用，但是会删除所有数据。慎用！！！！
# models.Base.metadata.drop_all(bind=engine)
# 在数据库中生成表结构
Base.metadata.create_all(bind=engine)
# 生成初始化数据，添加了一个超级管理员并赋予所有管理权限，以及一些虚拟的用户。
crud.create_data(next(get_db()))


@app.get("/")
def main():
    '''
    集成后站点首页
    '''
    html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'index.html')
    html_content = ''
    with open(html_path, encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)


if __name__ == '__main__':
    print('少年，我看你骨骼精奇，是万中无一的编程奇才，有个程序员大佬qq群[217840699]你加下吧!维护世界和平就靠你了！')
    uvicorn.run(app='main:app', host="localhost", port=8888, reload=True, )
