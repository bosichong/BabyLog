#!/usr/bin/env node
/**
 * 敏感字段泄漏 + baby 更新回归探测
 * 用法：node scripts/security_check.js
 */
const BASE = 'http://localhost:8888/v1';
const { generateToken } = require('../express_back/middleware/auth');
const token = generateToken('hua');
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

let leak = [], pass = 0, fail = 0;

// 密码哈希特征：bcrypt $2a$/$2b$ 前缀 + 字段名
const LEAK_PATTERNS = ['hashed_password', '$2b$', '$2a$'];

function scan(label, body) {
  const s = JSON.stringify(body);
  const hits = LEAK_PATTERNS.filter(p => s.includes(p));
  if (hits.length) { leak.push(`${label} 泄漏 ${hits.join(',')}`); console.log(`  ❌ ${label} :: 泄漏 ${hits.join(', ')}`); }
  else { pass++; console.log(`  ✅ ${label} 无泄漏`); }
}

async function req(path, method = 'GET', body) {
  const res = await fetch(BASE + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

(async () => {
  console.log('===== 敏感字段泄漏扫描 =====');
  let r = await req('/users');                      scan('GET /users', r.data);
  r = await req('/users/1');                        scan('GET /users/1', r.data);
  r = await req('/blogs/search', 'POST', { page: 1, pageSize: 3 });  scan('POST /blogs/search', r.data);
  r = await req('/blogs/1213');                     scan('GET /blogs/1213', r.data);
  r = await req('/blogs/memories/today');           scan('GET /blogs/memories/today', r.data);
  r = await req('/healthies');                      scan('GET /healthies', r.data);
  r = await req('/photos');                         scan('GET /photos', r.data);

  // 创建路径也要查
  const babies = (await req('/babies')).data;
  const bid = (Array.isArray(babies) ? babies : babies.data)[0].id;
  r = await req('/blogs', 'POST', { content: '<p>泄漏探测</p>', baby_ids: [bid], photo_ids: [] });
  scan('POST /blogs (新建返回)', r.data);
  const nid = r.data?.data?.id || r.data?.id;
  if (nid) {
    r = await req(`/blogs/${nid}/update`, 'POST', { content: '<p>泄漏探测改</p>', baby_ids: [bid] });
    scan('POST /blogs/:id/update', r.data);
    await req(`/blogs/${nid}`, 'DELETE');
  }

  console.log('\n===== baby 更新回归（已移除 sex）=====');
  const origName = (Array.isArray(babies) ? babies : babies.data)[0].name;
  const origBirthday = (Array.isArray(babies) ? babies : babies.data)[0].birthday;
  r = await req(`/babies/${bid}/update`, 'POST', { name: origName, birthday: origBirthday });
  if (r.status === 200) { pass++; console.log(`  ✅ 更新宝宝成功（传 name/birthday，不传 sex）→ ${origName}`); }
  else { fail++; console.log(`  ❌ 更新宝宝失败 status=${r.status} ${JSON.stringify(r.data).slice(0,120)}`); }

  // 前端即便仍传 sex 也不应报错
  r = await req(`/babies/${bid}/update`, 'POST', { name: origName, birthday: origBirthday, sex: 'male' });
  if (r.status === 200) { pass++; console.log('  ✅ 客户端多传 sex 也能正常更新（忽略未知字段）'); }
  else { fail++; console.log(`  ❌ 多传 sex 报错 status=${r.status}`); }

  console.log('\n' + '='.repeat(50));
  console.log(`无泄漏检查: ${pass} 通过 / ${fail} 失败`);
  if (leak.length) { console.log('泄漏点:'); leak.forEach(l => console.log('  -', l)); }
  console.log('='.repeat(50));
  process.exit(leak.length || fail ? 1 : 0);
})();
