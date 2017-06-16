package net.vv2;

import com.xiaoleilu.hutool.crypto.SecureUtil;
import net.vv2.baby.domain.User;
import net.vv2.baby.mapper.UserMapper;
import net.vv2.baby.service.impl.BabyServiceImpl;
import net.vv2.baby.service.impl.UserServiceImpl;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class Mybaby2017ApplicationTests {

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private BabyServiceImpl babyService;

    @Test
    public void contextLoads() {
    }


    @Test
    public void selectUserById() {

        System.out.println(userService.selectUserById(1));
    }

    @Test
    public void selectBabyById() {

        System.out.println(babyService.selectBabyById(1));

    }

    @Test
    public void selectUserByNameAndPassword(){
        User user = new User();
        user.setName("hua");
        user.setPassword(SecureUtil.md5("888" +
                ""));
        System.out.println(userService.selectUserByNameAndPassword(user.getName(),user.getPassword()).toString());

    }

    @Test
    public void selectAllBaby(){
        System.out.println(babyService.selectAllBaby());

    }




}
