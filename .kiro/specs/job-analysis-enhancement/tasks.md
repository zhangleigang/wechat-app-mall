# 岗位分析页面优化实现任务

## 任务概述

本任务列表将岗位分析页面的优化分解为可执行的代码实现步骤。每个任务都是独立的、可测试的，并且按照依赖关系排序。

---

## 实现任务

- [x] 1. 更新 WXML 结构 - 创建现代化页面布局
  - 替换现有的简单布局为新的组件化结构
  - 添加渐变头部组件，包含标题和描述文字
  - 添加快捷问题区域，使用 wx:if 条件渲染（当 messages.length === 0 时显示）
  - 创建快捷问题网格布局，包含4个预设问题卡片
  - 重构对话容器，使用增强型 scroll-view
  - 为用户消息创建消息气泡结构：头像 + 气泡内容 + 时间
  - 为AI消息创建消息气泡结构：头像 + 气泡内容 + 时间 + 操作按钮
  - 添加打字指示器组件，使用 wx:if 条件渲染（当 sending 为 true 时显示）
  - 添加功能按钮栏（清空、导出），使用 wx:if 条件渲染（当 messages.length > 0 时显示）
  - 重构输入区域：输入框包装器 + 字数统计 + 圆形发送按钮
  - 为所有交互元素添加 bindtap 事件绑定
  - _Requirements: 1.1, 2.2, 3.1, 3.2, 4.1, 5.1, 6.1, 7.1_

- [x] 2. 实现 WXSS 样式 - 应用设计系统
  - [x] 2.1 实现页面容器和头部样式
    - 创建 .page-container 样式，设置 flex 布局和底部安全区域
    - 实现 .gradient-header 样式，使用 --primary-gradient 渐变背景
    - 设置头部文字样式，使用设计系统的文字类和颜色变量
    - _Requirements: 1.1, 1.2, 1.3, 12.1, 12.2_

  - [x] 2.2 实现快捷问题区域样式
    - 创建 .quick-questions-section 样式，设置背景和边框
    - 实现 .quick-grid 网格布局，2列自适应
    - 创建 .quick-item 卡片样式，包含背景、边框、圆角
    - 添加 .quick-item:active 点击动画效果（缩放 + 边框变色）
    - 使用设计系统的间距、圆角、颜色变量
    - _Requirements: 2.1, 2.4, 2.5, 12.2, 12.4_

  - [x] 2.3 实现对话容器和消息气泡样式
    - 创建 .chat-container 样式，设置 flex: 1 和背景色
    - 实现 .message-item 样式，添加 slideUp 动画
    - 创建 .user-message 和 .ai-message 布局样式（flex 对齐）
    - 实现 .message-avatar 圆形头像样式，使用渐变背景
    - 创建 .message-bubble 气泡样式，包含圆角、内边距、阴影
    - 实现用户气泡样式：紫色渐变背景 + 白色文字 + 右侧尾巴
    - 实现AI气泡样式：白色背景 + 黑色文字 + 边框 + 左侧尾巴
    - 使用 ::after 伪元素创建气泡尾巴效果
    - 设置 .message-text 和 .message-time 文字样式
    - 使用设计系统的所有相关变量
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 12.1, 12.2, 12.3_

  - [x] 2.4 实现消息操作按钮样式
    - 创建 .message-actions 布局样式（flex 横向排列）
    - 实现 .action-btn 按钮样式，包含图标和文字
    - 添加 .action-btn:active 点击动画效果
    - 使用设计系统的颜色和间距变量
    - _Requirements: 5.2, 5.5, 12.2, 12.4_

  - [x] 2.5 实现打字指示器样式和动画
    - 创建 .typing-bubble 特殊气泡样式
    - 实现 .typing-indicator 布局样式
    - 创建 .typing-dots 和 .dot 样式
    - 实现 @keyframes typing 动画（跳动效果）
    - 为3个圆点设置不同的 animation-delay
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 12.4_

  - [x] 2.6 实现输入区域样式
    - 创建 .input-section 容器样式，设置背景和边框
    - 实现 .function-bar 功能按钮栏样式
    - 创建 .function-btn 按钮样式，添加点击动画
    - 实现 .input-container 布局样式（flex 横向）
    - 创建 .input-wrapper 包装器样式，包含边框和圆角
    - 添加 .input-wrapper:focus-within 聚焦高亮效果
    - 实现 .message-input 输入框样式
    - 创建 .char-count 字数统计样式
    - 实现 .send-button 圆形发送按钮样式
    - 添加 .send-button.active 和 .send-button.disabled 状态样式
    - 创建 @keyframes spin 加载旋转动画
    - 使用设计系统的所有相关变量
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 7.1, 12.1, 12.2, 12.3, 12.4_

  - [x] 2.7 实现响应式布局和动画
    - 创建 @keyframes slideUp 消息滑入动画
    - 确保所有动画使用 transform 和 opacity 以优化性能
    - 设置消息气泡最大宽度为 85%
    - 添加底部安全区域适配（env(safe-area-inset-bottom)）
    - 验证所有样式使用设计系统变量，无硬编码值
    - _Requirements: 3.5, 10.2, 10.5, 11.1, 11.4, 12.1, 12.5_

- [x] 3. 实现 JS 数据和方法 - 添加核心功能
  - [x] 3.1 更新 data 数据结构
    - 保留现有的 messages、inputVal、sending 字段
    - 添加 scrollTop 字段用于滚动控制
    - 添加 quickQuestions 数组，包含4个预设问题
    - 确保 messages 数组结构包含 role、content、time、timestamp 字段
    - _Requirements: 2.1, 8.1, 9.1_

  - [x] 3.2 实现快捷问题功能
    - 创建 selectQuickQuestion 方法，接收点击事件
    - 从 dataset 中获取问题内容
    - 设置 inputVal 为选中的问题
    - 使用 setTimeout 延迟100ms后自动调用 send 方法
    - _Requirements: 2.3, 2.5_

  - [x] 3.3 优化 send 方法
    - 在发送前添加触觉反馈：wx.vibrateShort({ type: 'light' })
    - 在创建用户消息时添加 time 字段，调用 formatTime 方法
    - 在创建AI消息时添加 time 字段，调用 formatTime 方法
    - 在收到AI回复后调用 saveConversation 方法保存对话
    - 保持现有的登录检查、输入验证、错误处理逻辑
    - _Requirements: 8.1, 9.1, 10.1_

  - [x] 3.4 实现消息操作方法
    - 创建 copyMessage 方法，接收消息内容参数
    - 使用 wx.setClipboardData 复制内容到剪贴板
    - 显示成功 Toast: "已复制到剪贴板"
    - 创建 likeMessage 方法，接收消息索引参数
    - 显示感谢 Toast: "感谢您的反馈"
    - _Requirements: 5.3, 5.4_

  - [x] 3.5 实现对话管理方法
    - 创建 clearChat 方法
    - 使用 wx.showModal 显示确认对话框
    - 确认后清空 messages 数组
    - 使用 wx.removeStorageSync 删除本地存储
    - 显示成功 Toast: "已清空对话"
    - 创建 exportChat 方法
    - 检查 messages.length，为空时显示提示
    - 格式化对话记录为文本：包含角色、时间、内容
    - 使用 wx.setClipboardData 复制到剪贴板
    - 显示成功 Toast: "对话记录已复制"
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 3.6 实现时间格式化方法
    - 创建 formatTime 方法，接收 Date 对象参数
    - 计算当前时间与消息时间的差值
    - 小于1分钟返回 "刚刚"
    - 小于1小时返回 "X分钟前"
    - 今天返回 "HH:MM" 格式
    - 历史日期返回 "MM-DD HH:MM" 格式
    - 使用 toLocaleTimeString 和 toLocaleDateString 方法
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 3.7 实现对话历史保存和加载
    - 创建 saveConversation 方法
    - 使用 wx.setStorageSync 保存 messages 和 updateTime
    - 存储键名为 'job_conversation'
    - 添加 try-catch 错误处理，静默失败
    - 创建 loadConversation 方法
    - 使用 wx.getStorageSync 读取对话数据
    - 检查 updateTime 是否在24小时内
    - 如果有效，设置 messages 并滚动到底部
    - 在 onLoad 生命周期中调用 loadConversation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.8 实现滚动控制方法
    - 创建 scrollToBottom 方法
    - 使用 wx.createSelectorQuery 查询消息容器高度
    - 计算 scrollTop 值
    - 使用 setData 更新 scrollTop，触发滚动
    - 在发送消息和收到回复后调用此方法
    - _Requirements: 10.5, 11.1_

  - [x] 3.9 更新页面生命周期和分享
    - 在 onLoad 中调用 loadConversation 方法
    - 保持现有的 setNavigationBarTitle 调用
    - 更新 onShareAppMessage 返回对象
    - 设置 title 为 "岗位分析 - AI智能分析岗位需求"
    - 设置 path 为 '/pages/ai/job/index'
    - _Requirements: 8.2_

- [x] 4. 测试和验证 - 确保功能正常
  - [x] 4.1 功能测试
    - 测试快捷问题点击和自动发送
    - 测试消息发送和接收流程
    - 测试消息复制功能
    - 测试消息点赞功能
    - 测试清空对话功能（包含确认对话框）
    - 测试导出对话功能
    - 测试对话历史保存和加载
    - 测试输入框字数统计显示
    - 测试发送按钮状态切换
    - _Requirements: 2.3, 5.3, 5.4, 7.3, 7.4, 7.5, 8.1, 8.2, 6.3, 6.6_

  - [x] 4.2 界面测试
    - 验证渐变头部显示正确
    - 验证快捷问题区域在首次进入时显示
    - 验证用户消息气泡样式（紫色渐变、右对齐、头像）
    - 验证AI消息气泡样式（白色、左对齐、头像、操作按钮）
    - 验证打字指示器动画效果
    - 验证消息时间格式化正确
    - 验证输入框聚焦高亮效果
    - 验证发送按钮图标和状态
    - 验证功能按钮栏显示条件
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.2, 9.2, 9.3, 9.4, 9.5, 6.2, 6.7, 7.1_

  - [x] 4.3 交互测试
    - 测试触觉反馈（发送消息时震动）
    - 测试按钮点击动画效果
    - 测试消息滑入动画
    - 测试滚动流畅度
    - 测试输入响应速度
    - 测试快捷问题点击动画
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [x] 4.4 兼容性测试
    - 在 iPhone 设备上测试
    - 在 Android 设备上测试
    - 测试不同屏幕尺寸
    - 测试底部安全区域适配
    - 测试横竖屏切换
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 4.5 性能和错误处理测试
    - 测试长对话列表的滚动性能
    - 测试动画帧率
    - 测试网络错误处理
    - 测试登录状态检查
    - 测试输入验证
    - 测试存储错误处理
    - 使用 getDiagnostics 检查代码错误
    - _Requirements: 10.5, 11.1_

---

## 实现说明

### 任务执行顺序

1. **任务1**: 更新 WXML 结构 - 建立页面骨架
2. **任务2**: 实现 WXSS 样式 - 应用视觉设计（包含7个子任务）
3. **任务3**: 实现 JS 功能 - 添加交互逻辑（包含9个子任务）
4. **任务4**: 测试和验证 - 确保质量（包含5个子任务）

### 设计系统使用

所有样式必须使用 `app.wxss` 中定义的 CSS 变量：
- 颜色: `--primary-color`, `--primary-gradient`, `--text-white`, `--bg-card` 等
- 间距: `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`
- 圆角: `--radius-sm`, `--radius-lg`, `--radius-xl`, `--radius-circle`
- 阴影: `--shadow-sm`, `--shadow-md`
- 字号: `--font-xs`, `--font-sm`, `--font-md`, `--font-lg`, `--font-2xl`
- 动画: `--transition-fast`, `--transition-base`

### 代码质量要求

- 清晰的代码结构和注释
- 完善的错误处理
- 性能优化（使用 transform 和 opacity 做动画）
- 响应式布局
- 无硬编码样式值

### 测试重点

- 所有交互功能正常
- 视觉效果符合设计
- 动画流畅不卡顿
- 多设备兼容
- 错误处理完善
