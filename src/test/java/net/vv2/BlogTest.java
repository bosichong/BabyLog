package net.vv2;

import com.xiaoleilu.hutool.crypto.SecureUtil;
import com.xiaoleilu.hutool.date.DateUtil;
import net.vv2.Utils.PageHelp;
import net.vv2.baby.domain.Baby;
import net.vv2.baby.domain.Blog;
import net.vv2.baby.domain.Healthy;
import net.vv2.baby.domain.User;
import net.vv2.baby.service.impl.BabyServiceImpl;
import net.vv2.baby.service.impl.BlogServiceImpl;
import net.vv2.baby.service.impl.HealthyServiceImpl;
import net.vv2.baby.service.impl.UserServiceImpl;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Date;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 22:09
 **/
@RunWith(SpringRunner.class)
@SpringBootTest
public class BlogTest {

    @Autowired
    private BlogServiceImpl blogService;

    @Autowired
    private BabyServiceImpl babyService;

    @Autowired
    private UserServiceImpl userService;
    @Autowired
    private HealthyServiceImpl healthyService;




    @Test
    public void selectBlogById(){
        System.out.println(blogService.selectBlogById(9));
    }


    @Test
    public void addBlog(){
        Baby baby = babyService.selectBabyById(1);
        User user = userService.selectUserById(1);

        Blog blog = new Blog();
        blog.setBaby(baby);
        blog.setUser(user);
        blog.setBlog("baby2017 插入记录测试！");
        blog.setCreate_time(new Date());
        blog.setUpdate_time(new Date());

        System.out.println(blogService.addBlog(blog));
    }


    @Test
    public void updBlog(){


        Blog blog = blogService.selectBlogById(708);
        blog.setBlog("baby2017 修改更新记录测试！");
        blog.setUpdate_time(new Date());

        System.out.println(blogService.updBlog(blog));
    }

    @Test
    public void delBlog(){
        System.out.println(blogService.delBlog(708));
    }

    @Test
    public void selectAll(){
        System.out.println(blogService.selectAllBlog());
    }

    @Test
    public void selectCount(){
        System.out.println(blogService.selectCount());
    }

    @Test
    public void selectPage(){
        PageHelp pageHelp = new PageHelp(blogService.selectCount(),1,50);
        System.out.println(pageHelp.getPageArray()[0]);

    }

    @Test
    public void selectOldBlog(){
        System.out.println(DateUtil.dayOfMonth(new Date()));
        System.out.println(blogService.selectOldBlog("2017","11","29"));
    }

    @Test
    public void selectAllHealthy(){
        //System.out.println(healthyService.selectAll());
//        Baby baby = babyService.selectBabyById(1);
//        Healthy healthy = new Healthy(100,new Float(44.5),new Date(),baby);
//        healthyService.insertHealthy(healthy);
//        healthy.setHeight(88);
//        healthyService.updateHealthy(healthy);

        healthyService.deleteHealthy(32);

    }

    @Test
    public void selectOther(){
 //    System.out.println(blogService.selectAllCognitive());
   //     System.out.println(blogService.selectAllLanguage());
       System.out.println(blogService.selectAllFirst());
    }


    @Test
    public void md5(){
        System.out.println(SecureUtil.md5("admin"));
    }




}
