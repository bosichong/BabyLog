package net.vv2.baby.mapper;

import net.vv2.baby.domain.Blog;
import org.apache.ibatis.annotations.*;
import org.apache.ibatis.mapping.FetchType;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 16:22
 **/
@Mapper
public interface BlogMapper {

    /**
     * 插入一条日记记录
     * @param blog
     * @return 成功后返回1
     */
    @Insert("insert into bb_blog(first,language,cognitive,blog,create_time,update_time,baby_id,user_id) values(#{first} ," +
            "#{language},#{cognitive},#{blog},#{create_time},#{update_time},#{baby.id},#{user.id})")
    @Options(useGeneratedKeys = true,keyProperty = "id")
    int addBlog(Blog blog);


    @Update("update bb_blog set first = #{first},language = #{language},cognitive = #{cognitive},blog = #{blog}," +
            "update_time = #{update_time},baby_id = #{baby.id},user_id = #{user.id} where id = #{id}")
    int updBlog(Blog blog);

    /**
     * 根据ID删除一个USER
     * @param id
     * @return
     */
    @Delete("delete from bb_blog where id = #{id}")
    int delBlog(Integer id);

    /**
     * 根据ID 搜索一条记录
     * @param id
     * @return 一条记录
     */
    @Select("select * from bb_blog where id = #{id}")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
            one = @One(
                    select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                    fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
            one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
            fetchType = FetchType.EAGER))
    })
    Blog selectBlogById(Integer id);


    /**
     * 返回所有日志数据
     * @return
     */
    @Select("select * from bb_blog ORDER BY create_time DESC")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
                    one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
                            fetchType = FetchType.EAGER))
    })
    List<Blog> selectAll();


    /**
     * 返回first数据
     * @return
     */
    @Select("select * from bb_blog where first != '' ORDER BY create_time DESC")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
                    one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
                            fetchType = FetchType.EAGER))
    })
    List<Blog> selectAllFirst();


    /**
     * 返回language数据
     * @return
     */
    @Select("select * from bb_blog where language != '' ORDER BY create_time DESC")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
                    one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
                            fetchType = FetchType.EAGER))
    })
    List<Blog> selectAllLanguage();


    /**
     * 返回cognitive数据
     * @return
     */
    @Select("select * from bb_blog where cognitive != '' ORDER BY create_time DESC")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
                    one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
                            fetchType = FetchType.EAGER))
    })
    List<Blog> selectAllCognitive();


    /**
     * 模糊搜索+分页显示日志
     * @param key 搜索关键字
     * @param offset 偏移量
     * @param rows 行数
     * @return 分页数据
     */
    @Select("SELECT * FROM bb_blog WHERE first like CONCAT('%',#{key},'%') OR language like CONCAT('%',#{key},'%') or cognitive like CONCAT('%',#{key},'%') or blog like CONCAT('%',#{key},'%') ORDER BY create_time DESC LIMIT #{offset},#{rows}")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
                    one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
                            fetchType = FetchType.EAGER))
    })
    List<Blog> selectPageBlog(@Param("key") String key,@Param("offset") Integer offset,@Param("rows") Integer rows);


    /**
     * 返回那年今天的数据
     * @param month 那年那月
     * @param day 那年今天
     * @return list
     */
    @Select("SELECT * from bb_blog WHERE month(create_time) = ${month} and day(create_time) = ${day} and year(create_time) != #{year} ORDER BY create_time DESC")
    @Results({
            @Result(id = true,column = "id",property = "id"),
            @Result(column = "first",property = "first"),
            @Result(column = "language",property = "language"),
            @Result(column = "cognitive",property = "cognitive"),
            @Result(column = "blog",property = "blog"),
            @Result(column = "create_time",property = "create_time"),
            @Result(column = "update_time",property = "update_time"),
            @Result(column = "baby_id",property = "baby",
                    one = @One(
                            select = "net.vv2.baby.mapper.BabyMapper.selectBabyById",
                            fetchType = FetchType.EAGER)),
            @Result(column = "user_id",property = "user",
                    one = @One(select = "net.vv2.baby.mapper.UserMapper.selectUserById",
                            fetchType = FetchType.EAGER))
    })
    List<Blog> selectOldBlog(@Param("month") String month,@Param("day") String day,@Param("year") String year);

    /**
     * 返回搜索记录总数
     * @return
     */
    @Select("select count(*) from bb_blog WHERE first like CONCAT('%',#{key},'%') OR language like CONCAT('%',#{key},'%') or cognitive like CONCAT('%',#{key},'%') or blog like CONCAT('%',#{key},'%')")
    int selectKeyCount(@Param("key") String key);



    /**
     * 返回记录条数
     * @return
     */
    @Select("select count(*) from bb_blog")
    int selectCount();




}
