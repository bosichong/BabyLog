package net.vv2.config;

import net.vv2.baby.web.Interceptor.MyAdminInterceptor;
import net.vv2.baby.web.Interceptor.MyInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;


/**
 * 配置拦截器
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-10 15:21
 **/

@Configuration
public class WebAppConfig extends WebMvcConfigurerAdapter{

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        super.addInterceptors(registry);


        registry.addInterceptor(new MyInterceptor()).addPathPatterns("/baby/**");//添加拦截器并配置拦截请求
        registry.addInterceptor(new MyAdminInterceptor()).addPathPatterns("/admin/**");//后台管理权限拦截判断

    }
}
