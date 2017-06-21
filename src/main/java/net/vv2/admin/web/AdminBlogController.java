package net.vv2.admin.web;

import net.vv2.Utils.PageHelp;
import net.vv2.baby.domain.Baby;
import net.vv2.baby.domain.Blog;
import net.vv2.baby.domain.User;
import net.vv2.baby.service.impl.BabyServiceImpl;
import net.vv2.baby.service.impl.BlogServiceImpl;
import net.vv2.baby.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import java.util.Date;
import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-19 21:42
 **/
@Controller
@RequestMapping("/admin/blog")
public class AdminBlogController {

    @Autowired
    private BlogServiceImpl blogService;
    @Autowired
    private UserServiceImpl userService;
    @Autowired
    private BabyServiceImpl babyService;

    /**
     * 后台日记列表页
     * @param pageNum
     * @param model
     * @return
     */
    @RequestMapping("/blogList")
    public String blogList(@RequestParam(defaultValue = "") String key,
                           @RequestParam(defaultValue = "1") int pageNum,
                           @RequestParam(defaultValue = "20") int rows,
                           Model model){

        System.out.println("key===="+key);
        System.out.println("后台开始查询分页数据");
        PageHelp pageHelp = new PageHelp(blogService.selectKeyCount(key),pageNum,rows);
        List<Blog> list = blogService.selectPageBlog(key,pageHelp.getPageArray()[1],pageHelp.getRows());
        System.out.println("++++++++++++++++++"+pageHelp.getCount());
        model.addAttribute("totalPage",pageHelp.getPageArray()[0]);
        model.addAttribute("pageNum",pageNum);
        model.addAttribute("key",key);
        model.addAttribute("list",list);
        return "/admin/blog/blogList";
    }


    /**
     * blog 更新页
     * @param id
     * @param model
     * @return
     */
    @RequestMapping("/editBlog/{id}")
    public String editBlog(@PathVariable Integer id,
                           Model model){
        Blog blog = blogService.selectBlogById(id);
        System.out.println(blog);
        model.addAttribute("blog",blog);
        return "/admin/blog/editBlog";
    }

    /**
     * 更新日记
     * @param id
     * @param first
     * @param language
     * @param cognitive
     * @param blog
     * @param baby_id
     * @param user_id
     * @param mv
     * @return
     */
    @RequestMapping("/updBlog")
    public ModelAndView updBlog(
            Integer id,
            String first,
            String language,
            String cognitive,
            String blog,
            Integer baby_id,
            Integer user_id,
            ModelAndView mv
    ){

        Baby baby = babyService.selectBabyById(baby_id);
        User user = userService.selectUserById(user_id);
        Blog blog1 = new Blog();
        blog1.setId(id);
        blog1.setFirst(first);
        blog1.setLanguage(language);
        blog1.setCognitive(cognitive);
        blog1.setBlog(blog);
        blog1.setUpdate_time(new Date());
        blog1.setBaby(baby);
        blog1.setUser(user);
        System.out.println(blog1);
        return returnMv((blogService.updBlog(blog1)>0),mv);

    }

    /**
     * 删除日记
     * @param id
     * @param mv
     * @return
     */
    @RequestMapping("/delBlog/{id}")
    public ModelAndView delBlog(@PathVariable Integer id,
                                ModelAndView mv){
                return returnMv((blogService.delBlog(id)>0),mv);
    }



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * 选择页面跳转
     *
     * @param bl
     * @param mv
     * @return
     */
    public ModelAndView returnMv(boolean bl, ModelAndView mv) {
        if (bl) {
            return updateDate(mv, "操作成功！", "<meta http-equiv=\"refresh\" content=\"2;url=/admin/blog/blogList\">", "/success");
        } else {
            return updateDate(mv, "操作失败！", "<meta http-equiv=\"refresh\" content=\"2;url=/admin/blog/blogList\">", "/err");
        }

    }

    /**
     * 页面跳转
     *
     * @param mv
     * @param msg
     * @param url
     * @param viewName
     * @return
     */
    public ModelAndView updateDate(ModelAndView mv, String msg, String url, String viewName) {
        mv.addObject("msg", msg);
        mv.addObject("url", url);
        mv.setViewName(viewName);
        return mv;
    }

}
