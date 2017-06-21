package net.vv2.admin.web;

import com.xiaoleilu.hutool.crypto.SecureUtil;
import net.vv2.baby.domain.User;
import net.vv2.baby.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;

/**
 * 用户资料增删改
 *
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-19 21:41
 **/
@Controller
@RequestMapping("/admin/user")
public class AdminUserController {

    @Autowired
    private UserServiceImpl userService;

    /**
     * 用户列表页
     *
     * @param model
     * @return
     */
    @RequestMapping("/userList")
    public String userList(Model model) {

        List<User> users = userService.selectAll();//返回所有用户

        model.addAttribute("users", users);

        return "/admin/user/userList";
    }

    /**
     * 添加新用户页
     *
     * @return
     */
    @RequestMapping("/addUser")
    public String userAdd() {

        return "/admin/user/addUser";
    }

    /**
     * 添加新用户
     *
     * @param name
     * @param password
     * @param gm
     * @param amilymembers
     * @param mv
     * @return
     */
    @RequestMapping("/saveUser")
    public ModelAndView saveAdd(String name,
                                String password,
                                Integer gm,
                                String amilymembers,
                                ModelAndView mv) {

        System.out.println("开始添加新用户------------------");
        User user = new User(name, SecureUtil.md5(password), gm, amilymembers);//创建新用户！

        if (userService.addUser(user) > 0) {
            String msg = "添加新用户成功！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/admin/user/userList\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/success");
            return mv;
        } else {
            String msg = "用户添加失败！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/admin/user/addUser\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/err");
            return mv;
        }

    }


    /**
     * 更新用户页
     *
     * @param id
     * @param model
     * @return
     */
    @RequestMapping("/editUser/{id}")
    public String editUser(@PathVariable Integer id,
                           Model model) {
        User user = userService.selectUserById(id);
        model.addAttribute("user", user);
        return "/admin/user/editUser";
    }


    /**
     * 更新用户资料
     *
     * @param name
     * @param password
     * @param gm
     * @param amilymembers
     * @param mv
     * @return
     */
    @RequestMapping("/updUser")
    public ModelAndView updUser(Integer id,
                                String name,
                                String password,
                                Integer gm,
                                String amilymembers,
                                ModelAndView mv) {

        System.out.println("开始更新新用户------------------");
        User user = new User();
        user.setId(id);
        //判断是否要更新密码
        if (password != "") {
            user.setName(name);
            user.setPassword(SecureUtil.md5(password));
            user.setGm(gm);
            user.setAmilymembers(amilymembers);
            System.out.println(user);
            return returnMv((userService.updUserPassword(user) > 0), mv);
        } else {
            user.setName(name);
            user.setGm(gm);
            user.setAmilymembers(amilymembers);
            System.out.println(user);
            return returnMv((userService.updUser(user) > 0), mv);
        }


    }

    /**
     * 删除用户
     * @param id
     * @param mv
     * @return
     */
    @RequestMapping("/delUser/{id}")
    public ModelAndView delUser(@PathVariable Integer id,
                                ModelAndView mv){
        return returnMv((userService.delUser(id)>0),mv);


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
            return updateDate(mv, "操作成功！", "<meta http-equiv=\"refresh\" content=\"2;url=/admin/user/userList\">", "/success");
        } else {
            return updateDate(mv, "操作失败！", "<meta http-equiv=\"refresh\" content=\"2;url=/admin/user/userList\">", "/err");
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
