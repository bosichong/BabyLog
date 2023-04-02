"""
Author: J.sky bosichong@qq.com
Date: 2022-11-21 09:32:46
LastEditors: J.sky bosichong@qq.com
LastEditTime: 2022-11-21 11:20:48
FilePath: /MiniAdmin/back/v1/main.py
v1
"""

import os
from datetime import datetime, timedelta, date
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from fastapi import FastAPI, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt

import crud, schemas, models
from database import get_db, get_casbin_e, BASE_DIR
from schemas import Token, TokenData
from utils import verify_password, APP_TOKEN_CONFIG, oauth2_scheme, get_username_by_token,\
    get_password_hash, verify_enforce, zip_dir, caltime,update_array

# 相册
PHOTO_PATH = os.path.join(BASE_DIR, 'uploads')
PHOTO_URL = 'http://localhost:8888/uploads/'

router = APIRouter(
    prefix="/v1",
    tags=["v1"],
    responses={404: {"description": "Not found"}},  # 请求异常返回数据
)

no_permission = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="您没有该权限！",
    headers={"WWW-Authenticate": "Bearer"},
)


def return_rule(obj, act):
    """
    返回一个验证权限的规则，包括obj、act。
    :param obj:
    :param act:
    :return:
    """
    return schemas.Casbin_rule(obj=obj, act=act)


######################################
# access_token 系统登陆相关的api接口
######################################

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    """
    生成token
    :param data:
    :param expires_delta:
    :return:
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=APP_TOKEN_CONFIG.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # 生成带有时间限制的token
    encoded_jwt = jwt.encode(to_encode, APP_TOKEN_CONFIG.SECRET_KEY, algorithm=APP_TOKEN_CONFIG.ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str, ):
    """
    认证用户，包括检测用户是否存在，密码校验。
    :param username:
    :param password:
    :param db:
    :return: 成功返回user
    """
    user = crud.get_user_by_username(db, username=username)  # 获取用户信息
    # 用户不存在
    if not user:
        return False
    # 校验密码失败
    if not verify_password(password, user.hashed_password):
        return False
    # 成功返回user
    return user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 获取用户,如果没有或密码错误并提示错误.
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误!",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帐号已被禁用!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=APP_TOKEN_CONFIG.ACCESS_TOKEN_EXPIRE_MINUTES)
    # 生成token
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get('/back_zip')
def back_zip(token: str = Depends(oauth2_scheme)):
    cwd = os.getcwd()
    source_dir = os.path.abspath(os.path.join(cwd, os.pardir))  # 获得上一层目录地址
    output_filename = os.path.join(source_dir, 'baby_back.zip')  # 打包后的文件名
    return zip_dir(source_dir,output_filename)



######################################
# Blog相关的api接口
######################################
@router.get('/blog/get_ecdata')
async def get_ecdata(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    babys = crud.get_babys(db)
    data = []
    for baby in babys:
        legend_data = []
        series = []
        times = []
        legend_data.append(baby.name + '身高(厘米)')
        legend_data.append(baby.name + '体重(公斤)')
        hs = crud.get_healthys_by_babyid(db, baby.id)
        heights = []
        weights = []
        for h in hs:
            heights.append(h.height)
            weights.append(h.weight)
            i = h.create_time
            times.append("%s-%s-%s" % (i.year, i.month, i.day))
        series.append({
            'data':  heights,
            'type':  'line',
            'name':  baby.name + '身高(厘米)',
            'stack': '总量',
        })
        series.append({
            'data':  weights,
            'type':  'line',
            'name':  baby.name + '体重(公斤)',
            'stack': '总量',
        })
        data.append({"legend_data": legend_data, "series": series, "times": times})
    print(data)
    return {"data": data}


@router.get('/blog/get_old_blogs')
async def get_main_old_blogs(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    oldblogs = crud.get_old_by_month_day_data(db)
    blogs = []
    for b in oldblogs:
        # print(b.blog,b.photos)
        photos = []  # 图片地址
        for p in b.photos:
            photos.append(PHOTO_URL + p.file_url)
        baby_names = ''  # 这条blog是关于哪个baby的。
        for baby in b.babys:
            baby_names += baby.name + ' '
        user = crud.get_user_by_id(db, b.user_id)

        blog = {
            'id':          b.id,
            'blog':        b.blog,
            'create_time': datetime.strftime(b.create_time, '%Y-%m-%d %H:%M:%S'),
            'user':        {'id': user.id, 'familymember': user.familymember, 'sex': user.sex, },
            'baby_names':  baby_names,
            'photos':      photos,
        }
        # print(blog)
        blogs.append(blog)
    # print(blogs)
    res = {'blogs': blogs}
    return res


@router.get('/blog/main_babysdata')
async def get_babys_data(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    babys = crud.get_babys(db)
    babydata = []
    for baby in babys:
        year = baby.birthday.isocalendar()[0]  # 生日
        time1 = str(baby.birthday)
        time2 = (str(datetime.now().year) + "-" + str(datetime.now().month) + "-" + str(datetime.now().day))
        time3 = int(datetime.now().strftime("%Y")) - year  # 年龄
        count = crud.get_bb_count_by_baby_id(db, baby.id)
        data = {
            'name':     baby.name,
            'birthday': baby.birthday,
            'year':     time3,
            'day':      caltime(time1, time2),  # 出生天数
            'count':    count,
        }
        babydata.append(data)

    # print(babydata)
    return babydata


@router.post('/blog/update_blog')
async def update_blog(data: schemas.UpdateBlog, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    更新blog
    """
    if verify_enforce(token, return_rule('Blog', 'update')):
        # print(data)
        blog = crud.get_blog_by_id(db, data.blog_id)
        #     删除blog相关联的baby，重新关联
        bbs = crud.get_bb_by_blog_id(db, blog.id)
        for b in bbs:
            db.delete(b)
        db.commit()

        bs = []
        # 关联baby与blog
        for name in data.babys[1]:
            bs.append(crud.get_baby_by_name(db, name))
        for b in bs:
            b.blogs.append(blog)
        blog.blog = data.blog
        db.commit()
        return True
    else:
        raise no_permission


@router.post('/blog/create_blog')
async def create_blog(data: schemas.CreateBlog, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    创建blog
    """
    if verify_enforce(token, return_rule('Blog', 'create')):
        blog = crud.create_blog(db, data.blog, data.user_id)
        # print(blog.id)
        bs = []
        # 关联baby与blog
        for name in data.babys[1]:
            bs.append(crud.get_baby_by_name(db, name))
        for b in bs:
            b.blogs.append(blog)
        db.commit()
        # 添加相片，并关联blog
        for p in data.photos:
            # print(p['response'])
            crud.create_photo(db, p['response']['file_name'], p['response']['file_path'], p['response']['file_url'], data.user_id, blog.id)
        return True
    else:
        raise no_permission


@router.get('/blog/get_blogs', )
async def get_blogs(skip: int = 0, limit: int = 10, keyword: str = '', token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    bs = crud.get_blogs(db, keyword=keyword, skip=skip, limit=limit)
    # print(bs)
    blogs = []
    for b in bs:
        # print(b.blog,b.photos)
        photos = []  # 图片地址
        for p in b.photos:
            photos.append(PHOTO_URL + p.file_url)
        baby_names = ''  # 这条blog是关于哪个baby的。
        for baby in b.babys:
            baby_names += baby.name + ' '
        user = crud.get_user_by_id(db, b.user_id)

        blog = {
            'id':          b.id,
            'blog':        b.blog,
            'create_time': datetime.strftime(b.create_time, '%Y-%m-%d %H:%M:%S'),
            'user':        {'id': user.id, 'familymember': user.familymember, 'sex': user.sex, },
            'baby_names':  baby_names,
            'photos':      photos,
        }
        blogs.append(blog)
    blog_count = crud.get_blogs_count_by_keyword(db, keyword)
    res = {'blogs': blogs, 'blog_count': blog_count}
    return res


@router.get('/blog/delete_blog')
async def delete_blog(id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    删除blog
    """
    if verify_enforce(token, return_rule('Blog', 'delete')):
        delete_exception = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="删除失败!",
            headers={"WWW-Authenticate": "Bearer"},
        )

        blog = crud.get_blog_by_id(db, id)
        # 删除photo以及数据库里的记录
        for p in blog.photos:
            file_path = os.path.join(PHOTO_PATH, p.file_path)
            # print(file_path)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    crud.delete_photo_by_id(db, p.id)
                except Exception as e:
                    raise delete_exception
            else:
                crud.delete_photo_by_id(db, p.id)
        bbs = crud.get_bb_by_blog_id(db, blog.id)
        for b in bbs:
            # print(b.id)
            crud.delete_bb_by_id(db, b.id)
        db.delete(blog)
        db.commit()
        return True
    else:
        raise no_permission


@router.get('/blog/get_blog_by_id')
async def get_blog_by_id(blog_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    tmbs = crud.get_babys(db)
    bs1 = []
    for tb in tmbs:
        bs1.append(tb.name)
    blog = crud.get_blog_by_id(db, blog_id)
    bs2 = blog.babys
    babynames = []
    for baby in bs2:
        babynames.append(baby.name)

    return {'blog': blog.blog, 'babys': [bs1, babynames]}


@router.get('/blog/get_baby_names')
async def get_babys_name(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    tmbs = crud.get_babys(db)
    bs1 = []
    for tb in tmbs:
        bs1.append(tb.name)
    return {'babys': [bs1, []]}


######################################
# Photo相关的api接口
######################################
@router.post("/blog/uploadfile/")
async def create_upload_file(file: UploadFile, token: str = Depends(oauth2_scheme)):
    # 将图片安年份分类存储，组装各种参数。
    today = datetime.today()
    year_str = str(today.year)
    file_suffix = os.path.splitext(file.filename)[-1]  # 获取图片的后缀
    file_name = str(today.year) + str(today.month) + str(today.day) + str(today.hour) + str(today.minute) + str(today.microsecond) + file_suffix
    temp_path = os.path.join(PHOTO_PATH, year_str)  # 存档当年的图片目录
    if not os.path.exists(temp_path):  # 若目录不存在则创建
        os.mkdir(temp_path)
    file_path = os.path.join(temp_path, file_name)  # 相片存放的地址
    f_path = os.path.join(year_str, file_name)  # 相片存放的地址
    file_url = year_str + '/' + file_name  # 网络相对地址
    try:
        res = await file.read()
        with open(file_path, 'wb') as f:
            f.write(res)
        return {"message": "success", 'file_path': f_path, 'file_name': file_name, 'file_url': file_url}
    except Exception as e:
        return {"message": str(e)}


@router.post('/blog/delete_img')
async def delete_upload_file(data: schemas.PhotoPath, token: str = Depends(oauth2_scheme)):
    # print(data.photo_path)
    delete_exception = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="删除失败!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    file_path = os.path.join(PHOTO_PATH, data.photo_path)

    # print(os.path.exists(file_path))
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            raise delete_exception
    else:
        raise delete_exception


######################################
# Baby相关的api接口
######################################

@router.get('/blog/get_babys')
async def get_babys(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_babys(db)


@router.post('/blog/create_baby')
async def create_baby(data: schemas.Baby, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Baby', 'create')):
        # print(data)
        date_str = data.birthday
        return crud.create_baby(db, data.name, date(*map(int, date_str.split('-'))))
    else:
        raise no_permission


@router.get('/blog/delete_baby')
async def delete_baby(baby_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Baby', 'delete')):
        return crud.delete_baby_by_id(db, baby_id)
    else:
        raise no_permission


@router.get('/blog/get_baby')
async def get_baby_by_id(baby_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_baby_by_id(db, baby_id)


@router.post('/blog/update_baby')
async def update_baby(data: schemas.UpdateBaby, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Baby', 'update')):
        pass
    else:
        raise no_permission
    print(data)
    baby = crud.get_baby_by_id(db, data.old_baby_id)
    baby.name = data.name
    date_str = data.birthday
    baby.birthday = date(*map(int, date_str.split('-')))
    db.commit()
    return True


######################################
# Healthy相关的api接口
######################################
@router.get('/blog/get_healthy_by_id')
async def get_healthy(healthy_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_healthy_by_id(db, healthy_id)


@router.get('/blog/get_healthy')
async def get_Healthys(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_healthys(db)


@router.post('/blog/create_healthy')
async def create_healthy(data: schemas.CreateHealthy, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Healthy', 'create')):
        pass
    else:
        raise no_permission

    # print(data.babys[1])
    baby = crud.get_baby_by_name(db, data.babys[1])
    return crud.create_healthy(db, data.height, data.weight, baby.id)


@router.post('/blog/update_healthy')
async def update_healthy(data: schemas.UpdateHealthy, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Healthy', 'update')):
        pass
    else:
        raise no_permission

    try:
        healthy = crud.get_healthy_by_id(db, data.old_healthy_id)
        healthy.height = data.height
        healthy.weight = data.weight
        db.commit()
        return True
    except Exception as e:
        return False


@router.get('/blog/delete_healthy')
async def delete_healthy(healthy_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Healthy', 'delete')):
        return crud.delete_healthy_by_id(db, healthy_id)
    else:
        raise no_permission


######################################
# User相关的api接口
######################################

@router.post('/user/create_user')
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="用户名称重复！",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # 注册用户名称不能与用户组的role_key重复。
    role = crud.get_role_by_role_key(db, user.username)
    if role:
        raise credentials_exception
    return crud.create_user(db, user.username, user.password, user.sex, user.familymember)


@router.get("/user/me", response_model=schemas.User)
async def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    返回当前用户的资料
    """
    username = get_username_by_token(token)
    user = crud.get_user_by_username(db, username)
    return user


@router.get('/user/user_by_id', response_model=schemas.User)
async def get_user_by_id(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), user_id: int = 0):
    """
    获取指定id用户的资料
    :param token:
    :param db:
    :param user_id:
    :return: schemas.User
    """
    if verify_enforce(token, return_rule('User', 'read')):
        return crud.get_user_by_id(db, user_id)
    else:
        raise no_permission


@router.get('/user/get_users', response_model=schemas.Users)
async def get_users(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), skip: int = 0, limit: int = 10, keyword: str = ''):
    users = schemas.Users(users=crud.get_users(db, skip, limit, keyword), count=crud.get_users_count_by_keyword(db, keyword))
    return users


@router.get('/user/active_change')
async def user_active_change(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), user_id: int = 0):
    """
    修改用户锁定
    :param token:
    :param db:
    :param user_id:
    :return:
    """
    if verify_enforce(token, return_rule('User', 'update')):
        return crud.active_change(db, user_id)
    else:
        raise no_permission


@router.get('/user/delete_user')
async def delete_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), user_id: int = 0):
    """
    删除用户
    :param token:
    :param db:
    :param user_id:
    :return:
    """
    if verify_enforce(token, return_rule('User', 'delete')):
        return crud.delete_user_by_id(db, user_id)
    else:
        raise no_permission


@router.post('/user/update_user')
async def update_user(user: schemas.UserUpdate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    修改用户资料
    :param user:
    :param token:
    :param db:
    :return:
    """
    if verify_enforce(token, return_rule('User', 'update')):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名称重复！",
            headers={"WWW-Authenticate": "Bearer"},
        )
        u = crud.get_user_by_id(db, user.user_id)
        # 修改用户名称不能与用户组的role_key重复。
        role = crud.get_role_by_role_key(db, user.username)
        if role:
            raise credentials_exception
        u.username = user.username
        u.sex = user.sex
        u.familymember = user.familymember
        if user.password != '':
            hashed_password = get_password_hash(user.password)
            u.hashed_password = hashed_password
        try:
            db.commit()
            return True
        except:
            return False
    else:
        raise no_permission


@router.post('/user/update_me')
async def update_me(user: schemas.UserUpdate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    修改用户资料
    :param user:
    :param token:
    :param db:
    :return:
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    username = get_username_by_token(token)
    me = crud.get_user_by_username(db, username)
    if user.user_id == me.id:
        u = crud.get_user_by_id(db, user.user_id)
        u.username = user.username
        u.familymember = user.familymember
        u.sex = user.sex
        if user.password != '':
            hashed_password = get_password_hash(user.password)
            u.hashed_password = hashed_password
        try:
            db.commit()
            return True
        except:
            raise credentials_exception
    else:
        raise credentials_exception


@router.post('/user/change_user_role')
async def change_user_role(data: schemas.ChangeUserRole, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    修改用户拥有的用户组
    :param data:
    :param token:
    :param db:
    :return:
    """
    if verify_enforce(token, return_rule('User', 'update')):
        # 将用户组名称改成role_key
        role_keys = []
        for name in data.names:
            role = crud.get_role_by_name(db, name)
            role_keys.append(role.role_key)
        return crud.change_user_role(db, data.user_id, role_keys)
    else:
        raise no_permission


@router.get('/user/get_user_role')
async def get_user_role(user_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    获取用户所拥有的用户组
    :param user_id:
    :param token:
    :param db:
    :return:
    """

    if verify_enforce(token, return_rule('User', 'read')):
        user = crud.get_user_by_id(db, user_id)
        roles = crud.get_roles(db)
        options = []  # 所有的权限组名称
        for role in roles:
            options.append(role.name)

        checkeds = []  # 当前用户所拥有的用户组
        crs = crud.get_casbin_rules_by_username(db, user.username)
        for cr in crs:
            role = crud.get_role_by_role_key(db, cr.v1)
            checkeds.append(role.name)
        return {'options': options, 'checkeds': checkeds}
    else:
        raise no_permission


######################################
# role相关的api接口
######################################
@router.get('/role/get_roles')
async def get_roles(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_roles(db)


@router.post('/role/create_role')
async def create_role(role: schemas.Role, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), ):
    """
    创建 role
    :param role:
    :param token:
    :param db:
    :return:
    """
    if verify_enforce(token, return_rule('Role', 'create')):
        new_role = models.Role()
        new_role.name = role.name
        new_role.role_key = role.role_key
        new_role.description = role.description
        new_role.user_id = int(role.user_id)
        return crud.create_role(db, new_role)
    else:
        raise no_permission


@router.get('/role/get_role_by_id')
async def get_role_by_id(role_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Role', 'read')):
        return crud.get_role_by_id(db, role_id)
    else:
        raise no_permission


@router.post('/role/update_role')
async def update_role_by_id(role: schemas.EditRole, token: str = Depends(oauth2_scheme),
                            db: Session = Depends(get_db)):
    """
    修改role
    :param role:
    :param token:
    :param db:
    :return:
    """
    if verify_enforce(token, return_rule('Role', 'update')):
        new_role = models.Role()
        new_role.name = role.name
        new_role.role_key = role.role_key
        new_role.description = role.description
        return crud.update_role_by_id(db, role.old_role_id, new_role)
    else:
        raise no_permission


@router.get('/role/delete_role')
async def delete_role_by_id(role_id: int, token: str = Depends(oauth2_scheme),
                            db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('Role', 'delete')):
        return crud.delete_role_by_id(db, role_id)
    else:
        raise no_permission


@router.get('/role/get_coca')
async def get_co_ca(role_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    返回用户组role所包含的权限用于前端使用多选框来展示
    <div  v-for="(item,index) of options.value" >
        <a-checkbox-group v-model:value="checkeds.value[index]" :options="item" />
    </div>

    其中options、checkeds是两个数组，前者包括了所有的权限列表，后者只包括当前用户组所拥有的权限。
    :param role_id: 用户则的id
    :param token:
    :param db:
    :return:
    """
    cos = crud.get_casbin_objects(db)
    cas = crud.get_casbin_actions(db)
    role = crud.get_role_by_id(db, role_id)
    all_co_ca = []  # 拼装所有权限的列表
    co_key_name = {}  # 组装一个字典，里边的资源key对应name
    ca_key_name = {}  # 组装一个字典，里边的动作key对应name
    # 一个临时的资源和动作的名称数组，类似下边
    # ['用户管理', '增', '用户管理', '删', '用户管理', '改', '角色管理', '增', '角色管理', '删', '角色管理', '改']

    """
    # 群里大佬提供的算法。
    input = ['用户管理', '增', '用户管理', '删', '用户管理', '改', '用户管理', '查', '用户管理', '显', '角色管理', '增', '角色管理', '删', '角色管理', '改', 
    '角色管理', '查', '角色管理', '显', '资源管理', '增', '资源管理', '删', '资源管理', '改', '资源管理', '查', '资源管理', '显', '动作管理', '增', '动作管理', '删', 
    '动作管理', '改', '动作管理', '查', '动作管理', '显', '资源分类', '增', '资源分类', '删', '资源分类', '改', '资源分类', '查', '资源分类', '显']
    
    m = dict()
    key = ''
    for i in range (len(input)):
        if i % 2 == 0:
           key = input[i]
        else:
            if m.get(key) != None: 
                m[key].append(input[i])
            else:
                m[key] = [input[i]]
    
    res = []
    
    for key in m.keys():
        item = [key]
        item = item + m[key]
        res.append(item)
    
    print(res)
    
    
    """
    cks = []
    checkeds = []  # 当前用户组所拥有的权限
    for co in cos:
        coca = [co.name]
        for ca in cas:
            coca.append(ca.name)
        all_co_ca.append(coca)

    for co in cos:
        co_key_name[co.object_key] = co.name
    for ca in cas:
        ca_key_name[ca.action_key] = ca.name

    crs = crud.get_casbin_rules_by_role_key(db, role.role_key)

    for cr in crs:
        cks.append(co_key_name[cr.v1])
        cks.append(ca_key_name[cr.v2])
    # print(cks)
    temp_nams = list()
    for ck in cks:
        if len(temp_nams) == 0:
            temp_nams.append(ck)
            # print(temp_nams)
        elif temp_nams[0] == ck:
            pass
        elif ck in co_key_name.values() and ck != temp_nams[0]:
            checkeds.append(temp_nams)
            temp_nams = [ck]
        elif ck in ca_key_name.values() and ck not in temp_nams:
            temp_nams.append(ck)
            # print(temp_nams)
    checkeds.append(temp_nams)
    # print(checkeds)
    return {'options': all_co_ca, 'checkeds': update_array(all_co_ca,checkeds)}


@router.post('/role/change_role')
async def change_role(cr_data: schemas.ChangeRole, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    修改用户组所拥有的权限
    :param cr_data:
    :param token:
    :param db:
    :return:
    """
    if verify_enforce(token, return_rule('Role', 'update')):
        role = crud.get_role_by_id(db, cr_data.role_id)
        cos = crud.get_casbin_objects(db)
        cas = crud.get_casbin_actions(db)
        co_name_key = {}  # 组装一个字典，里边的资源name对应key
        ca_name_key = {}  # 组装一个字典，里边的动作name对应key
        change_crs = []  # 准备要更新添加的所有casbinrule。

        for co in cos:
            co_name_key[co.name] = co.object_key
        for ca in cas:
            ca_name_key[ca.name] = ca.action_key

        for crs in cr_data.checkeds:
            if crs:
                try:
                    object_key = co_name_key[crs[0]]
                except:
                    return False
                cr_name = crs[0]
                # print(len(crs))
                if len(crs) <= 1:
                    return False
                for cr in crs:
                    # print(cr, cr_name)
                    if cr != cr_name:
                        # print(role.role_key, object_key, ca_name_key[cr])
                        change_crs.append(models.CasbinRule(ptype='p', v0=role.role_key, v1=object_key, v2=ca_name_key[cr]))

        return crud.change_role_casbinrules(db, role.role_key, change_crs)
    else:
        raise no_permission


######################################
# CasbinObject相关的api接口
######################################

@router.get('/co/get_cos')
async def get_cos(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_casbin_objects(db)


@router.post('/co/create_co')
async def create_casbin_object(co: schemas.createCasbinObject, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    创建资源
    :param co:
    :param token:
    :param db:
    :return:
    """
    if verify_enforce(token, return_rule('CasbinObject', 'create')):
        new_co = models.CasbinObject()
        new_co.name = co.name
        new_co.object_key = co.object_key
        new_co.description = co.description
        new_co.user_id = co.user_id
        return crud.create_casbin_object(db, new_co)
    else:
        raise no_permission


@router.get('/co/get_co')
async def get_casbin_object(co_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_casbin_object_by_id(db, co_id)


@router.post('/co/update_co')
async def update_casbin_object_by_id(co: schemas.EditCasbinObject, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('CasbinObject', 'update')):
        return crud.update_casbin_object(db, co.old_co_id, co.name, co.object_key, co.description)
    else:
        raise no_permission


@router.get('/co/delete_co')
async def delete_casbin_object_by_id(co_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('CasbinObject', 'read')):
        return crud.delete_casbin_object_by_id(db, co_id)
    else:
        raise no_permission


######################################
# CasbinAction相关的api接口
######################################

@router.get('/ca/get_cas')
async def get_cas(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_casbin_actions(db)


@router.post('/ca/create_ca')
async def create_ca(ca: schemas.createCasbinAction, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('CasbinAction', 'create')):
        new_ca = models.CasbinAction()
        new_ca.name = ca.name
        new_ca.action_key = ca.action_key
        new_ca.description = ca.description
        new_ca.user_id = ca.user_id
        return crud.create_casbin_action(db, new_ca)
    else:
        raise no_permission


@router.get('/ca/get_ca')
async def get_ca(ca_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return crud.get_casbin_action_by_id(db, ca_id)


@router.post('/ca/update_ca')
async def update_ca(ca: schemas.EditCasbinAction, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('CasbinAction', 'update')):
        return crud.update_casbin_action_by_id(db, ca.old_ca_id, ca.name, ca.action_key, ca.description)
    else:
        raise no_permission


@router.get('/ca/delete_ca')
async def delete_ca(ca_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if verify_enforce(token, return_rule('CasbinAction', 'delete')):
        return crud.delete_casbin_action_by_id(db, ca_id)
    else:
        raise no_permission


######################################
# Casbin 权限验证的api接口
######################################

@router.get('/get_menu')
async def get_menu_permissions(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    rules = [
        ['Blog', 'show'],
        ['Baby', 'show'],
        ['Healthy', 'show'],
        ['User', 'create'],
        ['Role', 'show'],
        ['CasbinObject', 'show'],
        ['CasbinAction', 'show'],
    ]
    menu = {}
    for r in rules:
        if verify_enforce(token, schemas.Casbin_rule(obj=r[0], act=r[1])):
            menu[r[0]] = True
        else:
            menu[r[0]] = False
    # print(menu)
    return menu


@router.post('/isAuthenticated')
async def isAuthenticated(rule: schemas.Casbin_rule, token: str = Depends(oauth2_scheme), ):
    """
    路由页面的权限验证接口
    :param rule:
    :param token:
    :return:
    """
    # print("路由权限验证")
    return verify_enforce(token, rule)


@router.post("/casbin_rule_test")
async def casbin_test(token: str = Depends(oauth2_scheme)):
    """
    一个关于权限接口的简单测试
    :param token:
    :return:
    """
    rule = schemas.Casbin_rule(obj='User', act='read')
    if verify_enforce(token, rule):
        return True
    else:
        return False
