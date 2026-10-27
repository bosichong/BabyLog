#!/usr/bin/env node
/**
 * 视频功能端到端测试
 * 用法：node scripts/video_e2e.js
 * 前置：后端 8888 运行中
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { generateToken } = require('../express_back/middleware/auth');

const BASE = 'http://localhost:8888/v1';
const UPLOAD_DIR = path.join(__dirname, '../express_back/uploads');
const token = generateToken('hua');
const H = { Authorization: `Bearer ${token}` };

let pass = 0, fail = 0;
const fails = [];

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; fails.push(name + (detail ? ` :: ${detail}` : '')); console.log(`  ❌ ${name}${detail ? ' :: ' + detail : ''}`); }
}

async function api(pathname, method = 'GET', body) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: body ? { ...H, 'Content-Type': 'application/json' } : H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

async function uploadVideo(filePath, mime) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(filePath)], { type: mime }), path.basename(filePath));
  const res = await fetch(BASE + '/videos/uploadfile', { method: 'POST', headers: H, body: fd });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

function probe(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,profile,width,height,pix_fmt',
    '-of', 'json', file,
  ]).toString();
  return JSON.parse(out).streams[0];
}

(async () => {
  const blogIds = [];

  console.log('===== 1. 上传 HEVC 视频（模拟 iPhone）=====');
  const t0 = Date.now();
  let r = await uploadVideo('/tmp/bl_v1.mov', 'video/quicktime');
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  check('上传返回 200', r.status === 200, `status=${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  const v1 = r.data;
  check('返回 storage_path', !!v1?.storage_path, v1?.storage_path);
  check('返回 duration', typeof v1?.duration === 'number' && v1.duration > 3, `duration=${v1?.duration}`);
  check('返回 size_bytes', typeof v1?.size_bytes === 'number' && v1.size_bytes > 0, `size=${v1?.size_bytes}`);
  check('扩展名是 .mp4', String(v1?.storage_path).endsWith('.mp4'), v1?.storage_path);
  check('路径在 videos/ 下', String(v1?.storage_path).startsWith('videos/'), v1?.storage_path);
  console.log(`     上传+转码耗时 ${elapsed}s`);

  console.log('\n===== 2. 输出文件格式校验（浏览器兼容性）=====');
  const abs1 = path.join(UPLOAD_DIR, v1.storage_path);
  check('文件已落盘', fs.existsSync(abs1), abs1);
  if (fs.existsSync(abs1)) {
    const info = probe(abs1);
    console.log(`     ${JSON.stringify(info)}`);
    check('编码是 h264', info.codec_name === 'h264', info.codec_name);
    check('profile 是 High（非 4:4:4）', info.profile === 'High', info.profile);
    check('pix_fmt 是 yuv420p', info.pix_fmt === 'yuv420p', info.pix_fmt);
    check('最长边 ≤ 1920', Math.max(info.width, info.height) <= 1920, `${info.width}x${info.height}`);
  }
  check('临时目录已清空', fs.readdirSync(path.join(UPLOAD_DIR, 'videos/tmp')).length === 0,
    fs.readdirSync(path.join(UPLOAD_DIR, 'videos/tmp')).join(','));

  console.log('\n===== 3. 创建带视频的日志 =====');
  r = await api('/blogs', 'POST', {
    content: '<p>【视频测试】带视频的日志</p>',
    baby_ids: [1],
    photo_ids: [],
    video: { file_name: v1.file_name, storage_path: v1.storage_path, file_url: v1.file_url,
             duration: v1.duration, size_bytes: v1.size_bytes },
  });
  check('创建日志 201', r.status === 201, `status=${r.status}`);
  const blogId = r.data?.id || r.data?.data?.id;
  if (blogId) blogIds.push(blogId);
  check('返回带 video 对象', !!r.data?.video, JSON.stringify(r.data?.video || null).slice(0, 100));
  check('video 关联到该日志', r.data?.video?.blog_id === blogId, `video.blog_id=${r.data?.video?.blog_id} blog=${blogId}`);
  check('video 有 duration', r.data?.video?.duration > 0, r.data?.video?.duration);

  console.log('\n===== 4. 查询日志（确认 include 生效）=====');
  r = await api(`/blogs/${blogId}`);
  check('GET 单条 200', r.status === 200, `status=${r.status}`);
  check('单条查询带 video', !!r.data?.video, Object.keys(r.data || {}).join(','));
  r = await api('/blogs/search', 'POST', { page: 1, pageSize: 5 });
  const hit = (r.data?.items || []).find(b => b.id === blogId);
  check('列表查询带 video', !!hit?.video, hit ? Object.keys(hit).join(',') : 'not found');

  console.log('\n===== 5. 换视频（旧的应被删除）=====');
  r = await uploadVideo('/tmp/bl_v2.mov', 'video/quicktime');
  check('第二个视频上传成功', r.status === 200, `status=${r.status}`);
  const v2 = r.data;
  const abs2 = path.join(UPLOAD_DIR, v2.storage_path);
  r = await api(`/blogs/${blogId}/update`, 'POST', {
    content: '<p>【视频测试】换成第二个视频</p>',
    baby_ids: [1],
    photo_ids: [],
    video: { file_name: v2.file_name, storage_path: v2.storage_path, file_url: v2.file_url,
             duration: v2.duration, size_bytes: v2.size_bytes },
  });
  check('更新日志 200', r.status === 200, `status=${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  check('video 已换成新的', r.data?.data?.video?.storage_path === v2.storage_path, r.data?.data?.video?.storage_path);
  check('旧视频文件已删除', !fs.existsSync(abs1), abs1);
  check('新视频文件存在', fs.existsSync(abs2), abs2);

  console.log('\n===== 6. 唯一约束（一篇日志只能一个视频）=====');
  const dbFile = path.join(__dirname, '../express_back/babylog_data.db');
  const videoCount = parseInt(execFileSync('python3', ['-c',
    `import sqlite3;d=sqlite3.connect(${JSON.stringify(dbFile)});print(d.execute('select count(*) from video where blog_id=?',(${blogId},)).fetchone()[0])`
  ]).toString().trim(), 10);
  check('该日志只有 1 条视频记录', videoCount === 1, `实际 ${videoCount} 条`);

  console.log('\n===== 7. 主动删除视频 =====');
  r = await api(`/blogs/${blogId}/update`, 'POST', {
    content: '<p>【视频测试】删掉视频</p>',
    baby_ids: [1], photo_ids: [], remove_video: true,
  });
  check('删除视频 200', r.status === 200, `status=${r.status}`);
  check('video 已清空', r.data?.data?.video === null || r.data?.data?.video === undefined, JSON.stringify(r.data?.data?.video));
  check('视频文件已删除', !fs.existsSync(abs2), abs2);

  console.log('\n===== 8. 清理测试日志 =====');
  for (const id of blogIds) {
    r = await api(`/blogs/${id}`, 'DELETE');
    check(`删除测试日志 ${id}`, r.status === 204, `status=${r.status}`);
  }
  const leftover = fs.readdirSync(path.join(UPLOAD_DIR, 'videos/tmp'));
  check('临时目录干净', leftover.length === 0, leftover.join(','));

  console.log('\n' + '='.repeat(52));
  console.log(`结果: ${pass} 通过 / ${fail} 失败`);
  if (fails.length) { console.log('失败项:'); fails.forEach(f => console.log('  -', f)); }
  console.log('='.repeat(52));
  process.exit(fail ? 1 : 0);
})();
