package net.vv2.baby.service;

import net.vv2.baby.domain.User;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 13:10
 **/
public interface UserService {

    /**
     * 根据ID搜索返回user
     * @param id
     * @return
     */

    User selectUserById(Integer id);


    User selectUserByNameAndPassword(String name,String password);
}
