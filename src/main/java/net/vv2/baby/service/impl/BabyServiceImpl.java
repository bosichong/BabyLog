package net.vv2.baby.service.impl;

import net.vv2.baby.domain.Baby;
import net.vv2.baby.mapper.BabyMapper;
import net.vv2.baby.service.BabyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 *
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-08 13:08
 **/
@Service
public class BabyServiceImpl implements BabyService {

    @Autowired
    private BabyMapper babyMapper;


    @Override
    public int addBaby(Baby baby) {
        return babyMapper.addBaby(baby);
    }

    @Override
    public int updBaby(Baby baby) {
        return babyMapper.updBaby(baby);
    }

    @Override
    public int delBaby(Integer id) {
        return babyMapper.delBaby(id);
    }

    @Override
    public Baby selectBabyById(Integer id) {
        return babyMapper.selectBabyById(id);
    }

    @Override
    public List<Baby> selectAllBaby() {
        return babyMapper.selectAllBaby();
    }
}
