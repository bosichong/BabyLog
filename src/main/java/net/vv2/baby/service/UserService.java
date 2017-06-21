package net.vv2.baby.service;

import net.vv2.baby.domain.User;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 13:10
 **/
public interface UserService {


    /**
     * 添加一个user
     * @param user
     * @return int
     */
    int addUser(User user);

    /**
     * 更新user新密码
     * @param user
     * @return int
     */
    int updUserPassword(User user);

    /**
     * 更新user不更新密码
     * @param user
     * @return int
     */
    int updUser(User user);

    /**
     * 删除一个 user
     * @param id user.id
     * @return int
     */
    int delUser(Integer id);
    /**
     * 返回所有用户列表
     * @return
     */
    List<User> selectAll();

    /**
     * 根据ID搜索返回user
     * @param id
     * @return
     */

    User selectUserById(Integer id);

    /**
     * 登陆验证
     * @param name
     * @param password
     * @return
     */
    User selectUserByNameAndPassword(String name,String password);
}
