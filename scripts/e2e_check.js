#!/usr/bin/env node
/**
 * 端到端接口验证（改字段名后的回归测试）
 * 用法：node scripts/e2e_check.js
 * 依赖：后端已在 localhost:8888 运行
 */
const BASE = 'http://localhost:8888/v1';
const { generateToken } = require('../express_back/middleware/auth');

const token = generateToken('hua');   // 用真实用户 hua（is_active=1）
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

let pass = 0, fail = 0;
const fails = [];

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; fails.push(name + (detail ? ` :: ${detail}` : '')); console.log(`  ❌ ${name}${detail ? ' :: ' + detail : ''}`); }
}

async function req(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

(async () => {
  console.log('===== 1. 用户接口（family_member / gender）=====');
  let r = await req('/users');
  check('GET /users 200', r.status === 200, `status=${r.status}`);
  const users = Array.isArray(r.data) ? r.data : r.data?.data || [];
  check('用户数 = 3', users.length === 3, `实际 ${users.length}`);
  if (users.length) {
    const u = users.find(x => x.username === 'hua') || users[0];
    check('字段 family_member 存在', 'family_member' in u, JSON.stringify(Object.keys(u)));
    check('字段 gender 存在', 'gender' in u, JSON.stringify(Object.keys(u)));
    check('旧字段 familymember 已消失', !('familymember' in u));
    check('旧字段 sex 已消失', !('sex' in u));
    check('字段 created_at 存在', 'created_at' in u);
    check('无 hashed_password 泄漏', !('hashed_password' in u));
    check('gender 取值合法', ['male', 'female'].includes(u.gender), `gender=${u.gender}`);
    console.log(`     hua -> family_member=${u.family_member}, gender=${u.gender}`);
  }

  console.log('\n===== 2. 宝宝接口 =====');
  r = await req('/babies');
  const babies = Array.isArray(r.data) ? r.data : r.data?.data || [];
  check('GET /babies 200', r.status === 200, `status=${r.status}`);
  check('宝宝数 = 2', babies.length === 2, `实际 ${babies.length}`);
  check('垚垚/露西 都在', babies.map(b => b.name).sort().join(',') === '垚垚,露西');

  console.log('\n===== 3. 日志列表（content 字段）=====');
  r = await req('/blogs/search', 'POST', { page: 1, pageSize: 3 });
  check('POST /blogs/search 200', r.status === 200, `status=${r.status}`);
  check('总数 = 1213', r.data?.total === 1213, `实际 ${r.data?.total}`);
  const items = r.data?.items || [];
  check('返回 3 条', items.length === 3, `实际 ${items.length}`);
  if (items.length) {
    check('content 字段存在', 'content' in items[0], JSON.stringify(Object.keys(items[0])));
    check('旧字段 blog 已消失', !('blog' in items[0]));
    check('created_at 字段存在', 'created_at' in items[0]);
    check('关联 user 带 family_member', 'family_member' in (items[0].user || {}), JSON.stringify(Object.keys(items[0].user || {})));
    check('关联 user.gender 合法', ['male','female'].includes(items[0].user?.gender), items[0].user?.gender);
    check('关联 Photo 带 storage_path', !items[0].Photos?.length || 'storage_path' in items[0].Photos[0]);
    console.log(`     首条: ${String(items[0].content).slice(0, 30)}...`);
  }

  console.log('\n===== 4. 关键字搜索（走 content 列）=====');
  r = await req('/blogs/search', 'POST', { page: 1, pageSize: 5, keyword: '比赛' });
  check('关键字搜索 200', r.status === 200, `status=${r.status}`);
  check('命中数 > 0', (r.data?.total || 0) > 0, `实际 ${r.data?.total}`);

  console.log('\n===== 5. 往年今天 =====');
  r = await req('/blogs/memories/today');
  check('GET /blogs/memories/today 200', r.status === 200, `status=${r.status}`);
  check('返回数组', Array.isArray(r.data), typeof r.data);

  console.log('\n===== 6. 新建日志（写 content）=====');
  r = await req('/blogs', 'POST', {
    content: '<p>【E2E 测试】字段迁移验证日志</p>',
    baby_ids: [babies[0].id],
    photo_ids: [],
  });
  check('POST /blogs 201', r.status === 201, `status=${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  const newId = r.data?.data?.id || r.data?.id;
  check('返回 content 正确', (r.data?.data?.content || r.data?.content)?.includes('E2E 测试'));
  console.log(`     新日志 id=${newId}`);

  console.log('\n===== 7. 更新日志 =====');
  if (newId) {
    r = await req(`/blogs/${newId}/update`, 'POST', { content: '<p>【E2E 测试】已更新</p>', baby_ids: [babies[0].id] });
    check('POST /blogs/:id/update 200', r.status === 200, `status=${r.status}`);
    check('内容已更新', (r.data?.data?.content || '').includes('已更新'), JSON.stringify(r.data?.data?.content));
  }

  console.log('\n===== 8. 健康记录（health_record 表）=====');
  r = await req('/healthies');
  const hrs = Array.isArray(r.data) ? r.data : r.data?.data || [];
  check('GET /healthies 200', r.status === 200, `status=${r.status}`);
  check('健康记录数 = 48', hrs.length === 48, `实际 ${hrs.length}`);
  if (hrs.length) {
    check('有 created_at', 'created_at' in hrs[0], JSON.stringify(Object.keys(hrs[0])));
    check('旧字段 create_time 已消失', !('create_time' in hrs[0]));
    check('关联 Baby 正常', !!hrs[0].Baby?.name);
  }
  r = await req('/healthies', 'POST', { height: 130, weight: 28, baby_id: babies[0].id });
  check('POST /healthies 201', r.status === 201, `status=${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  const newHrId = r.data?.id || r.data?.data?.id;
  if (newHrId) {
    r = await req(`/healthies/${newHrId}/delete`, 'POST');
    check('清理测试健康记录', r.status === 200 || r.status === 204, `status=${r.status}`);
  }

  console.log('\n===== 9. 照片（storage_path）=====');
  r = await req('/photos');
  const photos = Array.isArray(r.data) ? r.data : r.data?.data || [];
  check('GET /photos 200', r.status === 200, `status=${r.status}`);
  check('照片数 = 128', photos.length === 128, `实际 ${photos.length}`);
  if (photos.length) {
    check('storage_path 存在', 'storage_path' in photos[0], JSON.stringify(Object.keys(photos[0])));
    check('旧字段 file_path 已消失', !('file_path' in photos[0]));
  }

  console.log('\n===== 10. 清理测试日志 =====');
  if (newId) {
    r = await req(`/blogs/${newId}`, 'DELETE');
    check('DELETE /blogs/:id 204', r.status === 204, `status=${r.status}`);
    r = await req('/blogs/search', 'POST', { page: 1, pageSize: 1 });
    check('总数回到 1213', r.data?.total === 1213, `实际 ${r.data?.total}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`结果: ${pass} 通过 / ${fail} 失败`);
  if (fails.length) { console.log('失败项:'); fails.forEach(f => console.log('  -', f)); }
  console.log('='.repeat(50));
  process.exit(fail ? 1 : 0);
})();
