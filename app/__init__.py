# -*- coding: utf-8 -*-
from flask import Flask
from flask_sqlalchemy import SQLAlchemy #数据库依赖
from flask_migrate import Migrate #数据库迁移工具
from flask_bootstrap import Bootstrap
from flask_moment import Moment
from flask_login import LoginManager

from flask_ckeditor import CKEditor #pip install flask-ckeditor -i https://pypi.tuna.tsinghua.edu.cn/simple/

# flask run -h 0.0.0.0 -p 80



app = Flask(__name__)#创建flask的实例
app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True

bootstrap = Bootstrap(app)#配置bootstrap
moment = Moment(app)##本地化时间
ckeditor = CKEditor(app)#富文本编辑器
login_manager = LoginManager(app)  # 实例化扩展类

# 配置文件

app.config.from_pyfile('settings.py')
db = SQLAlchemy(app)
migrate = Migrate(app,db)

'''
数据的迁移命令：
flask db init  #创建迁移的环境
flask db migrate -m '添加迁移备注信息'
flask db upgrade #创建表和数据或是更细表
如果无发更新数据库或是无法创建或是修改表结构，可以删除数据库试试。
'''


from app import views, models, commands