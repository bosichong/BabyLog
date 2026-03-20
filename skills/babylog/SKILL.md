# BabyLog 技能

宝贝日志操作技能，用于通过自然语言操作 BabyLog 数据库。

## 项目信息

- **项目路径**: `/home/bosi/code/BabyLog_自家使用版本`
- **数据库**: SQLite，位于 `express_back/babylog_data.db`
- **后端**: Express.js + Sequelize

## 数据库结构

### 表关系

```
User ──1:N──> Blog ──1:N──> Photo
                 │
                 │M:N (via blog_baby)
                 ▼
               Baby ──1:N──> Healthy
```

### 表说明

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| user | 用户表 | id, username, familymember, sex, is_active |
| baby | 宝宝表 | id, name, birthday |
| blog | 日志表 | id, blog, user_id, create_time |
| blog_baby | 关联表 | id, blog_id, baby_id |
| healthy | 健康数据 | id, height, weight, baby_id |
| photo | 照片表 | id, file_name, file_path, file_url, user_id, blog_id |

### 当前数据

**宝宝**：
- 垚垚 (id=1, 生日: 2012-03-22)
- 露西 (id=2, 生日: 2019-02-14)

**用户**：
- 爸爸 (id=1, username=hua)
- 妈妈 (id=2, username=so)

---

## 功能一：添加日志

### 触发句式

```
给[宝宝]添加日志，内容是[日志内容]
```

**变体**：
- 单个宝宝：`给露西添加日志，内容是今天露西很开心`
- 多个宝宝：`给垚垚和露西添加日志，内容是全家去公园玩`
- 指定添加者：`给露西添加日志，内容是xxx。添加者是妈妈`

### 参数提取规则

1. **宝宝名称** (`babies`)
   - 从"给XXX添加日志"提取XXX
   - 单个：`给露西添加日志` → 露西
   - 多个：`给垚垚和露西添加日志` → 垚垚、露西（用"和"连接）
   - 匹配方式：先精确匹配，再模糊匹配
   - 匹配到多个时返回错误，要求使用完整名称

2. **日志内容** (`content`)
   - 从"内容是XXX"提取XXX，到句末或下一个指令为止
   - 必填，不能为空

3. **添加者** (`author`)
   - 从"添加者是XXX"提取XXX
   - 可选，默认"爸爸"
   - 精确匹配 user.familymember 字段（爸爸/妈妈）

### 关联规则

- 宝宝：通过 `blog_baby` 表关联，支持多个
- 添加者：通过 `user_id` 字段关联

### 内容处理规则

添加日志前，对内容进行优化：
1. 修正错别字
2. 补充/修正标点符号
3. 理顺不通顺的语句
4. 保持原意，不做过度修改

**示例**：
- 原始：`露西今天很开心在花园玩了一下午`
- 优化：`露西今天很开心，在花园玩了一下午。`

### 执行脚本

```bash
python skills/babylog/scripts/add_blog.py --content "内容" --babies "露西" --author "爸爸"
```

---

## 功能二：搜索日志

### 触发句式

```
返回宝贝日记最近[N]条日志
返回[宝宝]最近[N]条日志
给我[N]条关于[宝宝]的[关键字]日志
```

**变体**：
- 全部日志：`返回最近10条日志` / `给我最近的10条日记`
- 按宝宝：`返回露西最近10条日志` / `给我10条关于露西的日志`
- 按关键字：`给我10条关于哭的日志`
- 组合：`给我10条关于露西的爱哭的日志`

### 参数提取规则

1. **数量** (`limit`)
   - 从"最近N条"或"给我N条"提取N
   - 可选，默认10条

2. **宝宝名称** (`baby`)
   - 从"关于XXX的"或"XXX最近"提取
   - 可选，用于筛选

3. **关键字** (`keyword`)
   - 从"关于XXX的日志"提取XXX（如果XXX不是宝宝名）
   - 可选，全文搜索

### 返回格式

表格形式，包含：
- ID
- 内容（超长截断）
- 创建时间
- 关联家长
- 关联宝宝

### 执行脚本

```bash
python skills/babylog/scripts/search_blog.py                      # 最近10条
python skills/babylog/scripts/search_blog.py --limit 20           # 最近20条
python skills/babylog/scripts/search_blog.py --baby "露西"        # 露西的日志
python skills/babylog/scripts/search_blog.py --keyword "哭"       # 关键字搜索
python skills/babylog/scripts/search_blog.py --baby "露西" --keyword "测试"  # 组合
```

### 执行脚本

```bash
python /home/bosi/code/BabyLog_自家使用版本/skills/babylog/scripts/add_blog.py \
  --content "日志内容" \
  --babies "露西,垚垚" \
  --author "爸爸"
```

### 返回结果

脚本返回 JSON 格式：

```json
{
  "success": true/false,
  "message": "人类可读的结果消息",
  "data": { ... },  // 成功时的数据
  "error": "..."    // 失败时的错误详情
}
```

### 错误处理

- 宝宝名称不存在 → 返回错误提示
- 宝宝名称匹配到多个 → 返回错误，提示使用完整名称
- 添加者不存在 → 返回错误提示
- 日志内容为空 → 返回错误提示
- 数据库错误 → 返回具体错误信息

---

## 待开发功能

- [ ] 删除日志
- [ ] 编辑日志
- [ ] 添加健康数据（身高体重）
- [ ] 查询健康数据
- [ ] 添加照片