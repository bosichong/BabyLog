# -*- coding: utf-8 -*-
from app.utils import *
from app.models import *
from app.forms import *
from flask_login import login_user, login_required, logout_user, current_user
from flask_ckeditor import upload_success, upload_fail
from app import app, db, login_manager
import os
import datetime

from flask import flash, redirect, url_for, render_template, request, send_from_directory, jsonify, session


login_manager.login_view = 'login'


@app.route('/')
@login_required  # 登录保护
def index():

    babys = Baby.query.all()  # 返回所有孩子的数据
    babydata = []
    for baby in babys:
        tmpdata = []
        tmpdata.append(baby.name)  # 名字
        year = baby.birthday.isocalendar()[0]  # 生日
        tmpdata.append(baby.birthday)
        time1 = str(baby.birthday)
        time2 = (str(datetime.datetime.now().year) + "-" + str(datetime.datetime.now().month) + "-" + str(
            datetime.datetime.now().day))
        tmpdata.append(
            int(datetime.datetime.now().strftime("%Y")) - year)  # 年龄
        tmpdata.append(caltime(time1, time2))  # 出生天数
        tmpdata.append(Blog.query.filter_by(baby_id=baby.id).count())  # 记录条数

        tmpdata.append(baby.id)
        babydata.append(tmpdata)

        ###########################
        # 那年几天的数据
        ###########################
        y = datetime.datetime.now().strftime("%Y")  # 现在的年份
        m = datetime.datetime.now().strftime("%m")  # 现在的月份
        d = datetime.datetime.now().strftime("%d")  # 现在的日期
        # d = 17
        # print(y,m,d)
        blogrst = Blog.query.all()
        oldblogs = []
        for blog in blogrst:
            year = blog.create_time.year
            month = blog.create_time.month
            day = blog.create_time.day
            # print(year,month,day)
            if day == int(d) and month == int(m) and year != int(y):
                oldblogs.append(blog)
        # print(oldblogs)

    return render_template('index.html', babydata=babydata, oldblogs=oldblogs)


@app.route('/api_hrjson')
def HealthyRestJson():
    data = Healthy.query.order_by(Healthy.create_time).all()
    times = []
    weight = []
    height = []
    for d in data:
        i = d.create_time
        times.append("%s-%s-%s" % (i.year, i.month, i.day))
        weight.append(d.weight)
        height.append(d.height)
    rs = {'times': times, 'weight': weight, 'height': height}
    return jsonify(rs)


@app.route('/list', methods=['GET', 'POST'])
@login_required  # 登录保护
def bloglist():
    form = SearchForm()
    if request.args.get('key'):#如果有搜索关键字
        key = '%'+str(request.args.get('key'))+'%'
    page = request.args.get('page', 1, type=int)
    per_page = app.config['BLUELOG_POST_PER_PAGE']
    if request.args.get('key'):#如果有搜索关键字
        pagination = Blog.query.filter(Blog.blog.like(key)).order_by(
            Blog.create_time.desc()).paginate(page, per_page=per_page)
    else:
        pagination = Blog.query.order_by(#正常的列表页
            Blog.create_time.desc()).paginate(page, per_page=per_page)

    blogs = pagination.items
    # blogs = Blog.query.all()
    return render_template('bloglist.html', blogs=blogs, pagination=pagination, form=form)


@app.route('/updblog/<int:id>', methods=['GET', 'POST'])
@login_required  # 登录保护
def updBlog(id):
    form = BlogForm()
    form.submit.value="修改数据"
    blog = Blog.query.get(id)
    if form.validate_on_submit():
        blog.first = form.first.data
        blog.language = form.language.data
        blog.cognitive = form.cognitive.data
        blog.blog = form.blog.data
        blog.update_time = datetime.datetime.utcnow()
        db.session.commit()
        flash('数据修改成功！')
        return render_template('updblog.html', form=form)
    form.first.data = blog.first
    form.language.data = blog.language
    form.cognitive.data = blog.cognitive
    form.blog.data = blog.blog
    return render_template('updblog.html', form=form)


@app.route('/add', methods=['GET', 'POST'])
@login_required  # 登录保护
def addBlog():
    form = BlogForm()
    if form.validate_on_submit():
        first = form.first.data
        language = form.language.data
        cognitive = form.cognitive.data
        blog = form.blog.data
        newblog = Blog(first=first, language=language,
                       cognitive=cognitive, blog=blog)
        newblog.baby_id = 1
        newblog.user_id = current_user.id
        db.session.add(newblog)
        db.session.commit()
        flash('数据添加成功！')
        # 清空表格数据
        form.blog.data = ""
        form.first.data = ""
        form.language.data = ""
        form.cognitive.data = ""
        return render_template('addblog.html', form=form)
    return render_template('addblog.html', form=form)


@app.route('/addHealthy', methods=['GET', 'POST'])
@login_required  # 登录保护
def addHealthy():
    form = HealthyForm()
    if form.validate_on_submit():
        data = Healthy()
        data.height = form.height.data
        data.weight = form.weight.data
        data.baby_id = 1
        db.session.add(data)
        db.session.commit()
        form.height.data = ''
        form.weight.data = ''
        flash('数据添加成功！')
        return render_template('addHealthy.html', form=form)  # 重定向回首页
    return render_template('addHealthy.html', form=form)




###################################
#用户密码及资料修改
###################################



@app.route('/admin')
def adminindex():
    users = User.query.all()
    babys = Baby.query.all()
    healthys = Healthy.query.all()
    return render_template('admin.html',users= users,babys=babys,healthys = healthys)

@app.route('/adduser', methods=['GET', 'POST'])
@login_required  
def addUser():
    form = UserForm()
    if form.validate_on_submit():
        if isUserNameOk(form.username.data):
            flash('名字重复，请换个名称！')
            return render_template('edituser.html',form=form)
        user = User()
        user.username = form.username.data
        if form.password.data:
            user.set_password(form.password.data)
        user.familymembers =form.familymembers.data
        user.gm = form.gm.data
        db.session.add(user)
        db.session.commit()
        flash(('数据修改成功！'))
        return render_template('edituser.html',form=form)
    return render_template('edituser.html',form=form)

@app.route('/addbaby', methods=['GET', 'POST'])
@login_required  # 登录保护
def addBaby():
    form = BabyForm()
    if form.validate_on_submit():
        if isBabyNameOk(form.name.data):
            flash('名字重复，请换个名称！')
            return render_template('addbaby.html', form=form)
        baby = Baby()
        baby.name = form.name.data
        baby.birthday = form.birthday.data
        db.session.add(baby)
        db.session.commit()
        form.name.data = ''
        form.birthday.data = ''
        flash('数据添加成功！')
        return render_template('addbaby.html', form=form)  # 重定向回首页
    return render_template('addbaby.html', form=form)

@app.route('/edituser/<int:id>', methods=['GET', 'POST'])
@login_required  
def editUser(id):
    form = EditUserForm()
    user = User.query.get(id)
    if form.validate_on_submit():
        if isUserNameOk(form.username.data):
            flash('名字重复，请换个名称！')
            return render_template('edituser.html',form=form)
        user.username = form.username.data
        if form.password.data:
            user.set_password(form.password.data)
        user.familymembers =form.familymembers.data
        user.gm = form.gm.data
        db.session.commit()
        flash(('数据修改成功！'))
        return render_template('edituser.html',form=form)
    form.username.data = user.username
    form.password.data =''
    form.familymembers.data = user.familymembers
    form.gm.data = user.gm
    return render_template('edituser.html',form=form)

@app.route('/editbaby/<int:id>', methods=['GET', 'POST'])
@login_required  # 登录保护
def editBaby(id):
    form = BabyForm()
    # form.submit.value="修改数据"
    baby = Baby.query.get(id)
    if form.validate_on_submit():
        if isBabyNameOk(form.name.data):
            flash('名字重复，请换个名称！')
            return render_template('editbaby.html', form=form)  # 重定向回首页
        baby.name = form.name.data
        baby.birthday = form.birthday.data
        db.session.commit()
        flash('数据修改成功！')
        return render_template('editbaby.html', form=form)  # 重定向回首页
    form.name.data = baby.name
    form.birthday.data= baby.birthday
    return render_template('editbaby.html', form=form)

@app.route('/editHealthy/<int:id>', methods=['GET', 'POST'])
@login_required  # 登录保护
def editHealthy(id):
    form = EditHealthyForm()
    healthy = Healthy.query.get(id)
    if form.validate_on_submit():
        healthy.height = form.height.data
        healthy.weight = form.weight.data
        healthy.create_time = form.create_time.data
        db.session.commit()
        flash('数据修改成功！')
        return render_template('editHealthy.html', form=form)  # 重定向回首页
    form.height.data = healthy.height
    form.weight.data = healthy.weight
    form.create_time.data = healthy.create_time
    return render_template('editHealthy.html', form=form)






###################################
#登录及图片上传
###################################


@login_manager.user_loader
def load_user(user_id):  # 创建用户加载回调函数，接受用户 ID 作为参数
    user = User.query.get(int(user_id))  # 用 ID 作为 User 模型的主键查询对应的用户
    return user  # 返回用户对象


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        if not username or not password:
            # flash('Invalid input.')
            return redirect(url_for('login'))

        user = User.query.filter_by(username=username).first_or_404()
        # 验证用户名和密码是否一致
        if username == user.username and user.validate_password(password):
            login_user(user)  # 登入用户
            # flash('Login success.')
            return redirect(url_for('index'))  # 重定向到主页

        # flash('Invalid username or password.')  # 如果验证失败，显示错误消息
        return redirect(url_for('login'))  # 重定向回登录页面

    return render_template('login.html', form=form)


@app.route('/logout')
@login_required  # 用于视图保护，后面会详细介绍
def logout():
    logout_user()  # 登出用户
    return redirect(url_for('index'))  # 重定向回首页


@app.route('/uploads/<path:filename>')
@login_required  # 登录保护
def uploaded_files(filename):
    return send_from_directory(app.config['UPLOAD_PATH'], filename)


@app.route('/upload', methods=['POST'])
@login_required  # 登录保护
def upload():
    f = request.files.get('upload')  # 获取上传图片文件对象
    # Add more validations here
    extension = f.filename.split('.')[1].lower()
    if extension not in ['jpg', 'gif', 'png', 'jpeg']:  # 验证文件类型示例
        return upload_fail(message='Image only!')  # 返回upload_fail调用

    f.save(os.path.join(app.config['UPLOAD_PATH'], f.filename))
    #这里可以修改filename目录为时间目录
    url = url_for('uploaded_files', filename=f.filename)
    return upload_success(url, f.filename)  # 返回upload_success调用




def isUserNameOk(username):
    '''判断用户名是否重复'''
    return User.query.filter_by(username = username).first()

def isBabyNameOk(name):
    '''判断baby name是否重复'''
    print
    return Baby.query.filter_by(name = name).first()


