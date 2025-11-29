-- 创建数据库
CREATE DATABASE IF NOT EXISTS interview_helper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE interview_helper;

-- 1. 用户会员表
CREATE TABLE IF NOT EXISTS user_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
    nick_name VARCHAR(100) COMMENT '昵称',
    expire_date DATETIME COMMENT '会员过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '首次开通时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    INDEX idx_openid (openid),
    INDEX idx_expire_date (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会员表';

-- 2. 订单记录表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(100) UNIQUE NOT NULL COMMENT '订单号',
    openid VARCHAR(100) NOT NULL COMMENT '用户openid',
    nick_name VARCHAR(100) COMMENT '用户昵称',
    package_id VARCHAR(50) NOT NULL COMMENT '套餐ID',
    package_name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    days INT NOT NULL COMMENT '购买天数',
    status TINYINT DEFAULT 0 COMMENT '状态：0待核实 1已核实 -1异常',
    device_info VARCHAR(500) COMMENT '设备信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    verified_at DATETIME COMMENT '核实时间',
    remark VARCHAR(500) COMMENT '备注',
    INDEX idx_order_number (order_number),
    INDEX idx_openid (openid),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单记录表';

-- 插入测试数据（可选）
-- INSERT INTO user_members (openid, nick_name, expire_date) VALUES 
-- ('test_openid_001', '测试用户', DATE_ADD(NOW(), INTERVAL 30 DAY));
