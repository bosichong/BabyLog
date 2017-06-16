package net.vv2.baby.domain;

import com.xiaoleilu.hutool.date.DateUnit;
import com.xiaoleilu.hutool.date.DateUtil;

import java.util.Date;
import java.util.HashMap;

/**
 * blog
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 16:08
 **/
public class Blog {
    private Integer id;
    private String first;
    private String language;
    private String cognitive;
    private String blog;
    private Date create_time;
    private Date update_time;
    private Baby baby;
    private User user;

    public Blog() {
    }

    public Blog(String first, String language, String cognitive, String blog, Date create_time, Date update_time, Baby baby, User user) {
        this.first = first;
        this.language = language;
        this.cognitive = cognitive;
        this.blog = blog;
        this.create_time = create_time;
        this.update_time = update_time;
        this.baby = baby;
        this.user = user;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setFirst(String first) {
        this.first = first;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public void setCognitive(String cognitive) {
        this.cognitive = cognitive;
    }

    public void setBlog(String blog) {
        this.blog = blog;
    }

    public void setCreate_time(Date create_time) {
        this.create_time = create_time;
    }

    public void setUpdate_time(Date update_time) {
        this.update_time = update_time;
    }

    public void setBaby(Baby baby) {
        this.baby = baby;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getId() {
        return id;
    }

    public String getFirst() {
        return first;
    }

    public String getLanguage() {
        return language;
    }

    public String getCognitive() {
        return cognitive;
    }

    public String getBlog() {
        return blog;
    }

    public Date getCreate_time() {
        return create_time;
    }

    public Date getUpdate_time() {
        return update_time;
    }

    public Baby getBaby() {
        return baby;
    }

    public User getUser() {
        return user;
    }


    @Override
    public String toString() {
        return "Blog{" +
                "id=" + id +
                ", first='" + first + '\'' +
                ", language='" + language + '\'' +
                ", cognitive='" + cognitive + '\'' +
                ", blog='" + blog + '\'' +
                ", create_time=" + create_time +
                ", update_time=" + update_time +
                ", baby=" + baby +
                ", user=" + user +
                '}';
    }

    /**
     * 取得当前日记记录时间时，宝贝出生的天数月数及年
     * @return
     */
    public String[] getBetween(){

        HashMap<String,String> between = new HashMap<>();
        Date brithday = baby.getBrithday();//取得生日。
        long betweenDay = DateUtil.betweenDay(brithday,create_time,true);//获得记当天与出生那天之间的差值


        String[] str = new String[]{betweenDay+"",""};

        return str;
    }
}
