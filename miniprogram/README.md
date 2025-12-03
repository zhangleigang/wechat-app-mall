# AI面试助手 - 小程序前端

基于微信小程序的AI面试辅助工具，提供岗位分析、简历解读、情绪支持和面试知识库等功能。

## 快速开始

### 环境要求
- 微信开发者工具（最新版）
- Node.js 14+

### 安装与运行

```bash
# 安装依赖
npm install

# 在微信开发者工具中：工具 → 构建 npm
```

## 目录结构

```
miniprogram/
├── pages/              # 页面
│   ├── ai/            # AI功能（岗位分析、简历解读、情绪支持）
│   ├── knowledge/     # 知识库（面试题库）
│   ├── member/        # 会员中心（支付、激活）
│   └── my/            # 个人中心
├── components/         # 自定义组件
├── utils/             # 工具模块
│   ├── simpleAuth.js  # 认证（基于OpenID）
│   ├── member-api.js  # 会员API
│   ├── knowledge-api.js # 知识库API
│   ├── ai.js          # AI服务
│   └── tools.js       # 通用工具
├── images/            # 静态资源
├── app.js             # 应用入口
├── app.json           # 全局配置
└── config.js          # 配置文件
```

## 配置说明

编辑 `config.js` 配置后端服务地址：

```javascript
module.exports = {
  // 统一后端API地址
  apiBaseUrl: 'https://api.feelnow.cn/api',
  
  // AI服务地址
  ai_api_base: 'https://your-ai-backend.example.com',
  
  // 收款码配置
  paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.png',
    accountName: '收款人姓名',
    enabled: true
  }
}
```

## 核心功能

- **AI岗位分析**：解析JD，生成面试问题预测
- **AI简历解读**：上传简历，获取优化建议
- **情绪小屋**：面试压力管理和心理支持
- **知识库**：大数据技术面试题库（HDFS、Spark、Flink等）
- **会员系统**：收款码支付，基于OpenID的会员管理

## 开发

1. 打开微信开发者工具
2. 导入项目（选择 `miniprogram` 目录）
3. 配置 AppID
4. 开始开发

## 发布

1. 微信开发者工具 → 上传
2. 填写版本号和更新说明
3. 微信公众平台 → 提交审核

## 相关文档

- [后端服务文档](../server/README.md)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vant Weapp 组件库](https://vant-contrib.gitee.io/vant-weapp/)
