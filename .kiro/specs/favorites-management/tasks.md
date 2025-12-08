# Implementation Plan - 我的收藏功能

## 概述

本实现计划将"我的收藏"功能分解为可执行的开发任务。任务按照从后端到前端、从核心功能到辅助功能的顺序组织，确保每个步骤都可以独立测试和验证。

## 任务列表

- [x] 1. 数据库设计和初始化
  - 创建 favorites、tags、favorite_tags 三张表
  - 添加必要的索引和外键约束
  - 编写数据库初始化脚本
  - _Requirements: 11.2, 12.2_

- [x] 2. 后端API基础架构
- [x] 2.1 创建路由和控制器文件
  - 创建 `server/src/routes/favorites.js`
  - 创建 `server/src/controllers/favoritesController.js`
  - 在 `server/server.js` 中注册路由
  - _Requirements: 11.1_

- [x] 2.2 实现收藏CRUD接口
  - 实现 `createFavorite()` - 创建收藏
  - 实现 `getFavorites()` - 获取收藏列表（分页、标签筛选）
  - 实现 `getFavoriteDetail()` - 获取收藏详情
  - 实现 `updateFavorite()` - 更新收藏
  - 实现 `deleteFavorite()` - 删除收藏
  - _Requirements: 11.1, 11.3, 11.4, 11.5_

- [ ]* 2.3 编写收藏CRUD的属性测试
  - **Property 1: Favorite creation persists all required data**
  - **Validates: Requirements 1.2, 2.2, 3.5, 11.1**

- [ ]* 2.4 编写数据隔离的属性测试
  - **Property 3: Data isolation by OpenID**
  - **Validates: Requirements 1.5, 5.5, 11.4**

- [x] 3. 标签管理功能
- [x] 3.1 实现标签相关接口
  - 实现 `getTags()` - 获取标签列表（带问题数量）
  - 实现 `addTag()` - 为收藏添加标签
  - 实现 `removeTag()` - 移除收藏的标签
  - _Requirements: 7.1, 7.3, 7.4_

- [ ]* 3.2 编写标签验证的属性测试
  - **Property 7: Tag validation**
  - **Validates: Requirements 7.2**

- [ ]* 3.3 编写标签关联完整性的属性测试
  - **Property 11: Tag association integrity**
  - **Validates: Requirements 7.3, 7.4**

- [x] 3.4 实现自动标签功能
  - 简历来源自动添加"简历分析"标签
  - _Requirements: 2.4_

- [ ]* 3.5 编写自动标签的属性测试
  - **Property 15: Automatic tagging for resume source**
  - **Validates: Requirements 2.4**

- [x] 4. AI答案生成（流式输出）
- [x] 4.1 实现DeepSeek API集成
  - 实现 `generateAnswer()` - 调用DeepSeek API
  - 配置流式请求参数
  - _Requirements: 3.4, 12.1_

- [x] 4.2 实现SSE流式输出
  - 实现Server-Sent Events响应
  - 处理流式数据转发
  - 实现完成信号发送
  - _Requirements: 4.1, 4.2, 4.4, 12.2, 12.4_

- [ ]* 4.3 编写流式完整性的属性测试
  - **Property 9: Streaming completeness**
  - **Validates: Requirements 4.2, 4.4, 12.2, 12.4**

- [x] 4.4 实现流式错误处理
  - 处理连接中断
  - 实现错误事件发送
  - 支持重连机制
  - _Requirements: 4.5, 12.3, 12.5_

- [ ]* 4.5 编写流式错误恢复的属性测试
  - **Property 16: Streaming error recovery**
  - **Validates: Requirements 4.5, 12.5**

- [ ] 5. 会员限制功能
- [x] 5.1 实现会员配额检查
  - 集成现有会员API
  - 实现收藏数量统计
  - 实现配额验证逻辑
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ]* 5.2 编写会员配额的属性测试
  - **Property 10: Member quota enforcement**
  - **Validates: Requirements 13.1, 13.2, 13.3**

- [ ] 6. Checkpoint - 后端功能验证
  - 确保所有后端API测试通过
  - 使用Postman或curl测试所有接口
  - 验证数据库数据正确性
  - 询问用户是否有问题

- [x] 7. 前端API客户端
- [x] 7.1 创建favorites-api.js
  - 创建 `miniprogram/utils/favorites-api.js`
  - 实现HTTP请求封装
  - 实现错误处理和重试逻辑
  - _Requirements: 1.2, 2.2, 3.5_

- [x] 7.2 实现收藏相关API方法
  - `createFavorite()` - 创建收藏
  - `getFavorites()` - 获取收藏列表
  - `getFavoriteDetail()` - 获取详情
  - `updateFavorite()` - 更新收藏
  - `deleteFavorite()` - 删除收藏
  - _Requirements: 1.2, 5.1, 6.1, 10.1, 9.3_

- [x] 7.3 实现标签相关API方法
  - `getTags()` - 获取标签列表
  - `addTag()` - 添加标签
  - `removeTag()` - 移除标签
  - _Requirements: 7.3, 7.4, 8.1_

- [x] 7.4 实现SSE流式客户端
  - 实现SSE连接管理
  - 实现流式数据接收
  - 实现 `generateAnswer()` 方法
  - _Requirements: 4.1, 4.2_

- [x] 8. 收藏按钮组件
- [x] 8.1 创建favorite-button组件
  - 创建 `miniprogram/components/favorite-button/`
  - 实现组件结构（.js, .json, .wxml, .wxss）
  - _Requirements: 1.1, 2.1_

- [x] 8.2 实现收藏状态管理
  - 实现收藏/取消收藏逻辑
  - 实现状态切换动画
  - 实现视觉反馈
  - _Requirements: 1.3, 1.4, 2.5_

- [ ]* 8.3 编写收藏切换的属性测试
  - **Property 2: Favorite toggle is idempotent**
  - **Validates: Requirements 1.4, 9.3**

- [x] 8.4 集成到知识库详情页
  - 在 `pages/knowledge/detail.js` 中集成收藏按钮
  - 实现收藏状态检查
  - 实现收藏操作
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8.5 集成到简历解读页
  - 在 `pages/ai/resume/index.js` 中为每个问答添加收藏按钮
  - 实现收藏操作
  - 自动添加"简历分析"标签
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9. 收藏列表页
- [x] 9.1 创建收藏列表页面
  - 创建 `miniprogram/pages/favorites/index/`
  - 实现页面结构（.js, .json, .wxml, .wxss）
  - 在 `app.json` 中注册页面
  - _Requirements: 5.1_

- [x] 9.2 实现列表展示功能
  - 实现收藏列表加载
  - 实现列表项UI（问题预览、标签、时间、来源）
  - 实现空状态展示
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 9.3 编写列表排序的属性测试
  - **Property 4: List ordering consistency**
  - **Validates: Requirements 5.1**

- [x] 9.4 实现分页加载
  - 实现滚动到底部检测
  - 实现分页数据加载
  - 实现加载状态显示
  - _Requirements: 5.4_

- [ ]* 9.5 编写分页正确性的属性测试
  - **Property 5: Pagination correctness**
  - **Validates: Requirements 5.4, 11.3**

- [x] 9.6 实现下拉刷新
  - 实现下拉刷新逻辑
  - 清除缓存并重新加载
  - _Requirements: 5.1_

- [x] 10. 标签筛选功能
- [x] 10.1 实现标签筛选区UI
  - 实现标签列表展示（带问题数量）
  - 实现标签选择交互
  - 实现筛选状态高亮
  - _Requirements: 8.1, 8.3_

- [x] 10.2 实现标签筛选逻辑
  - 实现按标签过滤列表
  - 实现清除筛选
  - 实现空结果提示
  - _Requirements: 8.2, 8.4, 8.5_

- [ ]* 10.3 编写标签筛选的属性测试
  - **Property 6: Tag filtering accuracy**
  - **Validates: Requirements 8.2, 8.4**

- [x] 11. 收藏详情页
- [x] 11.1 创建收藏详情页面
  - 创建 `miniprogram/pages/favorites/detail/`
  - 实现页面结构（.js, .json, .wxml, .wxss）
  - _Requirements: 6.1_

- [x] 11.2 实现详情展示
  - 实现问题和答案展示
  - 集成towxml渲染Markdown
  - 显示标签、来源、时间等信息
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 11.3 编写Markdown渲染的属性测试
  - **Property 12: Markdown rendering consistency**
  - **Validates: Requirements 6.2, 14.1, 14.2, 14.3, 14.4, 14.5**

- [x] 11.4 实现标签管理功能
  - 实现标签展示（最多5个+更多提示）
  - 实现添加标签
  - 实现删除标签
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11.5 实现删除功能
  - 实现删除按钮
  - 实现删除确认对话框
  - 实现撤销功能（5秒）
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 11.6 编写删除确认的属性测试
  - **Property 13: Delete confirmation safety**
  - **Validates: Requirements 9.2**

- [x] 11.7 实现分享功能
  - 实现分享按钮
  - 配置分享内容
  - _Requirements: 6.5_

- [ ] 12. 添加自定义问题功能
- [x] 12.1 创建添加问题弹窗组件
  - 创建 `miniprogram/components/add-question-modal/`
  - 实现弹窗UI结构
  - _Requirements: 3.1, 3.2_

- [x] 12.2 实现问题输入和验证
  - 实现问题输入框
  - 实现输入验证（最少5字符）
  - 显示验证错误提示
  - _Requirements: 3.3_

- [ ]* 12.3 编写问题验证的属性测试
  - **Property 8: Question validation**
  - **Validates: Requirements 3.3, 10.3**

- [x] 12.3 实现AI答案生成UI
  - 实现生成按钮
  - 实现流式答案显示
  - 实现进度指示器
  - _Requirements: 3.4, 4.1, 4.2, 4.3_

- [x] 12.4 实现标签添加功能
  - 实现标签输入
  - 实现标签列表显示
  - 实现标签删除
  - _Requirements: 3.5, 7.2_

- [x] 12.5 实现保存到收藏
  - 实现保存按钮
  - 调用创建收藏API
  - 显示成功提示
  - _Requirements: 3.5_

- [x] 12.6 集成到收藏列表页
  - 在列表页添加"添加自定义问题"按钮
  - 实现弹窗显示/隐藏
  - _Requirements: 3.1_

- [x] 13. 编辑自定义问题功能
- [x] 13.1 实现编辑按钮显示
  - 仅对自定义问题显示编辑按钮
  - _Requirements: 10.1_

- [x] 13.2 实现编辑功能
  - 实现编辑模式切换
  - 实现问题文本编辑
  - 实现保存编辑
  - _Requirements: 10.2, 10.3, 10.4_

- [ ]* 13.3 编写编辑保留的属性测试
  - **Property 14: Edit preservation**
  - **Validates: Requirements 10.5**

- [x] 14. UI优化和交互完善
- [x] 14.1 实现实时UI更新
  - 确保所有操作后UI立即更新
  - 无需刷新页面
  - _Requirements: 1.3, 2.5, 7.3, 7.4_

- [ ]* 14.2 编写实时更新的属性测试
  - **Property 17: Real-time UI updates**
  - **Validates: Requirements 1.3, 2.5, 7.3, 7.4**

- [x] 14.3 实现加载状态
  - 添加骨架屏
  - 添加加载动画
  - 优化加载体验
  - _Requirements: 4.3_

- [x] 14.4 实现错误提示优化
  - 统一错误提示样式
  - 提供友好的错误信息
  - 添加重试选项
  - _Requirements: 4.5_

- [x] 14.5 实现触觉反馈
  - 添加按钮点击震动
  - 添加操作成功震动
  - _Requirements: 1.3, 2.5_

- [x] 15. 会员限制UI集成
- [x] 15.1 实现配额检查
  - 在创建收藏前检查配额
  - 显示当前收藏数量
  - _Requirements: 13.1, 13.4_

- [x] 15.2 实现升级提示
  - 达到限制时显示升级弹窗
  - 提供跳转到套餐页面
  - _Requirements: 13.2_

- [x] 15.3 实现会员状态实时更新
  - 升级后立即解除限制
  - 无需重启应用
  - _Requirements: 13.5_

- [x] 16. 在app.json中配置导航
- [x] 16.1 添加收藏页面到tabBar或导航
  - 配置页面路由
  - 配置导航图标和文字
  - _Requirements: 5.1_

- [ ] 17. Checkpoint - 功能完整性测试
  - 测试从知识库收藏问题
  - 测试从简历解读收藏问答
  - 测试添加自定义问题
  - 测试标签筛选
  - 测试编辑和删除
  - 测试会员限制
  - 确保所有测试通过，询问用户是否有问题

- [x] 18. 性能优化
- [x] 18.1 优化数据库查询
  - 验证索引有效性
  - 优化复杂查询
  - _Requirements: 11.2_

- [x] 18.2 优化前端性能
  - 实现列表虚拟滚动（如果需要）
  - 优化图片加载
  - 减少不必要的setData调用
  - _Requirements: 5.4_

- [x] 18.3 实现缓存策略
  - 缓存标签列表
  - 缓存收藏列表（短时间）
  - _Requirements: 8.1_

- [x] 19. 文档和部署准备
- [x] 19.1 编写API文档
  - 创建 `server/docs/FAVORITES_API.md`
  - 记录所有API接口
  - 提供请求/响应示例
  - _Requirements: 11.1_

- [x] 19.2 更新数据库部署脚本
  - 将favorites表添加到 `server/database/init.sql`
  - 测试初始化脚本
  - _Requirements: 11.2_

- [x] 19.3 更新README文档
  - 在项目README中添加收藏功能说明
  - 更新功能列表
  - _Requirements: All_

- [ ] 20. Final Checkpoint - 完整测试和部署
  - 运行所有属性测试
  - 进行完整的端到端测试
  - 测试会员和非会员场景
  - 测试各种边界情况
  - 确认所有功能正常，询问用户是否可以部署
