package net.vv2.baby.web;

import com.xiaoleilu.hutool.crypto.SecureUtil;
import net.vv2.baby.domain.User;
import net.vv2.baby.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.bind.support.SessionStatus;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpSession;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-10 11:10
 **/
@Controller
@SessionAttributes("user")
@RequestMapping("/")
public class LoginController {

    @Autowired
    private UserServiceImpl userService;

    @RequestMapping("/login")
    public String login() {
        return "/login";
    }

    /**
     * 用户登陆
     *
     * @param username
     * @param password
     * @param mv
     * @return 登陆成功后返回USER
     */
    @RequestMapping("/loginfrom")
    public ModelAndView LoginFrom(String username,
                                  String password,
                                  ModelAndView mv) {
        System.out.println("开始验证登陆------------");
        User user = userService.selectUserByNameAndPassword(username, SecureUtil.md5(password));
        System.out.println("验证登陆用户和法性------------");
        String msg = "";
        String url = "";
        if (user != null) {
            msg = user.getName() + " 欢迎您登陆您成功！";
            url = "<meta http-equiv=\"refresh\" content=\"1;url=baby/home/\">";
            System.out.println("登陆成功！");
            mv.addObject("user", user);
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            mv.setViewName("/success");
            return mv;
        } else {
            msg = "登陆失败，用户名或密码错误！";
            url = "<meta http-equiv=\"refresh\" content=\"1;url=login\">";
            mv.addObject("msg", msg);
            mv.addObject("url", url);
            System.out.println("登陆失败！");
            mv.setViewName("/err");
            return mv;
        }


    }



    @RequestMapping("/logout")
    public String logout(SessionStatus sessionStatus, Model model){

        sessionStatus.setComplete();//清空SESSION
        String msg = "您已成功退出！";
        String url = "<meta http-equiv=\"refresh\" content=\"1;url=login\">";

        model.addAttribute("msg",msg);
        model.addAttribute("url",url);

        return "/success";

    }
}
