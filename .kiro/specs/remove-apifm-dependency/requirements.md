# Requirements Document

## Introduction

本需求文档描述了将小程序从 API 工厂（apifm）迁移到自有后端服务的功能改造。目标是移除对第三方 SaaS 平台的依赖，使用自己的认证和支付系统，解决"请使用自己的专属域名访问"错误。

## Glossary

- **System**: 指 AI 面试助手小程序
- **apifm**: API 工厂，第三方 SaaS 后端服务平台
- **Knowledge API**: 自有的知识库后端服务（已部署在 api.feelnow.cn:8443）
- **User**: 小程序的使用者
- **Payment Module**: 支付模块，包含会员购买和订单管理
- **Auth Module**: 认证模块，包含登录和会员验证

## Requirements

### Requirement 1

**User Story:** 作为开发者，我希望移除对 apifm 的依赖，以便使用自己的后端服务并避免域名错误

#### Acceptance Criteria

1. WHEN System 启动时，THE System SHALL NOT 调用任何 apifm 相关的 API 接口
2. THE System SHALL 使用 Knowledge API 提供的认证服务替代 apifm 的用户认证
3. THE System SHALL 移除所有 apifm-wxapi SDK 的引用和调用
4. THE System SHALL 在配置文件中保留 subDomain 和 merchantId 字段但标记为已弃用

### Requirement 2

**User Story:** 作为用户，我希望能够通过简化的认证流程登录，以便快速访问小程序功能

#### Acceptance Criteria

1. WHEN User 首次打开小程序时，THE System SHALL 自动使用微信授权完成登录
2. WHEN 登录成功时，THE System SHALL 将认证 token 存储在本地
3. THE System SHALL 在每次 API 请求时自动附加认证 token
4. IF 认证 token 过期，THEN THE System SHALL 自动重新登录

### Requirement 3

**User Story:** 作为用户，我希望能够通过收款码完成会员购买，以便获得小程序的完整功能

#### Acceptance Criteria

1. WHEN User 点击购买会员时，THE System SHALL 显示收款码支付页面
2. THE System SHALL 在支付页面显示收款账户名称和金额
3. WHEN User 完成支付后，THE System SHALL 提供手动确认按钮
4. THE System SHALL 在用户确认后更新会员状态

### Requirement 4

**User Story:** 作为开发者，我希望保持现有的会员验证逻辑，以便在移除 apifm 后功能仍然正常

#### Acceptance Criteria

1. THE System SHALL 在本地存储中维护会员状态信息
2. WHEN 检查会员状态时，THE System SHALL 读取本地存储的会员信息
3. THE System SHALL 提供会员状态的手动刷新功能
4. WHERE 需要会员权限的功能，THE System SHALL 验证会员状态后才允许访问

### Requirement 5

**User Story:** 作为开发者，我希望清理所有未使用的代码和组件，以便减小小程序包体积

#### Acceptance Criteria

1. THE System SHALL 移除所有与 apifm 相关的工具函数
2. THE System SHALL 移除未使用的支付组件和页面
3. THE System SHALL 更新 app.json 移除已删除页面的路由配置
4. THE System SHALL 确保移除代码后小程序仍能正常编译和运行
