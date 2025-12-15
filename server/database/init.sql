-- AI面试助手 - 数据库初始化脚本
-- 版本：v1.2.0
-- 包含所有功能模块：用户会员、订单、简历管理、收藏功能
-- 
-- 使用方法：
--   mysql -u root -p < init.sql
-- 
-- 或者指定数据库：
--   mysql -u root -p ai_interview_helper < init.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS ai_interview_helper CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE ai_interview_helper;

-- 设置字符集和排序规则
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_general_ci;

-- ============================================
-- 核心模块：用户会员和订单
-- ============================================

-- 1. 用户会员表
CREATE TABLE IF NOT EXISTS members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信OpenID（唯一标识）',
    unionid VARCHAR(100) COMMENT '微信UnionID（跨应用唯一标识）',
    session_key VARCHAR(100) COMMENT '微信session_key（用于解密手机号等）',
    
    -- 基础信息
    nick_name VARCHAR(100) COMMENT '用户昵称',
    avatar_url VARCHAR(500) COMMENT '用户头像URL',
    gender TINYINT DEFAULT 0 COMMENT '性别：0未知，1男，2女',
    country VARCHAR(50) COMMENT '国家',
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    language VARCHAR(20) DEFAULT 'zh_CN' COMMENT '语言',
    
    -- 联系方式
    phone VARCHAR(20) COMMENT '手机号',
    
    -- 会员信息
    expire_date DATETIME COMMENT '会员过期时间',
    
    -- 时间戳
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_openid (openid),
    INDEX idx_unionid (unionid),
    INDEX idx_expire_date (expire_date),
    INDEX idx_created_at (created_at),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户会员表';

-- 2. 订单记录表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(100) UNIQUE NOT NULL COMMENT '订单号',
    openid VARCHAR(100) NOT NULL COMMENT '微信OpenID',
    nick_name VARCHAR(100) COMMENT '用户昵称',
    package_id VARCHAR(50) NOT NULL COMMENT '套餐ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    duration INT NOT NULL COMMENT '购买天数',
    status TINYINT DEFAULT 0 COMMENT '订单状态：0待核实，1已核实，2已取消',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_number (order_number),
    INDEX idx_openid (openid),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单记录表';

-- ============================================
-- 简历管理模块
-- ============================================

-- 3. 简历表
CREATE TABLE IF NOT EXISTS resumes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '简历ID',
    openid VARCHAR(100) NOT NULL COMMENT '微信OpenID',
    filename VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    parsed_text TEXT COMMENT '解析后的文本内容',
    file_size INT COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_openid (openid),
    INDEX idx_upload_time (upload_time),
    INDEX idx_created_at (created_at),
    
    CONSTRAINT fk_resumes_openid FOREIGN KEY (openid) REFERENCES members(openid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='简历文件管理表';

-- ============================================
-- 收藏功能模块
-- ============================================

-- 4. 收藏主表
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '收藏ID',
    openid VARCHAR(100) NOT NULL COMMENT '微信OpenID',
    
    -- 问题和答案
    question TEXT NOT NULL COMMENT '问题内容',
    answer LONGTEXT NOT NULL COMMENT '答案内容（Markdown格式）',
    
    -- 来源信息
    source_type ENUM('knowledge', 'resume', 'custom') NOT NULL COMMENT '来源类型',
    source_id VARCHAR(100) COMMENT '来源ID',
    source_category VARCHAR(50) COMMENT '来源分类',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_openid (openid),
    INDEX idx_source_type (source_type),
    INDEX idx_created_at (created_at),
    INDEX idx_openid_created (openid, created_at DESC),
    INDEX idx_openid_source (openid, source_type),
    
    CONSTRAINT fk_favorites_openid FOREIGN KEY (openid) REFERENCES members(openid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='收藏表';

-- 5. 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
    name VARCHAR(50) NOT NULL COMMENT '标签名称',
    openid VARCHAR(100) NOT NULL COMMENT '创建者OpenID',
    use_count INT DEFAULT 0 COMMENT '使用次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_openid_name (openid, name),
    INDEX idx_openid (openid),
    INDEX idx_use_count (use_count DESC),
    INDEX idx_name (name),
    
    CONSTRAINT fk_tags_openid FOREIGN KEY (openid) REFERENCES members(openid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='标签表';

-- 6. 收藏-标签关联表
CREATE TABLE IF NOT EXISTS favorite_tags (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    favorite_id INT NOT NULL COMMENT '收藏ID',
    tag_id INT NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_favorite_tag (favorite_id, tag_id),
    INDEX idx_favorite_id (favorite_id),
    INDEX idx_tag_id (tag_id),
    
    CONSTRAINT fk_favorite_tags_favorite FOREIGN KEY (favorite_id) REFERENCES favorites(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='收藏标签关联表';

-- ============================================
-- 视图定义
-- ============================================

-- 有效会员视图
CREATE OR REPLACE VIEW valid_members AS
SELECT 
    openid, nick_name, avatar_url, expire_date,
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

-- 用户简历统计视图
CREATE OR REPLACE VIEW resume_stats AS
SELECT 
    openid,
    COUNT(*) as resume_count,
    MAX(upload_time) as last_upload_time,
    SUM(file_size) as total_file_size
FROM resumes
GROUP BY openid;

-- 用户收藏统计视图
CREATE OR REPLACE VIEW favorite_stats AS
SELECT 
    openid,
    COUNT(*) as total_favorites,
    SUM(CASE WHEN source_type = 'knowledge' THEN 1 ELSE 0 END) as knowledge_count,
    SUM(CASE WHEN source_type = 'resume' THEN 1 ELSE 0 END) as resume_count,
    SUM(CASE WHEN source_type = 'custom' THEN 1 ELSE 0 END) as custom_count,
    MAX(created_at) as last_favorite_time,
    MIN(created_at) as first_favorite_time
FROM favorites
GROUP BY openid;

-- 标签使用统计视图
CREATE OR REPLACE VIEW tag_usage_stats AS
SELECT 
    t.id as tag_id,
    t.name as tag_name,
    t.openid,
    COUNT(ft.favorite_id) as actual_use_count,
    t.use_count as stored_use_count,
    t.created_at
FROM tags t
LEFT JOIN favorite_tags ft ON t.id = ft.tag_id
GROUP BY t.id, t.name, t.openid, t.use_count, t.created_at
ORDER BY actual_use_count DESC;

-- 最近收藏视图
CREATE OR REPLACE VIEW recent_favorites AS
SELECT 
    f.id, f.openid, f.question,
    SUBSTRING(f.answer, 1, 200) as answer_preview,
    f.source_type, f.source_category, f.created_at,
    m.nick_name,
    GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') as tags
FROM favorites f
LEFT JOIN members m ON f.openid = m.openid
LEFT JOIN favorite_tags ft ON f.id = ft.favorite_id
LEFT JOIN tags t ON ft.tag_id = t.id
GROUP BY f.id, f.openid, f.question, f.answer, f.source_type, f.source_category, f.created_at, m.nick_name
ORDER BY f.created_at DESC
LIMIT 100;

-- 热门标签视图
CREATE OR REPLACE VIEW popular_tags AS
SELECT 
    t.id, t.name, t.openid,
    COUNT(ft.favorite_id) as use_count,
    m.nick_name
FROM tags t
LEFT JOIN favorite_tags ft ON t.id = ft.tag_id
LEFT JOIN members m ON t.openid = m.openid
GROUP BY t.id, t.name, t.openid, m.nick_name
HAVING use_count > 0
ORDER BY use_count DESC, t.name ASC;

-- ============================================
-- 扩展模块：意见反馈
-- ============================================

-- 意见反馈表
CREATE TABLE IF NOT EXISTS feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) NOT NULL COMMENT '用户OpenID',
    
    -- 联系信息
    name VARCHAR(100) DEFAULT '匿名' COMMENT '用户姓名',
    mobile VARCHAR(20) COMMENT '联系电话',
    wechat VARCHAR(100) COMMENT '微信号',
    
    -- 反馈内容
    content TEXT NOT NULL COMMENT '反馈内容',
    type VARCHAR(20) DEFAULT 'feedback' COMMENT '反馈类型：feedback-一般反馈，bug-问题报告',
    source VARCHAR(20) DEFAULT 'miniprogram' COMMENT '来源：miniprogram-小程序',
    
    -- 处理状态（简化为三个状态）
    status VARCHAR(20) DEFAULT 'unread' COMMENT '状态：unread-未读，read-已读，resolved-已解决',
    admin_note TEXT COMMENT '管理员备注（可选）',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_openid (openid),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type),
    
    -- 外键约束
    FOREIGN KEY (openid) REFERENCES members(openid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='意见反馈表';

-- ============================================
-- 触发器定义
-- ============================================

-- 添加标签关联时增加使用次数
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_favorite_tags_insert
AFTER INSERT ON favorite_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET use_count = use_count + 1 WHERE id = NEW.tag_id;
END//
DELIMITER ;

-- 删除标签关联时减少使用次数
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_favorite_tags_delete
AFTER DELETE ON favorite_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET use_count = use_count - 1 WHERE id = OLD.tag_id;
END//
DELIMITER ;

-- ============================================
-- 初始化完成
-- ============================================

SELECT '========================================' as '';
SELECT 'Database initialization completed!' as status;
SELECT DATABASE() as database_name;
SELECT '========================================' as '';
SELECT 'Core tables: members, orders' as module_1;
SELECT 'Resume tables: resumes' as module_2;
SELECT 'Favorites tables: favorites, tags, favorite_tags' as module_3;
SELECT 'Feedback tables: feedback' as module_4;
SELECT '========================================' as '';
SELECT 'Total tables created: 6' as summary;
SELECT 'Total views created: 9' as summary;
SELECT 'Total triggers created: 2' as summary;
SELECT '========================================' as '';
