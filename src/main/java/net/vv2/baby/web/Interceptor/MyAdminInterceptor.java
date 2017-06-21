package net.vv2.baby.web.Interceptor;

import net.vv2.baby.domain.User;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


/**
 * 创建自己的拦截器类并实现 HandlerInterceptor 接口。
 *
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-11 21:20
 **/
public class MyAdminInterceptor extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest httpServletRequest,
                             HttpServletResponse httpServletResponse,
                             Object o) throws Exception {
        boolean flag = false;
        User user = (User) httpServletRequest.getSession().getAttribute("user");
        System.out.println("开始判断是否登陆--------------");
        System.out.println(user);
        if (user == null || user.getGm() < 5) {
            String msg = "您的管理权限不够哦！";
            String url = "<meta http-equiv=\"refresh\" content=\"2;url=/baby/add\">";
            httpServletRequest.setAttribute("msg", msg);
            httpServletRequest.setAttribute("url", url);
            httpServletRequest.getRequestDispatcher("/login").forward(httpServletRequest, httpServletResponse);
        } else {
            flag = true;
        }


        return flag;
    }

    @Override
    public void postHandle(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Object o, ModelAndView modelAndView) throws Exception {


    }

    @Override
    public void afterCompletion(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Object o, Exception e) throws Exception {

    }
}
