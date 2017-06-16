package net.vv2.baby.mapper;

import net.vv2.baby.domain.Baby;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 12:54
 **/
@Mapper
public interface BabyMapper {


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
