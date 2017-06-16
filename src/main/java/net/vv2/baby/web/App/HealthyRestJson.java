package net.vv2.baby.web.App;

import com.xiaoleilu.hutool.date.DateUtil;
import net.vv2.baby.domain.Healthy;
import net.vv2.baby.service.impl.HealthyServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

/**
 * 返回
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-13 22:49
 **/
@RestController
@RequestMapping("/baby/app")
public class HealthyRestJson {

    @Autowired
    private HealthyServiceImpl healthyService;

    @RequestMapping("/HealthyRestJson")
    public HashMap<String,ArrayList<String>> getHealthyRestJson(){
        HashMap<String,ArrayList<String>> healthyMap = new HashMap();

        List<Healthy> healthies = healthyService.selectAll();
        System.out.println(healthies);
        ArrayList<String> heights = new ArrayList<String>();
        ArrayList<String> weights = new ArrayList<String>();
        ArrayList<String> times = new ArrayList<String>();

        for (Healthy healthy : healthies){
            heights.add(healthy.getHeight()+"");
            weights.add(healthy.getWeight()+"");
            times.add(DateUtil.formatDate(healthy.getCreate_time()));
        }
        System.out.println(heights);
        healthyMap.put("height",heights);
        healthyMap.put("weight",weights);
        healthyMap.put("times",times);
        return healthyMap;
    }
}
