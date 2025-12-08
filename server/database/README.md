# 数据库初始化脚本

本目录包含AI面试助手项目的所有数据库初始化脚本。

## 脚本说明

### 1. init.sql
**完整数据库初始化脚本（v1.2.0）**

包含所有功能模块：
- 用户会员表 `members`
- 订单记录表 `orders`
- 简历表 `resumes`
- 收藏表 `favorites`
- 标签表 `tags`
- 收藏-标签关联表 `favorite_tags`
- 所有相关视图和触发器

**使用场景**：全新部署或重建数据库

```bash
# 方式1：自动创建数据库
mysql -u root -p < init.sql

# 方式2：指定已存在的数据库
mysql -u root -p ai_interview_helper < init.sql
```

### 2. maintenance.sql
**数据库维护脚本**
- 数据清理
- 索引优化
- 统计信息更新

## 数据库结构

### 核心模块
```
members (用户会员表)
  ├── id (主键)
  ├── openid (唯一标识)
  ├── nick_name, avatar_url (用户信息)
  ├── expire_date (会员过期时间)
  └── created_at, updated_at (时间戳)

orders (订单记录表)
  ├── id (主键)
  ├── order_number (订单号)
  ├── openid (关联用户)
  ├── package_id, amount, duration (订单信息)
  └── created_at (创建时间)
```

### 简历管理模块
```
resumes (简历表)
  ├── id (主键)
  ├── openid (关联用户) → FK: members.openid
  ├── filename, file_path (文件信息)
  ├── parsed_text (解析文本)
  └── upload_time, created_at (时间戳)
```

### 收藏功能模块
```
favorites (收藏表)
  ├── id (主键)
  ├── openid (关联用户) → FK: members.openid
  ├── question, answer (问答内容)
  ├── source_type, source_id, source_category (来源信息)
  └── created_at, updated_at (时间戳)

tags (标签表)
  ├── id (主键)
  ├── name (标签名)
  ├── openid (创建者) → FK: members.openid
  ├── use_count (使用次数)
  └── created_at (创建时间)

favorite_tags (收藏-标签关联表)
  ├── id (主键)
  ├── favorite_id → FK: favorites.id (级联删除)
  ├── tag_id → FK: tags.id (级联删除)
  └── created_at (创建时间)
```

## 表关系图

```
members (用户)
  ├─→ orders (订单)
  ├─→ resumes (简历)
  ├─→ favorites (收藏)
  └─→ tags (标签)

favorites (收藏)
  └─→ favorite_tags ←─ tags (标签)
```

## 索引策略

### 单列索引
- `openid` - 所有用户相关表的主要查询字段
- `created_at` - 时间排序查询
- `source_type` - 收藏来源筛选
- `use_count` - 标签热度排序

### 复合索引
- `(openid, created_at DESC)` - 用户收藏列表查询优化
- `(openid, source_type)` - 用户按来源类型查询优化
- `(openid, name)` - 标签唯一性约束

### 唯一索引
- `(openid, name)` - 用户标签名唯一
- `(favorite_id, tag_id)` - 收藏标签关联唯一

## 外键约束

### 级联删除策略
- 删除用户 → 自动删除其所有订单、简历、收藏、标签
- 删除收藏 → 自动删除其所有标签关联
- 删除标签 → 自动删除其所有收藏关联

## 触发器

### trg_favorite_tags_insert
- **触发时机**：插入收藏-标签关联记录后
- **作用**：自动增加标签的 use_count

### trg_favorite_tags_delete
- **触发时机**：删除收藏-标签关联记录后
- **作用**：自动减少标签的 use_count

## 视图

### 核心模块视图
- `valid_members` - 有效会员列表
- `order_stats` - 订单统计（按日期）
- `member_stats` - 会员统计（总数、有效、过期）

### 简历模块视图
- `resume_stats` - 用户简历统计

### 收藏模块视图
- `favorite_stats` - 用户收藏统计（按来源分类）
- `tag_usage_stats` - 标签使用统计
- `recent_favorites` - 最近收藏（带标签信息）
- `popular_tags` - 热门标签排行

## 初始化方法

```bash
# 执行完整初始化脚本
mysql -u root -p < init.sql

# 或者指定数据库
mysql -u root -p ai_interview_helper < init.sql
```

**注意**：脚本会自动创建数据库（如果不存在），包含所有表、视图和触发器。

## 环境要求

- MySQL 8.0+
- 字符集：utf8mb4
- 排序规则：utf8mb4_general_ci
- 存储引擎：InnoDB

## 注意事项

1. **字符集**：所有表使用 utf8mb4，支持 emoji 和特殊字符
2. **时区**：时间戳使用服务器本地时区
3. **外键约束**：确保先创建 members 表，再创建其他表
4. **触发器**：MySQL 8.0+ 支持 `CREATE TRIGGER IF NOT EXISTS`
5. **视图**：使用 `CREATE OR REPLACE VIEW` 支持重复执行
6. **备份**：初始化前建议备份现有数据

## 数据迁移

如果需要从旧版本迁移数据，请参考 `maintenance.sql` 中的迁移脚本。

## 性能优化建议

1. **定期优化表**：`OPTIMIZE TABLE favorites, tags, favorite_tags;`
2. **分析表统计**：`ANALYZE TABLE favorites, tags, favorite_tags;`
3. **监控慢查询**：启用 MySQL 慢查询日志
4. **索引使用情况**：定期检查 `EXPLAIN` 查询计划

## 故障排查

### 外键约束错误
```sql
-- 检查外键约束
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'ai_interview_helper';

-- 临时禁用外键检查（仅用于调试）
SET FOREIGN_KEY_CHECKS = 0;
-- 执行操作
SET FOREIGN_KEY_CHECKS = 1;
```

### 触发器问题
```sql
-- 查看所有触发器
SHOW TRIGGERS FROM ai_interview_helper;

-- 删除触发器
DROP TRIGGER IF EXISTS trg_favorite_tags_insert;
DROP TRIGGER IF EXISTS trg_favorite_tags_delete;
```

### 视图问题
```sql
-- 查看所有视图
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- 删除视图
DROP VIEW IF EXISTS favorite_stats;
```

## 联系方式

如有问题，请查看项目文档或联系开发团队。
