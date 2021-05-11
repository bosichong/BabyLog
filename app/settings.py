# -*- coding: utf-8 -*-
import os
import sys

from app.utils import retYearMonth, createDir

from app import app
basedir = os.path.abspath(os.path.dirname(__file__))





# 根据时间创建年份和月份目录保存图片
temppath = os.path.join(basedir, 'app/uploads')
imgpath = os.path.join(temppath, retYearMonth())
BABYLOG_UPLOAD_PATH = imgpath
BLUELOG_POST_PER_PAGE = 20

SECRET_KEY = os.getenv('SECRET_KEY', 'secret string')  # CSRF保护

# SQLite URI compatible
WIN = sys.platform.startswith('win')
if WIN:
    prefix = 'sqlite:///'
else:
    prefix = 'sqlite:////'

# 数据库设置
dev_db = prefix + os.path.join(os.path.dirname(app.root_path), 'data.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', dev_db)

UPLOAD_PATH = os.path.join(basedir, 'uploads')
ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif']

# Flask-CKEditor config
CKEDITOR_SERVE_LOCAL = True
CKEDITOR_FILE_UPLOADER = 'upload'
