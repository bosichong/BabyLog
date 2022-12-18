'''
Author: J.sky bosichong@qq.com
Date: 2022-11-21 10:55:30

LastEditors: J.sky bosichong@qq.com
LastEditTime: 2022-11-27 22:15:01
FilePath: /MiniAdmin/tests/test_database.py
python交流学习群号:217840699
'''

import os, datetime
import pytest
import casbin
from casbin_sqlalchemy_adapter import Adapter
from database import get_db_to_T_E_S_T, engine_test, Base
import crud
from models import User, CasbinAction, CasbinObject, Role, CasbinRule, Baby
from utils import get_password_hash, verify_password, verify_e, BASE_DIR


class TestDatabase:

    def setup_class(self):
        self.db = next(get_db_to_T_E_S_T())
        self.adapter = Adapter(engine_test)
        self.model_path = os.path.join(BASE_DIR, 'rbac_model.conf')
        Base.metadata.create_all(bind=engine_test)

        crud.create_data(self.db)

    def get_casbin_e(self):
        return casbin.Enforcer(self.model_path, self.adapter)

    def test_database(self):
        assert 'commit' in dir(self.db)

    def test_user(self):
        assert crud.get_user_by_username(self.db, 'miniadmin')

    def test_baby(self):
        assert crud.get_baby_count(self.db) == 2

    def test_blog_photo(self):
        babys = crud.get_babys(self.db)  # 所有baby
        user = crud.get_user_by_id(self.db, 1)
        # print(user.username,babys[0].name)

        crud.create_blog(self.db, '这是一条属于所有孩子的blog。', user.id, babys)
        blog = crud.get_blog_by_id(self.db, 1)
        crud.create_photo(self.db, 'photo/001.png', user.id, blog.id)

        assert crud.get_blog_count(self.db) > 0
        assert crud.get_photo_count(self.db) > 0

        print()
        print(blog.babys)
        print(babys[0].blogs)


    def test_healthy(self):
        baby = crud.get_blog_by_id(self.db,1)
        assert crud.create_healthy(self.db, height=11, weight=44.3,baby_id=baby.id)


if __name__ == '__main__':
    pytest.main(["-vs", "back/pytests.py"])
