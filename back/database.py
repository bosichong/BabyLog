'''
Author: J.sky bosichong@qq.com
Date: 2022-11-21 09:45:04
LastEditors: J.sky bosichong@qq.com
LastEditTime: 2022-11-24 09:33:37
FilePath: /MiniAdmin/back/database.py
数据库以及连接的配置.
python交流学习群号:217840699
'''

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import casbin
from casbin_sqlalchemy_adapter import Adapter

# 将当前目录添加到系统变量中
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)


# 创建一个使用内存的SQLite数据库 pytest专用。
SQLALCHEMY_DATABASE_MEMORY = "sqlite+pysqlite:///:memory:"
engine_test = create_engine(SQLALCHEMY_DATABASE_MEMORY, echo=False, )
SessionLocal_test = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def get_db_to_T_E_S_T():
    '''
    pytest专用
    description: 获取一个数据连接 异步fastapi下使用.
    return ssesion
    '''
    db = SessionLocal_test()
    try:
        yield db
    finally:
        db.close()


# 组装数据库的绝对地址
DB_DIR = os.path.join(BASE_DIR, 'miniadmin_data.db')
# 数据库访问地址
SQLALCHEMY_DATABASE_URL = "sqlite:///" + DB_DIR
# 创建物理SQLite数据库
engine = create_engine(SQLALCHEMY_DATABASE_URL + '?check_same_thread=False', echo=False, )
# 启动会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, )


def get_db():
    '''
    dev
    description: 获取一个数据连接 异步fastapi下使用.
    return ssesion
    '''
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 数据模型的基类
Base = declarative_base()

# casbin 相关配置
adapter = Adapter(engine)
model_path = os.path.join(BASE_DIR, 'rbac_model.conf')


def get_casbin_e():
    """
    返回一个
    :return:
    """
    return casbin.Enforcer(model_path, adapter)
