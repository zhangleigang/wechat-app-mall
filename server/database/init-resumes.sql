-- 简历管理表初始化脚本
-- 用于存储用户上传的简历文件信息和解析后的文本内容

USE ai_interview_helper;

-- 设置字符集和排序规则
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_general_ci;

-- 创建简历表
CREATE TABLE IF NOT EXISTS resumes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '简历ID（主键）',
    openid VARCHAR(100) NOT NULL COMMENT '微信OpenID（用户标识）',
    filename VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径（相对路径）',
    parsed_text TEXT COMMENT '解析后的简历文本内容',
    file_size INT COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型（pdf/docx/md等）',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引优化查询性能
    INDEX idx_openid (openid) COMMENT '按用户查询索引',
    INDEX idx_upload_time (upload_time) COMMENT '按上传时间查询索引',
    INDEX idx_created_at (created_at) COMMENT '按创建时间查询索引',
    
    -- 外键约束（确保用户存在）
    CONSTRAINT fk_resumes_openid FOREIGN KEY (openid) REFERENCES members(openid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='简历文件管理表';

-- 创建有用的视图

-- 用户简历统计视图
CREATE OR REPLACE VIEW resume_stats AS
SELECT 
    openid,
    COUNT(*) as resume_count,
    MAX(upload_time) as last_upload_time,
    SUM(file_size) as total_file_size
FROM resumes
GROUP BY openid;

-- 最近上传的简历视图
CREATE OR REPLACE VIEW recent_resumes AS
SELECT 
    r.id,
    r.openid,
    r.filename,
    r.file_type,
    r.file_size,
    r.upload_time,
    m.nick_name,
    m.avatar_url
FROM resumes r
LEFT JOIN members m ON r.openid = m.openid
ORDER BY r.upload_time DESC
LIMIT 100;

-- 初始化完成提示
SELECT 'Resume table initialization completed successfully!' as status;
SELECT 'Table created: resumes' as table_info;
SELECT 'Views created: resume_stats, recent_resumes' as views_info;
