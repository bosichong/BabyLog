CREATE TABLE bb_baby
(
    id TINYINT(4) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name VARCHAR(32) NOT NULL,
    brithday DATE NOT NULL
);



CREATE TABLE bb_user
(
    id TINYINT(4) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    password VARCHAR(32) NOT NULL,
    gm TINYINT(4) NOT NULL COMMENT '简单管理权限，级别为1-5',
    amilymembers VARCHAR(30) NOT NULL COMMENT '所属家庭成员类别 比如爸爸或妈妈'
);
CREATE UNIQUE INDEX bb_user_name_uindex ON bb_user (name);

CREATE TABLE bb_healthy
(
    id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    height INT(11) NOT NULL COMMENT '身高',
    weight FLOAT NOT NULL COMMENT '体重',
    baby_id TINYINT(4) NOT NULL,
    create_time DATETIME NOT NULL,
    CONSTRAINT bb_healthy_bb_baby_id_fk FOREIGN KEY (baby_id) REFERENCES bb_baby (id)
);
CREATE INDEX bb_healthy_bb_baby_id_fk ON bb_healthy (baby_id);








CREATE TABLE bb_blog
(
    id INT(11) PRIMARY KEY NOT NULL COMMENT '日记表主键' AUTO_INCREMENT,
    first VARCHAR(200) COMMENT '宝宝的第一次',
    language VARCHAR(200) COMMENT '宝宝学会的语言',
    cognitive VARCHAR(200) COMMENT '宝宝的认知',
    blog TEXT NOT NULL COMMENT '日记正文',
    create_time DATETIME NOT NULL COMMENT '创建记录时间',
    update_time DATETIME COMMENT '更新修改时间，默认为创建记录时间',
    baby_id TINYINT(4) NOT NULL COMMENT '记录所属宝贝',
    user_id TINYINT(4) NOT NULL COMMENT '记录者',
    CONSTRAINT bb_blog_bb_baby_id_fk FOREIGN KEY (baby_id) REFERENCES bb_baby (id),
    CONSTRAINT bb_blog_bb_user_id_fk FOREIGN KEY (user_id) REFERENCES bb_user (id)
);
CREATE INDEX bb_blog_bb_baby_id_fk ON bb_blog (baby_id);
CREATE INDEX bb_blog_bb_user_id_fk ON bb_blog (user_id);

-- 添加一个管理员 username:admin password:admin
INSERT INTO bb_user (name, password, gm, amilymembers) VALUES ("admin","21232f297a57a5a743894a0e4a801fc3",5,"baba");