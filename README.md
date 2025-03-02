
# BabyLog 3.0

岁月如风，唯有此忆, 任凭时光匆匆，记录点点滴滴。 

一晃12年都过去了,当初孩子出生的时候,我只是想记录一下一些当爸爸的心路历程,没想到一下子就过去了12年.

此间,程序重构过多次,但是唯一不变的就是那些记录下来的数据和相片.

全新的BabyLog3.0 发布了!



## 程序介绍

本程序采用现代化的前后端分离架构开发。
技术栈：
- 后端：Express.js、Sequelize、SQLite
- 前端：Next.js、Shadcn UI、Tailwind CSS

BabyLog是用来记录孩子成长过程的日记，那年今天,全文搜索等功能，还包括身高，体重，并使用图表展示,3.0系统支持多个宝贝.支持多位家长亲属共同记录.


## 界面预览

![预览](./images/ (1).png)

支持暗黑模式

![预览](./images/ (7).png)


![预览](./images/ (2).png)
![预览](./images/ (3).png)
![预览](./images/ (4).png)
![预览](./images/ (5).png)
![预览](./images/ (6).png)




## 安装与部署

### 安装与启动

1. git克隆或是下载压缩包。

2. 一键安装所有依赖（前端和后端）：

    ```bash
    node install.js
    ```
    
    这个脚本会自动安装根目录、Express后端和Next.js前端的所有依赖。

3. 启动应用：

    生产环境启动：
    ```bash
    node start.js
    ```
    或
    ```bash
    npm start
    ```
    
    开发环境启动：
    ```bash
    node start.js --dev
    ```
    或
    ```bash
    npm run dev
    ```

    这将同时启动前端和后端服务：
    - 后端API服务运行在: http://localhost:8888
    - 前端开发服务运行在: http://localhost:3000


## 初始账号

首次启动程序,会创建管理员账号为：admin,密码为：123456.登录后在导航管理修改密码和个人资料。然后添加宝贝，添加其他家长，就可以开始记录了。


## 写在最后

这个程序自己真的是使用了好多年，历经几次的重构，从最开始的php原生代码到使用thinkPHP框架，后来有使用Java重构了一次（详见分支master），期间还用Python写了一个终端的录入版，而后使用了flask重构了一下，这次3.0版本使用前后端分离架构，采用Express.js作为后端、Next.js作为前端，使用了现代化的UI组件和响应式设计。这个程序使用也有12年多了，回头看看真是感慨万千，一方面是孩子的记录，一方面是自己学习的渣渣历程。

真诚的希望有孩子的和打算生孩子的程序员们来一起维护这个程序，有些东西真的需要记下来，不然回头看去都是模糊的回忆。

任凭时光匆匆，记录点点滴滴。以上记录与2025-03-01
   



