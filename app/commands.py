# -*- coding: utf-8 -*-

import click

from app import app, db
from app.models import *  #引入所有model


@app.cli.command()
@click.option('--str',default='我来试试',help='这是一个帮助')
def test(str):
    click.echo(str)


@app.cli.command()
@click.option('--count', default=10, help='默认创建10条随机的baby日记')
def forge(count):
    click.echo("开始创建数据库和虚拟数据。")
    db.drop_all()
    click.echo("删除数据库。")
    db.create_all()
    click.echo("创建数据库和表。")
    # 引入faker设置中文，并创建虚拟数据。
    from faker import Faker
    faker = Faker('zh_CN')

    click.echo("创建管理员。username:admin password:babylog")
    user = User()
    user.username = 'admin'
    user.set_password('babylog')
    user.gm = 5
    user.familymembers = ("爸爸")
    db.session.add(user)

    click.echo("创建一个baby。")
    baby = Baby()
    baby.name = "画画泡泡和毛毛"
    baby.birthday = faker.date_this_year()
    db.session.add(baby)
    click.echo("创建{}条随机的baby日记。".format(count))
    for i in range(count):
        blog = Blog()
        blog.blog = faker.text()
        blog.baby_id = 1
        blog.user_id = 1
        db.session.add(blog)

    db.session.commit()
