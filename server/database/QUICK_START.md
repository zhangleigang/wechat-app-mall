# 数据库快速启动指南

## 快速初始化

```bash
# 进入数据库脚本目录
cd server/database

# 执行完整初始化（包含所有功能）
mysql -u root -p < init.sql
```

**说明**：脚本会自动创建数据库和所有表（members、orders、resumes、favorites、tags、favorite_tags）

## 验证安装

```sql
-- 登录 MySQL
mysql -u root -p

-- 切换到数据库
USE ai_interview_helper;

-- 查看所有表
SHOW TABLES;

-- 应该看到以下表：
-- favorites
-- favorite_tags
-- members
-- orders
-- resumes
-- tags

-- 查看收藏表结构
DESCRIBE favorites;

-- 查看标签表结构
DESCRIBE tags;

-- 查看关联表结构
DESCRIBE favorite_tags;

-- 查看所有视图
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- 查看触发器
SHOW TRIGGERS;
```

## 测试数据（可选）

```sql
-- 插入测试用户（如果不存在）
INSERT INTO members (openid, nick_name, expire_date) 
VALUES ('test_user_001', '测试用户', DATE_ADD(NOW(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE nick_name = '测试用户';

-- 插入测试收藏
INSERT INTO favorites (openid, question, answer, source_type, source_category)
VALUES 
('test_user_001', 'Spark的RDD是什么？', '# RDD概念\n\nRDD（Resilient Distributed Dataset）是Spark的核心抽象...', 'knowledge', 'Spark'),
('test_user_001', '如何优化简历？', '# 简历优化建议\n\n1. 突出核心技能\n2. 量化工作成果...', 'resume', NULL),
('test_user_001', '面试时如何自我介绍？', '# 自我介绍技巧\n\n1. 简洁明了\n2. 突出亮点...', 'custom', NULL);

-- 插入测试标签
INSERT INTO tags (openid, name) 
VALUES 
('test_user_001', 'Spark'),
('test_user_001', '简历分析'),
('test_user_001', '面试技巧')
ON DUPLICATE KEY UPDATE name = name;

-- 关联标签到收藏
INSERT INTO favorite_tags (favorite_id, tag_id)
SELECT f.id, t.id
FROM favorites f, tags t
WHERE f.openid = 'test_user_001' 
  AND t.openid = 'test_user_001'
  AND f.source_type = 'knowledge'
  AND t.name = 'Spark'
LIMIT 1;

-- 查看测试数据
SELECT * FROM favorites WHERE openid = 'test_user_001';
SELECT * FROM tags WHERE openid = 'test_user_001';
SELECT * FROM favorite_tags;

-- 查看统计视图
SELECT * FROM favorite_stats WHERE openid = 'test_user_001';
SELECT * FROM tag_usage_stats WHERE openid = 'test_user_001';
```

## 常用查询

### 获取用户收藏列表（带标签）
```sql
SELECT 
    f.id,
    f.question,
    SUBSTRING(f.answer, 1, 100) as answer_preview,
    f.source_type,
    f.source_category,
    f.created_at,
    GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') as tags
FROM favorites f
LEFT JOIN favorite_tags ft ON f.id = ft.favorite_id
LEFT JOIN tags t ON ft.tag_id = t.id
WHERE f.openid = 'test_user_001'
GROUP BY f.id, f.question, f.answer, f.source_type, f.source_category, f.created_at
ORDER BY f.created_at DESC;
```

### 获取用户标签列表（带使用次数）
```sql
SELECT 
    t.id,
    t.name,
    COUNT(ft.favorite_id) as use_count
FROM tags t
LEFT JOIN favorite_tags ft ON t.id = ft.tag_id
WHERE t.openid = 'test_user_001'
GROUP BY t.id, t.name
ORDER BY use_count DESC, t.name ASC;
```

### 按标签筛选收藏
```sql
SELECT DISTINCT
    f.id,
    f.question,
    f.source_type,
    f.created_at
FROM favorites f
INNER JOIN favorite_tags ft ON f.id = ft.favorite_id
INNER JOIN tags t ON ft.tag_id = t.id
WHERE f.openid = 'test_user_001'
  AND t.name = 'Spark'
ORDER BY f.created_at DESC;
```

### 检查用户收藏数量（会员限制）
```sql
SELECT 
    COUNT(*) as favorite_count,
    CASE 
        WHEN m.expire_date > NOW() THEN 'member'
        ELSE 'free'
    END as user_type,
    CASE 
        WHEN m.expire_date > NOW() THEN 'unlimited'
        WHEN COUNT(*) >= 10 THEN 'limit_reached'
        ELSE 'available'
    END as quota_status
FROM favorites f
LEFT JOIN members m ON f.openid = m.openid
WHERE f.openid = 'test_user_001'
GROUP BY m.expire_date;
```

## 清理测试数据

```sql
-- 删除测试用户的所有数据（级联删除）
DELETE FROM members WHERE openid = 'test_user_001';

-- 或者只删除收藏相关数据
DELETE FROM favorites WHERE openid = 'test_user_001';
DELETE FROM tags WHERE openid = 'test_user_001';
```

## 性能测试

```sql
-- 查看索引使用情况
EXPLAIN SELECT * FROM favorites WHERE openid = 'test_user_001' ORDER BY created_at DESC;

-- 查看表统计信息
SHOW TABLE STATUS LIKE 'favorites';
SHOW TABLE STATUS LIKE 'tags';
SHOW TABLE STATUS LIKE 'favorite_tags';

-- 分析表
ANALYZE TABLE favorites, tags, favorite_tags;
```

## 故障排查

### 外键约束错误
```sql
-- 检查 members 表是否存在
SELECT COUNT(*) FROM members WHERE openid = 'test_user_001';

-- 如果不存在，先创建用户
INSERT INTO members (openid, nick_name) VALUES ('test_user_001', '测试用户');
```

### 触发器不工作
```sql
-- 检查触发器是否存在
SHOW TRIGGERS LIKE 'favorite_tags';

-- 手动更新标签使用次数
UPDATE tags t
SET use_count = (
    SELECT COUNT(*) 
    FROM favorite_tags ft 
    WHERE ft.tag_id = t.id
);
```

### 视图查询慢
```sql
-- 直接查询基础表
SELECT * FROM favorites WHERE openid = 'test_user_001' LIMIT 10;

-- 检查是否需要优化索引
SHOW INDEX FROM favorites;
```

## 备份与恢复

### 备份收藏数据
```bash
# 备份所有收藏相关表
mysqldump -u root -p ai_interview_helper favorites tags favorite_tags > favorites_backup.sql

# 备份整个数据库
mysqldump -u root -p ai_interview_helper > full_backup.sql
```

### 恢复数据
```bash
# 恢复收藏数据
mysql -u root -p ai_interview_helper < favorites_backup.sql

# 恢复整个数据库
mysql -u root -p ai_interview_helper < full_backup.sql
```

## 下一步

1. 启动后端服务：`cd server && npm start`
2. 测试 API 接口：参考 `docs/FAVORITES_API.md`
3. 集成前端：参考 `miniprogram/utils/favorites-api.js`

## 需要帮助？

- 查看详细文档：`README.md`
- API 文档：`../docs/FAVORITES_API.md`
- 部署指南：`../docs/DEPLOYMENT_GUIDE.md`
