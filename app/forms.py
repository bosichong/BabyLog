# -*- coding: utf-8 -*-

from flask_wtf import FlaskForm
from flask_ckeditor import CKEditorField
from wtforms import StringField, SubmitField, SelectField, TextAreaField, ValidationError, HiddenField, \
    BooleanField, PasswordField,IntegerField,FloatField, DateField
from wtforms.validators import DataRequired, Email, Length, Optional, URL



class BlogForm(FlaskForm):
    first = StringField('第一次：',)
    language = StringField('学会了语言：',)
    cognitive = StringField('认知：',)
    blog = CKEditorField('Blog：',validators=[DataRequired()])
    submit = SubmitField()

class HealthyForm(FlaskForm):
    height = IntegerField('身高：',validators=[DataRequired()])
    weight = FloatField('体重：',validators=[DataRequired()])
    submit = SubmitField('添加数据')

class EditHealthyForm(FlaskForm):
    height = IntegerField('身高：',validators=[DataRequired()])
    weight = FloatField('体重：',validators=[DataRequired()])
    create_time = DateField('日期:',validators=[DataRequired()])
    submit = SubmitField('添加数据')

class BabyForm(FlaskForm):
    name = StringField('姓名:',validators=[DataRequired()])
    birthday = DateField('生日:',validators=[DataRequired()])
    submit = SubmitField('submit')

class SearchForm(FlaskForm):
    key = StringField('',validators=[DataRequired()])
    submit = SubmitField('搜索')

class LoginForm(FlaskForm):
    username = StringField('Username:',validators=[DataRequired()])
    password = PasswordField('Password:',validators=[DataRequired()])
    submit = SubmitField('登录')

class UserForm(FlaskForm):
    username = StringField('用户名称:',validators=[DataRequired()])
    password = PasswordField('用户密码:',validators=[DataRequired()])
    familymembers = StringField('成员关系:',validators=[DataRequired()])
    gm = IntegerField("管理等级:",validators=[DataRequired()])
    submit = SubmitField('submit')

class EditUserForm(FlaskForm):
    username = StringField('用户名称:',validators=[DataRequired()])
    password = PasswordField('用户密码:',)
    familymembers = StringField('成员关系:',validators=[DataRequired()])
    gm = IntegerField("管理等级:",validators=[DataRequired()])
    submit = SubmitField('submit')