package net.vv2.baby.mapper;

import net.vv2.baby.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 11:28
 **/
@Mapper
public interface UserMapper {

    /**
     * 根据ID搜索返回一个USER
     * @param id
     * @return User
     */
    @Select("select * from bb_user where id = #{id}")
    User selectUserById(Integer id);


    /**
     * 用户登陆判断，根据用户名密码判断 正确返回一个用户user
     * @param name
     * @param password
     * @return User
     */
    @Select("select * from bb_user where name = #{name} and password = #{password}")
    User selectUserByNameAndPassword(@Param("name") String name,
                                     @Param("password") String password);
}
