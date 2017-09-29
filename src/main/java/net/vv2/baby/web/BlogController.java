package net.vv2.baby.web;

import com.xiaoleilu.hutool.date.DateUnit;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpSession;
import javax.validation.constraints.Null;
import java.util.Date;
import java.util.List;

/**
 *
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-09 16:46
 **/
@Controller
@RequestMapping(value = "/baby")
public class BlogController {
    @Autowired
    private BlogServiceImpl blogService;
    @Autowired
    private BabyServiceImpl babyService;
    @Autowired
    private UserServiceImpl userService;
    @Autowired
    private HealthyServiceImpl healthyService;


    /**
     * 首页
     * @param model
     * @return
     */
    @RequestMapping(value = "/home")
    public String index(Model model){

        //孩子信息相关
        Baby baby = babyService.selectBabyById(1);//获取宝贝资料，当然如果有二个或以上的孩子，建议获取所有宝贝。
        int count = blogService.selectCount();//返回总记录数
        System.out.println(count);

//        那年今天数据
        Date today = DateUtil.date();
        String year = DateUtil.year(today)+"";
        System.out.println(year);
        String month = DateUtil.month(today)+1+"";
        String day = DateUtil.dayOfMonth(today)+"";
       // List<Blog> list = blogService.selectOldBlog(month,day,year);//获得那年今天的历史数据
        List<Blog> list = blogService.selectOldBlog("04","15",year);//测试那年今天的历史数据

        model.addAttribute("baby",baby);
        model.addAttribute("count",count);
        model.addAttribute("list",list);
        return "/baby/index";
    }

    @RequestMapping("/add")
    public String addFrom(Model model){
    	List<Baby> list = babyService.selectAllBaby();
    	model.addAttribute("list", list);
        return "/baby/addFrom";
    }


    /**
     * 保存日志
     * @param first
     * @param language
     * @param cognitive
     * @param blog
     * @param baby_id
     * @param session
     * @param mv
     * @return
     */
    @RequestMapping("/saveBlog")
    public ModelAndView saveBlog(String first,
                                 String language,
                                 String cognitive,
                                 String blog,
                                 Integer baby_id,
                                 HttpSession session,
                                 ModelAndView mv){
        System.out.println("准备添加记录-----------");
        User user = (User) session.getAttribute("user");//获取当前登陆的家长
        Baby baby = babyService.selectBabyById(baby_id);//创建需要记录的baby
        Date nowtime = new Date();//创建当前时间
        Blog blog1 = new Blog(first,language,cognitive,blog,nowtime,nowtime,baby,user);//创建日记实体
        System.out.println(blog1.toString());
        //保存数据，判断或失败，并进行相关的跳转
        if (blogService.addBlog(blog1)>0){
            String msg = "日记数据添加成功！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/baby/add\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/success");
            return mv;
        }else {
            String msg = "日记数据添加失败！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/baby/add\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/err");
            return mv;
        }
    }


    /**
     *  保存身高体重数据
     * @param height
     * @param weight
     * @param baby_id
     * @param session
     * @param mv
     * @return int
     */
    @RequestMapping("/saveHealthy")
    public ModelAndView saveHealthy(Integer height,
                                 Float weight,
                                 Integer baby_id,
                                 HttpSession session,
                                 ModelAndView mv){
        System.out.println("准备添加身高体重记录-----------");
        User user = (User) session.getAttribute("user");//获取当前登陆的家长
        Baby baby = babyService.selectBabyById(baby_id);//创建需要记录的baby
        Date nowtime = new Date();//创建当前时间
        Healthy healthy = new Healthy(height,weight,nowtime,baby);//准备需要添加的身高体重数据
        System.out.println(healthy);
        //保存数据，判断或失败，并进行相关的跳转
        if (healthyService.insertHealthy(healthy)>0){
            String msg = "身高体重数据添加成功！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/baby/add\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/success");
            return mv;
        }else {
            String msg = "身高体重数据添加失败！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/baby/add\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/err");
            return mv;
        }
    }


    /**
     * 日记列表页
     * @param pageNum
     * @param model
     * @return
     */
    @RequestMapping("/blog")
    public String blogList(@RequestParam(defaultValue = "") String key,
                           @RequestParam(defaultValue = "1") int pageNum,
                           @RequestParam(defaultValue = "20") int rows,
                           Model model){

        System.out.println("key===="+key);
        System.out.println("开始查询分页数据");
        PageHelp pageHelp = new PageHelp(blogService.selectKeyCount(key),pageNum,rows);
        List<Blog> list = blogService.selectPageBlog(key,pageHelp.getPageArray()[1],pageHelp.getRows());
        System.out.println("++++++++++++++++++"+pageHelp.getCount());
        model.addAttribute("totalPage",pageHelp.getPageArray()[0]);
        model.addAttribute("pageNum",pageNum);
        model.addAttribute("key",key);
        model.addAttribute("list",list);
        return "/baby/blog";
    }

    /**
     * firstlist
     * @param model
     * @return
     */
    @RequestMapping("/firstList")
    public String firstList(Model model){
        List<Blog> list = blogService.selectAllFirst();
        model.addAttribute("list",list);
        return "/baby/firstList";
    }

    /**
     * languagelist
     * @param model
     * @return
     */
    @RequestMapping("/languageList")
    public String languageList(Model model){
        List<Blog> list = blogService.selectAllLanguage();
        model.addAttribute("list",list);
        return "/baby/languageList";
    }

    /**
     * cognitivelist
     * @param model
     * @return
     */
    @RequestMapping("/cognitiveList")
    public String cognitiveList(Model model){
        List<Blog> list = blogService.selectAllCognitive();
        model.addAttribute("list",list);
        return "/baby/cognitiveList";
    }



}
