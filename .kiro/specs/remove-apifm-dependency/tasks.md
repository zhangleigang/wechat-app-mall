# Implementation Plan

- [x] 1. 创建本地会员管理模块
  - 创建 `utils/memberLocal.js` 文件，实现本地会员状态管理
  - 实现会员套餐配置（月度/季度/年度）
  - 实现会员信息查询、激活、验证等核心方法
  - 实现会员到期时间计算和状态判断逻辑
  - _Requirements: 1.1, 1.4_

- [x] 2. 重构认证模块兼容层
  - 修改 `utils/auth.js`，添加兼容层转发到 `simpleAuth.js`
  - 保留常用方法（checkHasLogined, loginOut）的兼容实现
  - 标记废弃方法（login, authorize）并抛出错误提示
  - 确保现有代码调用不会报错
  - _Requirements: 1.1, 1.2_

- [x] 3. 更新应用入口和配置
  - 修改 `app.js`，移除 apifm-wxapi 的引用
  - 使用 `simpleAuth.js` 实现自动登录逻辑
  - 更新 `config.js`，标记 apifm 相关配置为已废弃
  - 添加收款码支付配置（url, accountName, enabled）
  - _Requirements: 1.1, 1.3_

- [x] 4. 重构会员支付页面
- [x] 4.1 更新支付页面UI和逻辑
  - 修改 `pages/member/payment/index.js`，移除 apifm 订单创建逻辑
  - 实现套餐选择功能
  - 实现收款码展示功能
  - 实现支付确认和会员激活逻辑
  - _Requirements: 1.3_

- [x] 4.2 更新支付页面样式
  - 修改 `pages/member/payment/index.wxml`，设计收款码支付界面
  - 添加套餐选择卡片
  - 添加收款码展示区域
  - 添加支付确认按钮
  - _Requirements: 1.3_

- [x] 4.3 更新支付结果页面
  - 修改 `pages/member/payment-result/index.js`，显示会员激活成功信息
  - 显示会员到期时间和剩余天数
  - 提供返回首页按钮
  - _Requirements: 1.3_

- [x] 5. 更新会员验证逻辑
  - 查找所有使用 `utils/member.js` 的页面
  - 将会员验证逻辑从 apifm 切换到 `memberLocal.js`
  - 更新 AI 功能页面的会员检查（job/resume/mood）
  - 更新个人中心的会员信息显示
  - _Requirements: 1.4_

- [x] 6. 更新会员相关页面
- [x] 6.1 更新会员套餐页面
  - 修改 `pages/member/packages/index.js`，使用本地套餐配置
  - 移除 apifm 会员卡接口调用
  - 更新套餐展示逻辑
  - _Requirements: 1.3_

- [x] 6.2 更新会员权益页面
  - 修改 `pages/member/benefits/index.js`，使用本地会员信息
  - 显示会员状态和到期时间
  - 提供续费入口
  - _Requirements: 1.4_

- [x] 6.3 更新个人中心页面
  - 修改 `pages/my/index.js`，使用 `memberLocal.js` 获取会员信息
  - 显示会员状态、到期时间、剩余天数
  - 移除 apifm 相关调用
  - _Requirements: 1.4_

- [x] 7. 清理未使用的代码和依赖
  - 从 `package.json` 中移除 `apifm-wxapi` 依赖
  - 检查并清理所有 apifm 相关的工具函数
  - 清理未使用的支付相关组件（如果有）
  - 更新 `app.json`，移除已删除页面的路由配置（如果有）
  - _Requirements: 1.5_

- [x] 8. 验证和测试
- [x] 8.1 测试认证流程
  - 测试首次启动自动登录
  - 测试 Token 过期后的重新登录
  - 测试网络断开时的本地降级
  - _Requirements: 1.2_

- [x] 8.2 测试会员购买流程
  - 测试套餐选择功能
  - 测试收款码展示
  - 测试支付确认和会员激活
  - 测试会员信息显示
  - _Requirements: 1.3_

- [x] 8.3 测试会员验证
  - 测试有效会员访问 AI 功能
  - 测试无效会员跳转购买页面
  - 测试会员过期提示
  - 测试会员状态刷新
  - _Requirements: 1.4_

- [x] 8.4 测试边界情况
  - 测试删除本地存储后的行为
  - 测试会员到期边界时间
  - 测试并发访问情况
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 9. 最终验证
  - 在微信开发者工具中完整测试所有功能
  - 验证不再出现"请使用自己的专属域名访问"错误
  - 验证小程序可以正常编译和运行
  - 检查控制台无报错信息
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
