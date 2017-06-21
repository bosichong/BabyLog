package net.vv2.baby.mapper;

import net.vv2.baby.domain.User;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 11:28
 **/
@Mapper
public interface UserMapper {


    /**
     * 插入一个user数据
     * @param user
     * @return
     */
    @Insert("insert into bb_user (name,password,gm,amilymembers) values(#{name},#{password},#{gm},#{amilymembers})")
    @Options(useGeneratedKeys = true,keyProperty = "id")
    int addUser(User user);

    /**
     * 更新user数据
     * @param user
     * @return
     */
    @Update("update bb_user set name = #{name},password = #{password},gm = #{gm},amilymembers = #{amilymembers} where id = #{id}")
    int updUserPassword(User user);

    /**
     * 更新user数据
     * @param user
     * @return
     */
    @Update("update bb_user set name = #{name},gm = #{gm},amilymembers = #{amilymembers} where id = #{id}")
    int updUser(User user);

    @Delete("delete from bb_user where id = #{id}")
    int delUser(Integer id);
    /**
     * 根据ID搜索返回一个USER
     * @param id
     * @return User
     */
    @Select("select * from bb_user where id = #{id}")
    User selectUserById(Integer id);


    /**
     * 返回所有用户
     * @return
     */
    @Select("select * from bb_user")
    List<User> selectAll();


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
