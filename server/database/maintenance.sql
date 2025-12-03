-- 数据库维护脚本
-- 用于日常维护、备份、清理等操作

USE ai_interview_helper;

-- ============================================
-- 1. 数据统计查询
-- ============================================

-- 总体统计
SELECT 
    '总用户数' as metric,
    COUNT(*) as value
FROM members
UNION ALL
SELECT 
    '有效会员数',
    COUNT(*)
FROM members
WHERE expire_date > NOW()
UNION ALL
SELECT 
    '总订单数',
    COUNT(*)
FROM orders
UNION ALL
SELECT 
    '总收入',
    SUM(amount)
FROM orders;

-- ============================================
-- 2. 会员到期提醒
-- ============================================

-- 查询即将到期的会员（7天内）
SELECT 
    openid,
    nick_name,
    expire_date,
    DATEDIFF(expire_date, NOW()) as days_remaining
FROM members
WHERE expire_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY expire_date ASC;

-- ============================================
-- 3. 数据清理（谨慎使用）
-- ============================================

-- 清理过期超过1年的会员数据（注释掉，需要时手动执行）
-- DELETE FROM members 
-- WHERE expire_date < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 清理测试数据（注释掉，需要时手动执行）
-- DELETE FROM members WHERE openid LIKE 'test_%';
-- DELETE FROM members WHERE openid LIKE 'mock_%';

-- ============================================
-- 4. 数据备份
-- ============================================

-- 备份会员数据到临时表
-- CREATE TABLE members_backup_20241202 AS SELECT * FROM members;

-- 备份订单数据到临时表
-- CREATE TABLE orders_backup_20241202 AS SELECT * FROM orders;

-- ============================================
-- 5. 性能优化
-- ============================================

-- 分析表
ANALYZE TABLE members;
ANALYZE TABLE orders;

-- 优化表
OPTIMIZE TABLE members;
OPTIMIZE TABLE orders;

-- 查看表状态
SHOW TABLE STATUS LIKE 'members';
SHOW TABLE STATUS LIKE 'orders';

-- ============================================
-- 6. 索引检查
-- ============================================

-- 查看 members 表索引
SHOW INDEX FROM members;

-- 查看 orders 表索引
SHOW INDEX FROM orders;

-- ============================================
-- 7. 数据完整性检查
-- ============================================

-- 检查孤立订单（没有对应用户的订单）
SELECT o.* 
FROM orders o
LEFT JOIN members m ON o.openid = m.openid
WHERE m.openid IS NULL;

-- 检查重复的 openid
SELECT openid, COUNT(*) as count
FROM members
GROUP BY openid
HAVING count > 1;

-- 检查重复的订单号
SELECT order_number, COUNT(*) as count
FROM orders
GROUP BY order_number
HAVING count > 1;

-- ============================================
-- 8. 常用查询
-- ============================================

-- 查询最近7天的订单
SELECT * FROM orders
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- 查询最近7天的新用户
SELECT * FROM members
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- 查询最活跃的用户（订单最多）
SELECT 
    m.openid,
    m.nick_name,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_spent
FROM members m
LEFT JOIN orders o ON m.openid = o.openid
GROUP BY m.openid, m.nick_name
ORDER BY order_count DESC
LIMIT 10;

-- 查询收入趋势（按月）
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as order_count,
    SUM(amount) as total_amount
FROM orders
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- ============================================
-- 9. 数据修复（谨慎使用）
-- ============================================

-- 修复没有创建时间的记录
-- UPDATE members SET created_at = NOW() WHERE created_at IS NULL;

-- 修复没有更新时间的记录
-- UPDATE members SET updated_at = NOW() WHERE updated_at IS NULL;

-- ============================================
-- 10. 权限管理
-- ============================================

-- 创建只读用户（用于数据分析）
-- CREATE USER 'readonly'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT ON ai_interview_helper.* TO 'readonly'@'localhost';
-- FLUSH PRIVILEGES;

-- 创建应用用户（用于应用连接）
-- CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT, INSERT, UPDATE ON ai_interview_helper.* TO 'app_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- 完成
-- ============================================

SELECT '✅ 维护脚本执行完成！' as status;
