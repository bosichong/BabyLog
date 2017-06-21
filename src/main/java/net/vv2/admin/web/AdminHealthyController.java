package net.vv2.admin.web;

import com.xiaoleilu.hutool.date.DateUtil;
import net.vv2.baby.domain.Baby;
import net.vv2.baby.domain.Healthy;
import net.vv2.baby.service.impl.BabyServiceImpl;
import net.vv2.baby.service.impl.HealthyServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-21 20:50
 **/
@Controller
@RequestMapping("/admin/healthy")
public class AdminHealthyController {
    @Autowired
    private HealthyServiceImpl healthyService;
    @Autowired
    private BabyServiceImpl babyService;


    /**
     * 列表页
     * @param model
     * @return
     */
    @RequestMapping("/healthyList")
    public String healthyList(Model model){
        List<Healthy> list = healthyService.selectAll();
        model.addAttribute("list",list);
        return "/admin/healthy/healthyList";
    }

    /**
     * 身高体重更新页
     * @param id
     * @param model
     * @return
     */
    @RequestMapping("/editHealthy/{id}")
    public String editHealthy(@PathVariable Integer id,
                              Model model){
        Healthy healthy = healthyService.selectHealthyById(id);
        model.addAttribute("healthy",healthy);
        return "/admin/healthy/editHealthy";
    }


    /**
     * 更新数据
     * @param id
     * @param height
     * @param weight
     * @param create_time
     * @param baby_id
     * @param mv
     * @return
     */
    @RequestMapping("/updHealthy")
    public ModelAndView updHealthy(Integer id,
                                   Integer height,
                                   Float weight,
                                   String create_time,
                                   Integer baby_id,
                                   ModelAndView mv
                                   ){

        Baby baby = babyService.selectBabyById(baby_id);
        Healthy healthy = new Healthy();
        healthy.setId(id);
        healthy.setHeight(height);
        healthy.setWeight(weight);
        healthy.setCreate_time(DateUtil.parse(create_time));
        healthy.setBaby(baby);

        return returnMv((healthyService.updateHealthy(healthy)>0),mv);


    }

    /**
     * 删除数据
     * @param id
     * @param mv
     * @return
     */
    @RequestMapping("/delHealthy/{id}")
    public ModelAndView delHealthy(@PathVariable Integer id,
                                   ModelAndView mv){
        return returnMv((healthyService.deleteHealthy(id)>0),mv);
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
            return updateDate(mv, "操作成功！", "<meta http-equiv=\"refresh\" content=\"2;url=/admin/healthy/healthyList\">", "/success");
        } else {
            return updateDate(mv, "操作失败！", "<meta http-equiv=\"refresh\" content=\"2;url=/admin/healthy/healthyList\">", "/err");
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
