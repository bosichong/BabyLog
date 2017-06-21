package net.vv2.baby.mapper;

import net.vv2.baby.domain.Baby;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 12:54
 **/
@Mapper
public interface BabyMapper {


    /**
     * 添加一个BABY
      * @param baby
     * @return
     */
    @Insert("insert into bb_baby (name,brithday) values(#{name},#{brithday})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int addBaby(Baby baby);

    /**
     * 更新一个BABY
     * @param baby
     * @return
     */
    @Update("update bb_baby set name = #{name},brithday = #{brithday} where id = #{id}")
    int updBaby(Baby baby);


    /**
     * 删除一个user
     * @param id
     * @return
     */
    @Delete("delete from bb_baby where id = #{id}")
    int delBaby(Integer id);

    /**
     * 根据ID搜索
     * @param id
     * @return BABY
     */
    @Select("select * from bb_baby where id = #{id}")
    Baby selectBabyById(Integer id);

    /**
     * 返回所有baby列表
     * @return List<Baby>
     */
    @Select("select * from bb_baby")
    List<Baby> selectAllBaby();



}
