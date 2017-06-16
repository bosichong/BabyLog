package net.vv2.baby.domain;


import java.util.Date;

/**
 * Healthy
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-13 22:50
 **/

public class Healthy {
    private Integer id;
    private Integer height;
    private Float weight;
    private Date create_time;
    private Baby baby;

    public Healthy(){}

    public Healthy(Integer height, Float weight, Date create_time, Baby baby) {
        this.height = height;
        this.weight = weight;
        this.create_time = create_time;
        this.baby = baby;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public void setWeight(Float weight) {
        this.weight = weight;
    }

    public void setCreate_time(Date create_time) {
        this.create_time = create_time;
    }

    public void setBaby(Baby baby) {
        this.baby = baby;
    }

    public Integer getId() {
        return id;
    }

    public Integer getHeight() {
        return height;
    }

    public Float getWeight() {
        return weight;
    }

    public Date getCreate_time() {
        return create_time;
    }

    public Baby getBaby() {
        return baby;
    }

    @Override
    public String toString() {
        return "Healthy{" +
                "id=" + id +
                ", height=" + height +
                ", weight=" + weight +
                ", create_time=" + create_time +
                ", baby=" + baby +
                '}';
    }
}
