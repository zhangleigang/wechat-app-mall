# AI面试助手 - 文档中心

基于微信小程序的AI面试辅助工具，提供岗位分析、简历解读、情绪支持和面试知识库。

## 核心功能

- **AI岗位分析** - 解析JD，生成面试问题预测
- **AI简历解读** - 上传简历，获取优化建议
- **情绪小屋** - 面试压力管理和心理支持
- **知识库** - 200+大数据面试题库（HDFS、Spark、Flink等）
- **会员系统** - 收款码支付，基于OpenID管理

## 技术架构

### 前端
- 微信小程序（原生开发）
- Vant Weapp UI组件库
- 基于OpenID的用户认证

### 后端
- Node.js + Express.js
- MySQL 8.0+
- JWT认证
- PM2进程管理

### 部署
- 服务器：阿里云ECS
- 域名：api.feelnow.cn
- 反向代理：Nginx
- HTTPS：Let's Encrypt

## 快速开始

### 前端开发

```bash
cd miniprogram
npm install
# 在微信开发者工具中打开
```

### 后端开发

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 配置数据库和微信参数
npm start
```

## 相关文档

- [后端服务文档](../server/README.md) - API接口、部署指南
- [小程序文档](../miniprogram/README.md) - 前端开发说明
- [项目主文档](../README.md) - 项目概述

## 外部资源

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vant Weapp组件库](https://vant-contrib.gitee.io/vant-weapp/)
- [Express.js文档](https://expressjs.com/)

---

**版本**: 1.0.0  
**最后更新**: 2024-12-03
