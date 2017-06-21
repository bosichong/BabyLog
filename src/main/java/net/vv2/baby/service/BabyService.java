package net.vv2.baby.service;

import net.vv2.baby.domain.Baby;

import java.util.List;

/**
 * Baby表功能接口
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 12:58
 **/
public interface BabyService {

    /**
     * add
     * @param baby
     * @return
     */
    int addBaby(Baby baby);

    /**
     * update
     * @param baby
     * @return
     */
    int updBaby(Baby baby);

    /**
     * delete
     * @param id
     * @return
     */
    int delBaby(Integer id);
    /**
     * 根据ID搜索
     * @param id
     * @return BABY
     */
    Baby selectBabyById(Integer id);

    /**
     * 返回所有baby列表
     * @return List<Baby>
     */
    List<Baby> selectAllBaby();
}
