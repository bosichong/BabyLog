package net.vv2.baby.service.impl;

import net.vv2.baby.domain.User;
import net.vv2.baby.mapper.UserMapper;
import net.vv2.baby.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 13:11
 **/
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;


    @Override
    public User selectUserById(Integer id) {
        return userMapper.selectUserById(id);
    }

    @Override
    public User selectUserByNameAndPassword(String name, String password) {
        return userMapper.selectUserByNameAndPassword(name,password);
    }
}
