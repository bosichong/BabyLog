package net.vv2;

import com.xiaoleilu.hutool.crypto.SecureUtil;
import net.vv2.baby.domain.Baby;
import net.vv2.baby.domain.User;
import net.vv2.baby.service.BabyService;
import net.vv2.baby.service.impl.BabyServiceImpl;
import net.vv2.baby.service.impl.UserServiceImpl;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Date;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-19 17:03
 **/
@RunWith(SpringRunner.class)
@SpringBootTest
public class UserAndBabyTest {

    @Autowired
    private BabyServiceImpl babyService;

    @Autowired
    private UserServiceImpl userService;


    @Test
    public void addUser(){
        User user = new User("test", SecureUtil.md5("test"),1,"测试");
        if (userService.addUser(user)>0){
            System.out.println("添加数据成功！");
        }else {
            System.out.println("添加数据失败！");
        }
    }

    @Test
    public void updUser(){
        User user = userService.selectUserById(3);
        user.setName("haha11");
        user.setGm(2);
        user.setAmilymembers("papa11");
        userService.updUser(user);
        userService.delUser(3);
    }


    @Test
    public void TestBaby(){
//        Baby baby = new Baby("nanana",new Date());
//        babyService.addBaby(baby);

//        Baby baby = babyService.selectBabyById(10);
//        baby.setName("kakakak");
//        babyService.updBaby(baby);

        babyService.delBaby(10);
    }

}
