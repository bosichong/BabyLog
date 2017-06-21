package net.vv2.baby.service.impl;

import net.vv2.baby.domain.Blog;
import net.vv2.baby.mapper.BlogMapper;
import net.vv2.baby.service.BlogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 22:12
 **/
@Service
public class BlogServiceImpl implements BlogService {

    @Autowired
    private BlogMapper blogMapper;


    @Override
    public int addBlog(Blog blog) {
        return blogMapper.addBlog(blog);
    }

    @Override
    public int updBlog(Blog blog) {
        return blogMapper.updBlog(blog);
    }

    @Override
    public int delBlog(Integer id) {
        return blogMapper.delBlog(id);
    }

    @Override
    public Blog selectBlogById(Integer id) {
        return blogMapper.selectBlogById(id);
    }

    @Override
    public List<Blog> selectAllBlog() {
        return blogMapper.selectAll();
    }

    @Override
    public List<Blog> selectPageBlog(String key,Integer offset, Integer rows) {
        return blogMapper.selectPageBlog(key,offset,rows);
    }

    @Override
    public List<Blog> selectOldBlog(String month, String day,String year) {
        return blogMapper.selectOldBlog(month,day,year);
    }

    @Override
    public List<Blog> selectBlogByKey(String str) {
        return null;
    }

    @Override
    public int selectCount() {
        return blogMapper.selectCount();
    }

    @Override
    public int selectKeyCount(String key) {
        return blogMapper.selectKeyCount(key);
    }

    @Override
    public List<Blog> selectAllCognitive() {
        return blogMapper.selectAllCognitive();
    }

    @Override
    public List<Blog> selectAllLanguage() {
        return blogMapper.selectAllLanguage();
    }

    @Override
    public List<Blog> selectAllFirst() {
        return blogMapper.selectAllFirst();
    }
}
