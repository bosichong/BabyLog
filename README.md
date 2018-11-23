
### 更新

2018.11.23 更新了数据库新建时会自动添加一个宝宝数据，这样首次运行就不会报错了（后台可以修改姓名及生日）。

准备更新，添加支持Markdown


### BabyLog

岁月如风，唯有此忆。 任凭时光匆匆，记录点点滴滴。 

当爸爸了，就多陪陪孩子，有事没事的记些东西，不要总把心思放在程序编码上，也多陪陪孩子！

记录了那么多条数据，是时候，为孩子做个数据，也许将来某一天，你也会翻翻看看。

本人菜鸟一个，Java的爱好者，并非专业码农，程序问题难免，请各位大侠轻拍。

### 介绍

本程序采用 SpringBoot+Mysql+MyBatis+Thymeleaf+Amaze UI+ECharts 等框架技术支持。
友情提示：[hutool ](https://git.oschina.net/loolly/hutool) 国产最佳Java 工具类！

BabyLog是用来记录孩子成长过程的日记，她包括：日记，语言，认知等，还包括身高，体重，并使用图表展示。

### 预览

![输入图片说明](https://git.oschina.net/uploads/images/2017/0622/011446_a31308f8_125848.jpeg "首页预览")

![输入图片说明](https://git.oschina.net/uploads/images/2017/0622/011519_95062e58_125848.jpeg "后台预览")

![输入图片说明](https://git.oschina.net/uploads/images/2017/0622/011721_cd764a83_125848.jpeg "在这里输入图片标题")![输入图片说明](https://git.oschina.net/uploads/images/2017/0622/011735_274869e7_125848.jpeg "在这里输入图片标题")



### 启动

建立mysql数据库，导入DOC/下的sql文件

修改数据配置文件`application.yml`里连接mysql数据库的相关参数

默认管理员帐号：admin 密码：admin

(修改了新建数据库时在后台同时添加一个baby,这样就不会出现运行报错的问题)

idea中 找到Mybaby2017Application，然后右键 run Mybaby2017Application，启动程序

或是终端下进入程序目录运行如下代码，也可以启动程序

    
    mvn spring-boot:run