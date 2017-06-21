package net.vv2.baby.domain;

/**
 * 用户实体(家长)
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 10:58
 **/
public class User {
    private Integer id;
    private String name;
    private String password;
    private Integer gm;
    private String amilymembers;

    public  User(){}

    public User(String name, Integer gm, String amilymembers) {
        this.name = name;
        this.gm = gm;
        this.amilymembers = amilymembers;
    }

    public User(String name, String password, Integer gm, String amilymembers) {
        this.name = name;
        this.password = password;
        this.gm = gm;
        this.amilymembers = amilymembers;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

    public Integer getGm() {
        return gm;
    }

    public String getAmilymembers() {
        return amilymembers;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setGm(Integer gm) {
        this.gm = gm;
    }

    public void setAmilymembers(String amilymembers) {
        this.amilymembers = amilymembers;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", password='" + password + '\'' +
                ", gm=" + gm +
                ", amilymembers='" + amilymembers + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;

        User user = (User) o;

        if (!getId().equals(user.getId())) return false;
        if (!getName().equals(user.getName())) return false;
        if (!getPassword().equals(user.getPassword())) return false;
        if (!getGm().equals(user.getGm())) return false;
        return getAmilymembers().equals(user.getAmilymembers());
    }

    @Override
    public int hashCode() {
        int result = getId().hashCode();
        result = 31 * result + getName().hashCode();
        result = 31 * result + getPassword().hashCode();
        result = 31 * result + getGm().hashCode();
        result = 31 * result + getAmilymembers().hashCode();
        return result;
    }
}
