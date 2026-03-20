# BabyLog 技能文档

宝贝日记操作技能，用于通过自然语言操作 BabyLog 数据库。

## 项目信息

- **项目名称**：宝贝日记 / 宝贝日志
- **技术栈**：Express.js + Sequelize + SQLite（后端），Next.js + Shadcn UI（前端）
- **数据库**：SQLite，位于 `express_back/babylog_data.db`

---

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
   - 精确匹配 user.familymember 字段

### 内容处理规则

添加日志前，对内容进行优化：
1. 修正错别字
2. 补充/修正标点符号
3. 理顺不通顺的语句
4. 保持原意，不做过度修改

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

---

## 功能三：修改日志

### 触发句式

**全量替换**：
```
把日志[ID]的内容全部替换成[新内容]
日志[ID]内容改成[新内容]
```

**部分替换**：
```
修改日志[ID]，把"原内容"改成"新内容"
日志[ID]里的"XXX"改成"YYY"
修改日志[ID]的错字，把"XXX"改成"YYY"
```

**追加内容**：
```
在日志[ID]后面追加"XXX"
日志[ID]追加内容：XXX
```

**变体**：
- 全量替换：`把日志1184的内容全部替换成今天露西很开心`
- 部分替换：`修改日志1184，把"打原神"改成"打王者荣耀"`
- 追加内容：`在日志1184后面追加，后来他们玩得很开心`
- 同时改宝宝：`修改日志1184，把"XXX"改成"YYY"，关联露西和垚垚`

### 参数提取规则

1. **日志ID** (`id`)
   - 从"日志N"或"日志ID N"提取N
   - 必填，必须是数字

2. **修改方式**
   - 全量替换：检测"全部替换"、"内容改成"等关键词
   - 部分替换：检测"把"XXX"改成"YYY""结构
   - 追加内容：检测"追加"关键词

3. **查找内容** (`find`) - 部分替换时
   - 从"把"XXX"改成"YYY""提取XXX
   - 必填

4. **替换内容** (`replace`)
   - 全量替换：提取新内容
   - 部分替换：提取YYY

5. **追加内容** (`append`)
   - 从"追加"XXX""提取内容

6. **宝宝关联** (`babies`)
   - 从"关联XXX"提取，多个用"和"或"、"连接
   - 可选，不填则保持原有关联

### 内容处理规则

修改日志前，对新内容进行优化：
1. 修正错别字
2. 补充/修正标点符号
3. 理顺不通顺的语句
4. 保持原意，不做过度修改

### 执行脚本

```bash
# 全量替换
python skills/babylog/scripts/edit_blog.py --id 123 --replace "全新的内容"

# 部分替换（查找并替换）
python skills/babylog/scripts/edit_blog.py --id 123 --find "原内容" --replace "新内容"

# 追加内容
python skills/babylog/scripts/edit_blog.py --id 123 --append "追加的内容"

# 同时更新宝宝关联
python skills/babylog/scripts/edit_blog.py --id 123 --replace "新内容" --babies "露西,垚垚"
```

---

## 待开发功能

- [ ] 删除日志
- [ ] 添加健康数据（身高体重）
- [ ] 查询健康数据
- [ ] 添加照片