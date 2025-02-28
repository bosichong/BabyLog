const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// 获取所有健康记录
router.get('/', verifyToken, async (req, res) => {
  try {
    const { baby_ids } = req.query;
    let where = {};

    // 如果提供了宝宝ID数组，添加到查询条件中
    if (baby_ids) {
      const babyIdArray = Array.isArray(baby_ids) ? baby_ids : [baby_ids];
      where.baby_id = {
        [req.models.Healthy.sequelize.Op.in]: babyIdArray
      };
    }

    const healthies = await req.models.Healthy.findAll({
      where,
      include: [{
        model: req.models.Baby,
        as: 'Baby',
        attributes: ['id', 'name', 'birthday']
      }],
      order: [['create_time', 'DESC']]
    });
    res.json(healthies);
  } catch (error) {
    console.error('获取健康记录列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取健康记录列表失败'
    });
  }
});

// 获取单个健康记录
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const healthy = await req.models.Healthy.findByPk(req.params.id, {
      include: [{
        model: req.models.Baby,
        as: 'Baby',
        attributes: ['id', 'name', 'birthday']
      }]
    });
    if (!healthy) {
      return res.status(404).json({
        status: 'error',
        message: '健康记录不存在'
      });
    }
    res.json(healthy);
  } catch (error) {
    console.error('获取健康记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取健康记录失败'
    });
  }
});

// 获取特定婴儿健康记录
router.get('/babies/:babyId', verifyToken, async (req, res) => {
  try {
    const healthies = await req.models.Healthy.findAll({
      where: { baby_id: req.params.babyId },
      include: [{
        model: req.models.Baby,
        as: 'Baby',
        attributes: ['id', 'name', 'birthday']
      }]
    });
    res.json(healthies);
  } catch (error) {
    console.error('获取婴儿健康记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取婴儿健康记录失败'
    });
  }
});

// 创建健康记录
router.post('/', verifyToken, async (req, res) => {
  try {
    const { height, weight, baby_id } = req.body;
    const healthy = await req.models.Healthy.create({
      height,
      weight,
      baby_id
    });
    // 创建后立即查询包含婴儿信息的完整记录
    const healthyWithBaby = await req.models.Healthy.findByPk(healthy.id, {
      include: [{
        model: req.models.Baby,
        as: 'Baby',
        attributes: ['id', 'name', 'birthday']
      }]
    });
    res.status(201).json(healthyWithBaby);
  } catch (error) {
    console.error('创建健康记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建健康记录失败'
    });
  }
});

// 更新健康记录
router.post('/:id/update', verifyToken, async (req, res) => {
  try {
    const { height, weight } = req.body;
    const healthy = await req.models.Healthy.findByPk(req.params.id);
    if (!healthy) {
      return res.status(404).json({
        status: 'error',
        message: '健康记录不存在'
      });
    }
    await healthy.update({
      height,
      weight
    });
    // 更新后重新查询以包含Baby信息
    const updatedHealthy = await req.models.Healthy.findByPk(healthy.id, {
      include: [{
        model: req.models.Baby,
        as: 'Baby',
        attributes: ['id', 'name', 'birthday']
      }]
    });
    res.json(updatedHealthy);
  } catch (error) {
    console.error('更新健康记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新健康记录失败'
    });
  }
});

// 删除健康记录
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const healthy = await req.models.Healthy.findByPk(req.params.id);
    if (!healthy) {
      return res.status(404).json({
        status: 'error',
        message: '健康记录不存在'
      });
    }
    await healthy.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('删除健康记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除健康记录失败'
    });
  }
});

module.exports = router;