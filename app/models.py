# -*- coding: utf-8 -*-

from datetime import datetime

from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash


class Baby(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32), unique=True)
    birthday = db.Column(db.Date)
    blogs = db.relationship('Blog', backref='baby', lazy='dynamic')
    healthys = db.relationship('Healthy', backref='baby', lazy='dynamic')

    def __inti__(self, name, birthday):
        self.name = name
        self.birthday = birthday

    def __repr__(self):
        return '<Baby {}>'.format(self.name)


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(32), unique=True)
    password = db.Column(db.String(128))
    gm = db.Column(db.Integer)
    familymembers = db.Column(db.String(32), unique=True)
    blogs = db.relationship('Blog', backref='user', lazy='dynamic')

    def set_password(self, password):  # 用来设置密码的方法，接受密码作为参数
        self.password = generate_password_hash(password)  # 将生成的密码保存到对应字段

    def validate_password(self, password):  # 用于验证密码的方法，接受密码作为参数
        return check_password_hash(self.password, password)  # 返回布尔值

    def __repr__(self):
        return'<User {}:{}>'.format(self.name, self.amilymembers)


class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first = db.Column(db.String(200))
    language = db.Column(db.String(200))
    cognitive = db.Column(db.String(200))
    blog = db.Column(db.Text)
    create_time = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    update_time = db.Column(db.DateTime, default=datetime.utcnow)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __inti__(self, first='',language='',cognitive='',blog='',):
        self.first=first
        self.language=language
        self.cognitive=cognitive
        self.blog=blog


class Healthy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    height = db.Column(db.Integer)
    weight = db.Column(db.Float)
    create_time = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    baby_id = db.Column(db.Integer, db.ForeignKey('baby.id'))



