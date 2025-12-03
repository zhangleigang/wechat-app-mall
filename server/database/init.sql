-- 创建数据库
CREATE DATABASE IF NOT EXISTS ai_interview_helper CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE ai_interview_helper;

-- 设置字符集和排序规则
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_general_ci;

-- 1. 用户会员表（复用，扩展字段）
CREATE TABLE IF NOT EXISTS members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信OpenID（唯一标识）',
    unionid VARCHAR(100) COMMENT '微信UnionID（跨应用唯一标识）',
    session_key VARCHAR(100) COMMENT '微信session_key（用于解密手机号等）',
    
    -- 基础信息（来自 wx.getUserProfile）
    nick_name VARCHAR(100) COMMENT '用户昵称',
    avatar_url VARCHAR(500) COMMENT '用户头像URL',
    gender TINYINT DEFAULT 0 COMMENT '性别：0未知，1男，2女',
    country VARCHAR(50) COMMENT '国家',
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    language VARCHAR(20) DEFAULT 'zh_CN' COMMENT '语言',
    
    -- 联系方式
    phone VARCHAR(20) COMMENT '手机号（需要单独授权）',
    
    -- 会员信息
    expire_date DATETIME COMMENT '会员过期时间',
    
    -- 时间戳
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册/首次开通时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    
    -- 索引
    INDEX idx_openid (openid),
    INDEX idx_unionid (unionid),
    INDEX idx_expire_date (expire_date),
    INDEX idx_created_at (created_at),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户会员表（整合用户信息和会员状态）';

-- 2. 订单记录表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(100) UNIQUE NOT NULL COMMENT '订单号',
    openid VARCHAR(100) NOT NULL COMMENT '微信OpenID',
    nick_name VARCHAR(100) COMMENT '用户昵称（下单时）',
    package_id VARCHAR(50) NOT NULL COMMENT '套餐ID（monthly/quarterly/yearly）',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    duration INT NOT NULL COMMENT '购买天数',
    status TINYINT DEFAULT 1 COMMENT '订单状态：0取消，1已完成',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_order_number (order_number),
    INDEX idx_openid (openid),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单记录表';

-- 3. 创建有用的视图

-- 有效会员视图
CREATE OR REPLACE VIEW valid_members AS
SELECT 
    openid,
    nick_name,
    avatar_url,
    expire_date,
    DATEDIFF(expire_date, NOW()) as days_remaining,
    created_at
FROM members
WHERE expire_date > NOW()
ORDER BY expire_date DESC;

-- 订单统计视图
CREATE OR REPLACE VIEW order_stats AS
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as order_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT openid) as unique_users
FROM orders
WHERE status = 1
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- 会员统计视图
CREATE OR REPLACE VIEW member_stats AS
SELECT 
    COUNT(*) as total_members,
    SUM(CASE WHEN expire_date > NOW() THEN 1 ELSE 0 END) as valid_members,
    SUM(CASE WHEN expire_date <= NOW() OR expire_date IS NULL THEN 1 ELSE 0 END) as expired_members,
    SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new_members
FROM members;

-- 4. 插入测试数据（可选，生产环境请删除）
-- INSERT INTO members (openid, nick_name, avatar_url, expire_date) VALUES 
-- ('test_openid_001', '测试用户', 'https://example.com/avatar.jpg', DATE_ADD(NOW(), INTERVAL 30 DAY));

-- 5. 数据库初始化完成提示
SELECT 'Database initialization completed successfully!' as status;
SELECT DATABASE() as database_name;
SELECT 'Tables created: members, orders' as tables_info;
SELECT 'Views created: valid_members, order_stats, member_stats' as views_info;
