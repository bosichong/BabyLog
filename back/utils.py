'''
Author: J.sky bosichong@qq.com
Date: 2022-11-22 09:03:48
LastEditors: J.sky bosichong@qq.com
LastEditTime: 2023-02-16 15:54:55
FilePath: /MiniAdmin/back/utils.py
工具类,密码、验证、权限验证等
python交流学习群号:217840699
'''

import os
import sys
import datetime, time
import zipfile
from functools import wraps

from passlib.context import CryptContext
from pydantic import BaseSettings
from fastapi import HTTPException, status
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from loguru import logger
from database import BASE_DIR, get_casbin_e, get_db
from models import User

LOG_LEVEL = "DEBUG"
logger.remove()  # 删去import logger之后自动产生的handler，不删除的话会出现重复输出的现象
logger.add(os.path.join(BASE_DIR, "logs/logger.log"), level=LOG_LEVEL)
handler_id = logger.add(sys.stderr, level=LOG_LEVEL)

# 执行生成token的地址
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/token")


class AppTokenConfig(BaseSettings):
    """
    在终端通过以下命令生成一个新的密匙:
    openssl rand -hex 32
    加密密钥 这个很重要千万不能泄露了，而且一定自己生成并替换。
    """
    SECRET_KEY = "ededcbe81f2e015697780d536196c0baa6ea26021ad7070867e40b18a51ff8da"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 300  # token失效时间


# 创建一个token的配置项。
APP_TOKEN_CONFIG = AppTokenConfig()

# 密码散列 pwd_context.hash(password)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    """
    description: 校验密码
    return {*} bool
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """
    description: hash密码
    return {*} hashed_password
    """
    return pwd_context.hash(password)


def verify_enforce(token: str, rule):
    """
    casbin权限验证
    :param token:token
    :param rule: object ，action
    :return:
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="您的帐户已锁定！",
        headers={"WWW-Authenticate": "Bearer"},
    )
    e = get_casbin_e()  # 每次都要调用，获取最新的权限规则。
    sub = get_username_by_token(token)  # token中获取用户名
    # print(sub,rule.obj,rule.act)
    if not verify_isActive(sub):
        return e.enforce(sub, rule.obj, rule.act)
    else:
        raise credentials_exception


def verify_isActive(username: str):
    """
    判断用户是否锁定
    :param username:
    :return:
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="当前账户不存在或已被删除！",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = next(get_db()).query(User).filter_by(username=username).first()
    if user:
        return user.is_active
    else:
        raise credentials_exception


def verify_e(e, sub, obj, act):
    return e.enforce(sub, obj, act)


def get_username_by_token(token):
    """
    从token中取出username
    :param token:
    :return:
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # print('获取用户名'+token)
        payload = jwt.decode(token, APP_TOKEN_CONFIG.SECRET_KEY, algorithms=[APP_TOKEN_CONFIG.ALGORITHM])
        username: str = payload.get("sub")  # 从 token中获取用户名
        return username
    except JWTError:
        raise credentials_exception


def caltime(date1, date2):
    '''
    返回两个日期之间的间隔天数
    :param date1:
    :param date2:
    :return:
    '''
    date1 = time.strptime(date1, "%Y-%m-%d")
    date2 = time.strptime(date2, "%Y-%m-%d")
    date1 = datetime.datetime(date1[0], date1[1], date1[2])
    date2 = datetime.datetime(date2[0], date2[1], date2[2])
    # 返回两个变量相差的值，就是相差天数
    # print((date2-date1).days)#将天数转成int型
    return (date2 - date1).days


# 函数名：zip_dir
# 传入参数：源目录、打包文件路径
def zip_dir(source_dir, output_filename):
    zf = zipfile.ZipFile(output_filename, "w", compression=zipfile.ZIP_DEFLATED)
    abs_src = os.path.abspath(source_dir)

    for dirname, subdirs, files in os.walk(source_dir):
        for filename in files:
            absname = os.path.abspath(os.path.join(dirname, filename))

            arcname = absname[len(abs_src) + 1:]

            # print 'zipping %s as %s' % (os.path.join(sourceDirName, file), arcname)

            zf.write(absname, arcname)

    zf.close()
    return True


import copy


def update_array(original_array, parameters):
    '''
    拼装前端权限管理展示数据
    :param original_array:
    :param parameters:
    :return:
    '''
    result = copy.deepcopy(original_array)

    for parameter in parameters:
        # print(parameter)
        if len(parameter) <= 0:
            break
        for original in result:
            if parameter[0] == original[0]:
                result[result.index(original)] = parameter
                break
    for original in result:
        if original not in parameters:
            result[result.index(original)] = []

    return result


def create_directory(dir_path):
    """
    判断目录是否存在，不存在则创建
    :param dir_path: 目录路径
    """
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
        print(f"创建目录 {dir_path} 成功")
    else:
        print(f"目录 {dir_path} 已存在")
