const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { verifyToken } = require('../middleware/auth');
const { sendError } = require('../utils/api-error');
const { sendSuccess } = require('../utils/api-response');

// 获取所有健康记录
router.get('/', verifyToken, async (req, res) => {
  try {
    const { baby_ids } = req.query;
    let where = {};

    // 如果提供了宝宝ID数组，添加到查询条件中
    if (baby_ids) {
      const babyIdArray = Array.isArray(baby_ids) ? baby_ids : [baby_ids];
      where.baby_id = {
        [Op.in]: babyIdArray
      };
    }

    const healthies = await req.models.Healthy.findAll({
      where,
      include: [{
        model: req.models.Baby,
        as: 'Baby',
        attributes: ['id', 'name', 'birthday']
      }],
      order: [['created_at', 'DESC']]
    });
    return sendSuccess(res, healthies);
  } catch (error) {
    return sendError(req, res, 500, '获取健康记录列表失败', error);
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
      return sendError(req, res, 404, '健康记录不存在');
    }
    return sendSuccess(res, healthy);
  } catch (error) {
    return sendError(req, res, 500, '获取健康记录失败', error);
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
    return sendSuccess(res, healthies);
  } catch (error) {
    return sendError(req, res, 500, '获取婴儿健康记录失败', error);
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
    return sendSuccess(res, healthyWithBaby, { status: 201 });
  } catch (error) {
    return sendError(req, res, 500, '创建健康记录失败', error);
  }
});

// 更新健康记录
router.post('/:id/update', verifyToken, async (req, res) => {
  try {
    const { height, weight } = req.body;
    const healthy = await req.models.Healthy.findByPk(req.params.id);
    if (!healthy) {
      return sendError(req, res, 404, '健康记录不存在');
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
    return sendSuccess(res, updatedHealthy);
  } catch (error) {
    return sendError(req, res, 500, '更新健康记录失败', error);
  }
});

// 删除健康记录
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const healthy = await req.models.Healthy.findByPk(req.params.id);
    if (!healthy) {
      return sendError(req, res, 404, '健康记录不存在');
    }
    await healthy.destroy();
    return res.status(204).send();
  } catch (error) {
    return sendError(req, res, 500, '删除健康记录失败', error);
  }
});

module.exports = router;
