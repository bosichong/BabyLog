package net.vv2.baby.service;

import net.vv2.baby.domain.Blog;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 22:11
 **/
public interface BlogService {


    /**
     * 添加日记
     * @param blog
     * @return 成功返回影响的记录数
     */
    int addBlog(Blog blog);

    /**
     * 更新日记
     * @param blog
     * @return 成功返回影响的记录数
     */
    int updBlog(Blog blog);

    /**
     * 根据ID删除数据
     * @param id 记录ID
     * @return 成功返回影响的记录数
     */
    int delBlog(Integer id);


    /**
     * 根据id搜索相关记录
     * @param id
     * @return Blog
     */
    Blog selectBlogById(Integer id);

    /**
     * 搜索所有记录
     * @return 所有日记记录
     */
    List<Blog> selectAllBlog();

    /**
     * 模糊搜索+分页展示
     * @param key 搜索关键字
     * @param offset 偏移量
     * @param rows 显示的行数
     * @return
     */
    List<Blog> selectPageBlog(String key,Integer offset,Integer rows);

    /**
     * 那年今天数据
     * @param month 那年那月
     * @param day 那年今天
     * @return
     */
    List<Blog> selectOldBlog(String month,String day,String year);


    /**
     * 根据关键字搜索相关记录
     * @return 所有日记记录
     */
    List<Blog> selectBlogByKey(String str);

    /**
     * 返回 表中的日记条数
     * @return int
     */
    int selectCount();


    /**
     * 返回搜索日记条数
     * @return int
     */
    int selectKeyCount(String key);


    /**
     * 返回cognitive
     * @return
     */
    List<Blog> selectAllCognitive();
    /**
     * 返回language
     * @return
     */
    List<Blog> selectAllLanguage();
    /**
     * 返回first
     * @return
     */
    List<Blog> selectAllFirst();



}
