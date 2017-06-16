package net.vv2.baby.domain;

import com.xiaoleilu.hutool.date.DateUnit;
import com.xiaoleilu.hutool.date.DateUtil;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 12:53
 **/
public class Baby {
    private Integer id;
    private String name;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date brithday;

    public Baby(){}
    public Baby(String name, Date brithday) {
        this.name = name;
        this.brithday = brithday;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Date getBrithday() {
        return brithday;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setBrithday(Date brithday) {
        this.brithday = brithday;
    }

    @Override
    public String toString() {
        return "baby{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", brithday=" + brithday +
                '}';
    }

    /**
     * 获得孩子的年龄
     * @return int 年龄
     */
    public int getAge(){
        return DateUtil.ageOfNow(getBrithday());
    }


    /**
     * 返回出生天数
     * @return long
     */
    public long getBetweenDay(){

        return DateUtil.between(getBrithday(), new Date(), DateUnit.DAY);
    }



}
