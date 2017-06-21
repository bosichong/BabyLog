package net.vv2.baby.service;

import net.vv2.baby.domain.Healthy;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-13 23:05
 **/
public interface HealthyService {


    /**
     * 添加数据
     * @param healthy
     * @return int
     */
    int insertHealthy(Healthy healthy);

    /**
     * 更新数据
     * @param healthy
     * @return int
     */
    int updateHealthy(Healthy healthy);

    /**
     * 删除数据
     * @param id
     * @return int
     */
    int deleteHealthy(Integer id);

    /**
     * 返回Healthy所有数据
     * @return list
     */
    public List<Healthy> selectAll();


    /**
     * 根据ID搜索
     * @param id
     * @return
     */
    Healthy selectHealthyById(Integer id);
}
