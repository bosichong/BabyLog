package net.vv2.admin.web;

import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 后台首页
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-19 21:52
 **/
@Component
@RequestMapping("/admin")
public class AdminHomeController {


    @RequestMapping("/home")
    public String index(){
        return "/admin/index";
    }
}
