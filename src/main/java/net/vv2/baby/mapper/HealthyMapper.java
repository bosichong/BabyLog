package net.vv2.baby.mapper;

import net.vv2.baby.domain.Healthy;
import org.apache.ibatis.annotations.*;
import org.apache.ibatis.mapping.FetchType;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-13 22:58
 **/
@Mapper
public interface HealthyMapper {


    /**
     * 插入一条数据
     * @param healthy
     * @return int
     */
    @Insert("insert into bb_healthy(height,weight,create_time,baby_id) values(#{height},#{weight},#{create_time},#{baby.id})")
    @Options(useGeneratedKeys = true,keyProperty = "id")
    int insertHealthy(Healthy healthy);

    /**
     * 更新数据
     * @param healthy
     * @return int
     */
    @Update("update bb_healthy set height = #{height},weight = #{weight},create_time = #{create_time},baby_id = #{baby.id} where id = #{id}")
    int updateHealthy(Healthy healthy);


    /**
     * 删除
     * @param id
     * @return int
     */
    @Delete("delete from bb_healthy where id = #{id}")
    int deleteHealthy(Integer id);

    /**
     * 返回所有 Healthy 数据
     * @return list
     */
    @Select("select * from bb_healthy")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "height",property = "height"),
            @Result(column = "weight",property = "weight"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER))
    })
    List<Healthy> selectAll();

    /**
     * 根据ID 搜索返回
     * @param id
     * @return
     */
    @Select("select * from bb_healthy where id = #{id}")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "height",property = "height"),
            @Result(column = "weight",property = "weight"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER))
    })
    Healthy selectHealthyById(Integer id);
}
