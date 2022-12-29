'''
Author: J.sky bosichong@qq.com
Date: 2022-11-21 14:41:49
LastEditors: J.sky bosichong@qq.com
LastEditTime: 2022-11-26 11:20:42
FilePath: /MiniAdmin/back/models.py
python交流学习群号:217840699
model,sub, obj, act 表示经典三元组: 访问实体 (Subject)，访问资源 (Object) 和访问方法 (Action)。
'''

from datetime import datetime
from database import Base
from sqlalchemy import String, Column, Integer, DateTime, ForeignKey, Boolean, Date, Text
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = 'user'
    # 若有多个类指向同一张表，那么在后边的类需要把 extend_existing设为True，表示在已有列基础上进行扩展
    # 或者换句话说，sqlalchemy 允许类是表的字集，如下：
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True, comment='用户ID')
    username = Column(String(32), nullable=False, unique=True, comment='用户昵称')
    hashed_password = Column(String(128), nullable=False, comment='用户密码')
    familymember = Column(String(32), nullable=False, unique=True, comment='家庭成员称呼')

    sex = Column(String(1), nullable=False, default='1', comment='用户性别')
    is_active = Column(Boolean, default=False)
    avatar = Column(String(128), comment='用户头像')
    create_time = Column(DateTime, nullable=False, default=datetime.now, comment='创建时间')
    update_time = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment='更新时间')

    roles = relationship('Role', uselist=True, back_populates='user')
    cos = relationship('CasbinObject', uselist=True, back_populates='user')
    cas = relationship('CasbinAction', uselist=True, back_populates='user')

    blogs = relationship('Blog', uselist=True, back_populates='user')
    photos = relationship('Photo', uselist=True, back_populates='user')


class blog_baby(Base):
    __tablename__ = 'blog_baby'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    blog_id = Column(Integer, ForeignKey('blog.id'), nullable=False)
    baby_id = Column(Integer, ForeignKey('baby.id'), nullable=False)


class Photo(Base):
    __tablename__ = 'photo'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String(256), nullable=False, comment='文件名称')
    file_path = Column(String(256), nullable=False, comment='相片服务器地址')
    file_url = Column(String(256), nullable=False, comment='相片网络地址')

    user_id = Column(Integer, ForeignKey('user.id'), nullable=False, comment='创建者')
    user = relationship('User', back_populates='photos')
    blog_id = Column(Integer, ForeignKey('blog.id'), nullable=False, comment='归属于哪条blog')
    blog = relationship('Blog', back_populates='photos')


class Baby(Base):
    __tablename__ = 'baby'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True, comment='id')
    name = Column(String(32), nullable=False, unique=True, comment='孩子的名称')
    birthday = Column(Date, nullable=False, comment='生日')

    healthys = relationship('Healthy', uselist=True, back_populates='baby')
    # baby多对多blog
    blogs = relationship('Blog', back_populates='babys', secondary='blog_baby')


class Blog(Base):
    __tablename__ = 'blog'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True, comment='id')
    blog = Column(Text, nullable=False, comment='blog')
    create_time = Column(DateTime, nullable=False, default=datetime.now, comment='创建时间')
    update_time = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    # 一对多photo
    photos = relationship('Photo', uselist=True, back_populates='blog')

    user_id = Column(Integer, ForeignKey('user.id'), nullable=False, comment='创建者')
    user = relationship('User', back_populates='blogs')
    # baby多对多blog
    babys = relationship('Baby', back_populates='blogs', secondary='blog_baby')


class Healthy(Base):
    __tablename__ = 'healthy'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True, comment='身高体重数据ID')
    height = Column(Integer, nullable=False, comment='身高')
    weight = Column(Integer, nullable=False, comment='体重')
    create_time = Column(DateTime, nullable=False, default=datetime.now, comment='创建时间')
    update_time = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment='更新时间')

    baby_id = Column(Integer, ForeignKey('baby.id'), nullable=False, comment='baby')
    baby = relationship('Baby', back_populates='healthys')


class Role(Base):
    __tablename__ = 'role'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True, comment='角色id')
    name = Column(String(32), nullable=False, unique=True, comment='角色名称')
    role_key = Column(String(128), nullable=False, unique=True, comment='角色标识')
    description = Column(String(128), nullable=False, comment='角色描述')
    create_time = Column(DateTime, nullable=False, default=datetime.now, comment='创建时间')
    update_time = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment='更新时间')

    user_id = Column(Integer, ForeignKey('user.id'), nullable=False, comment='创建者')
    user = relationship('User', back_populates='roles')


class CasbinObject(Base):
    __tablename__ = 'casbin_object'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True, comment='ID')
    name = Column(String(128), nullable=False, unique=True, comment='资源名称')
    object_key = Column(String(128), nullable=False, unique=True, comment='资源标识')
    description = Column(String(128), nullable=True, comment='资源描述')
    create_time = Column(DateTime, nullable=False, default=datetime.now, comment='创建时间')
    update_time = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False, comment='创建者')
    user = relationship('User', back_populates='cos')


class CasbinAction(Base):
    __tablename__ = 'casbin_action'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True, comment='ID')
    name = Column(String(128), nullable=False, unique=True, comment='动作名称')
    action_key = Column(String(128), nullable=False, unique=True, comment='动作标识')
    description = Column(String(128), nullable=True, comment='动作描述')
    create_time = Column(DateTime, nullable=False, default=datetime.now, comment='创建时间')
    update_time = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment='更新时间')

    user_id = Column(Integer, ForeignKey('user.id'), nullable=False, comment='创建者')
    user = relationship('User', back_populates='cas')


class CasbinRule(Base):
    __tablename__ = "casbin_rule"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    ptype = Column(String(255))
    v0 = Column(String(255))
    v1 = Column(String(255))
    v2 = Column(String(255))
    v3 = Column(String(255))
    v4 = Column(String(255))
    v5 = Column(String(255))
