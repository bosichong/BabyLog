package net.vv2.baby.service.impl;

import net.vv2.baby.domain.Healthy;
import net.vv2.baby.mapper.HealthyMapper;
import net.vv2.baby.service.HealthyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-13 23:07
 **/
@Service
public class HealthyServiceImpl implements HealthyService {

    @Autowired
    private HealthyMapper healthyMapper;

    @Override
    public int insertHealthy(Healthy healthy) {
        return healthyMapper.insertHealthy(healthy);
    }

    @Override
    public int updateHealthy(Healthy healthy) {
        return healthyMapper.updateHealthy(healthy);
    }

    @Override
    public int deleteHealthy(Integer id) {
        return healthyMapper.deleteHealthy(id);
    }

    @Override
    public List<Healthy> selectAll() {
        return healthyMapper.selectAll();
    }

    @Override
    public Healthy selectHealthyById(Integer id) {
        return healthyMapper.selectHealthyById(id);
    }
}
