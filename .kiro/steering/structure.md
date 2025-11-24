# 项目结构

## 目录组织

```
wechat-app-mall/
├── pages/              # 页面模块（每个页面4个文件：.js、.json、.wxml、.wxss）
├── components/         # 可复用的自定义组件
├── utils/              # 业务逻辑和服务接口
├── images/             # 静态图片资源
├── miniprogram_npm/    # 编译后的npm依赖
├── knowledge-api/      # 知识库Node.js后端
├── docs/               # 项目文档
├── app.js              # 应用入口和生命周期
├── app.json            # 全局配置
├── app.wxss            # 全局样式
└── config.js           # 应用配置
```

## 核心目录

### `/pages` - 页面模块

按功能区域组织，每个页面包含4个文件：

**AI功能** (`pages/ai/`)
- `job/` - 岗位描述分析
- `resume/` - 简历解析和优化
- `mood/` - 情绪支持和压力管理

**知识库** (`pages/knowledge/`)
- `index.js` - 分类浏览和搜索
- `detail.js` - 问答展示，支持Markdown渲染

**个人中心** (`pages/my/`)
- `index.js` - 个人信息概览
- `info.js` - 个人信息编辑
- `setting.js` - 系统设置
- `feedback.js` - 意见反馈

**登录认证** (`pages/login/`)
- `index.js` - 微信授权登录
- `simple.js` - 简化登录流程

### `/components` - 自定义组件

可复用的业务组件：
- `login/` - 登录弹窗组件
- `bind-mobile/` - 手机号绑定组件
- `payment/` - 支付流程封装
- `fuwuxieyi/` - 服务协议展示
- `goods-pop/` - 商品弹窗（遗留电商功能）

### `/utils` - 工具模块

**核心工具**（单一职责）：
- `ai.js` - AI服务HTTP客户端（对话、上传）
- `auth.js` - 认证流程（登录、登出、token管理）
- `knowledge.js` - 知识库数据结构
- `knowledge-api.js` - 知识库API客户端
- `tools.js` - 通用工具函数（日期格式化、防抖、节流）
- `markdown.js` - Markdown渲染辅助函数
- `simpleAuth.js` - 知识库API简化认证

### `/images` - 静态资源

按用途组织：
- `nav/` - TabBar图标（选中/未选中状态）
- `icon/` - 功能图标
- `home/` - 首页资源
- `order/` - 订单相关图标（遗留）

### `/knowledge-api` - 后端服务

Node.js/Express后端：
- `server.js` - 主服务文件
- `routes/` - API路由处理器
- `middleware/` - 认证中间件
- `utils/` - 后端工具函数
- `data/` - 知识库JSON数据

### `/docs` - 文档

- `technical/ARCHITECTURE.md` - 系统架构文档
- 各种优化和功能文档
- 部署指南

## 文件命名规范

**页面/组件**：主文件使用`index.js`或描述性名称
**工具函数**：小写字母加连字符（如`knowledge-api.js`）
**图片**：描述性名称，按子文件夹组织
**文档**：大写字母加下划线（如`ARCHITECTURE.md`）

## 页面结构模式

每个页面遵循以下结构：

```javascript
Page({
  data: {},              // 页面状态
  onLoad(options) {},    // 初始化
  onShow() {},           // 显示时刷新
  onReady() {},          // 首次渲染完成
  onHide() {},           // 隐藏时保存状态
  onUnload() {},         // 卸载时清理资源
  // 自定义方法
})
```

## 组件结构模式

```javascript
Component({
  properties: {},        // 输入属性
  data: {},             // 内部状态
  methods: {},          // 事件处理器
  lifetimes: {},        // 生命周期钩子
})
```

## 引入模式

```javascript
// 配置
const CONFIG = require('../../config.js')

// 工具函数
const AI = require('../../utils/ai.js')
const AUTH = require('../../utils/auth.js')

// SDK
const WXAPI = require('apifm-wxapi')

// 应用实例
const app = getApp()
```

## 全局组件注册

在`app.json`的`usingComponents`中注册：
- 所有Vant Weapp组件（van-*）
- 自定义业务组件（login、payment等）
- 第三方组件（mp-html）

## 分包

当前未使用，但可用于未来优化：
- `packageCps/` - CPS电商（遗留）
- `packageFx/` - 分销系统（遗留）
- `packageStreamMedia/` - 直播（遗留）

这些已禁用以减小包体积。

## 配置层级

1. `config.js` - 应用级配置（API地址、功能开关）
2. `app.json` - 小程序配置（页面、tabBar、权限）
3. `project.config.json` - 开发工具配置（appid、构建设置）
4. `page.json` - 页面级配置（导航栏、组件）

## 数据流模式

**单向数据流**：
1. 用户交互 → 页面事件处理器
2. 页面 → 工具层（API调用）
3. 工具层 → 后端服务
4. 后端 → 工具层（响应）
5. 工具层 → 页面（处理后的数据）
6. 页面 → setData() → UI更新

## 最佳实践

- **单一职责**：每个文件/模块有明确的单一目的
- **DRY原则**：可复用逻辑放在`/utils`，可复用UI放在`/components`
- **命名规范**：使用清晰的英文或拼音描述性名称
- **注释规范**：函数使用JSDoc风格，复杂逻辑使用行内注释
- **错误处理**：异步函数使用try-catch，提供用户友好的错误提示
- **性能优化**：最小化setData调用次数，使用数据缓存
