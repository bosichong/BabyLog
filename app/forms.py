# -*- coding: utf-8 -*-

from flask_wtf import FlaskForm
from flask_ckeditor import CKEditorField
from wtforms import StringField, SubmitField, SelectField, TextAreaField, ValidationError, HiddenField, \
    BooleanField, PasswordField,IntegerField, DateField
from wtforms.validators import DataRequired, Email, Length, Optional, URL



class BlogForm(FlaskForm):
    first = StringField('第一次：',)
    language = StringField('学会了语言：',)
    cognitive = StringField('认知：',)
    blog = CKEditorField('Blog：',validators=[DataRequired()])
    submit = SubmitField()

class HealthyForm(FlaskForm):
    height = IntegerField('身高：',validators=[DataRequired()])
    weight = IntegerField('体重：',validators=[DataRequired()])
    submit = SubmitField('添加数据')

class BabyForm(FlaskForm):
    name = StringField('姓名:',validators=[DataRequired()])
    birthday = DateField('生日:',validators=[DataRequired()])
    submit = SubmitField('添加数据')

class SearchForm(FlaskForm):
    key = StringField('',validators=[DataRequired()])
    submit = SubmitField('搜索')

class LoginForm(FlaskForm):
    username = StringField('Username:',validators=[DataRequired()])
    password = PasswordField('Password:',validators=[DataRequired()])
    submit = SubmitField('登录')