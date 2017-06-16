CREATE TABLE bb_baby
(
    id TINYINT(4) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name VARCHAR(32) NOT NULL,
    brithday DATE NOT NULL
);
CREATE TABLE bb_blog
(
    id INT(11) PRIMARY KEY NOT NULL COMMENT '日记表主键' AUTO_INCREMENT,
    first VARCHAR(200) COMMENT '宝宝的第一次',
    language VARCHAR(200) COMMENT '宝宝学会的语言',
    cognitive VARCHAR(200) COMMENT '宝宝的认知',
    blog TEXT NOT NULL COMMENT '日记正文',
    create_time DATETIME NOT NULL COMMENT '创建记录时间',
    update_time DATETIME COMMENT '更新修改时间，默认为创建记录时间',
    babyid TINYINT(4) NOT NULL COMMENT '记录所属宝贝',
    recorder TINYINT(4) NOT NULL COMMENT '记录者',
    CONSTRAINT bb_blog_bb_baby_id_fk FOREIGN KEY (babyid) REFERENCES bb_baby (id),
    CONSTRAINT bb_blog_bb_user_id_fk FOREIGN KEY (recorder) REFERENCES bb_user (id)
);
CREATE INDEX bb_blog_bb_user_id_fk ON bb_blog (recorder);
CREATE INDEX bb_blog_bb_baby_id_fk ON bb_blog (babyid);
CREATE TABLE bb_user
(
    id TINYINT(4) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    password VARCHAR(32) NOT NULL,
    gm TINYINT(4) NOT NULL COMMENT '简单管理权限，级别为1-5',
    amilymembers VARCHAR(30) NOT NULL COMMENT '所属家庭成员类别 比如爸爸或妈妈'
);
CREATE UNIQUE INDEX bb_user_name_uindex ON bb_user (name);




-- # 导入日记数据
-- INSERT INTO bb_blog SELECT ID,FIRST,YUYAN,RENZHI,RIJI,DAY,DAY,babyid,JILU FROM baby_blog
-- WHERE baby_blog.FIRST != '' OR baby_blog.YUYAN != '' OR baby_blog.RENZHI != '' OR baby_blog.RIJI != '' ;
--
-- # 导入身体数据
-- INSERT INTO bb_healthy SELECT NULL ,HEIGHT,WEIGHT,babyid FROM baby_blog