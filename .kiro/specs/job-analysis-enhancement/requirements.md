# 岗位分析页面优化需求文档

## Introduction

本文档定义了AI面试助手小程序中岗位分析页面的优化需求。岗位分析是核心AI功能之一，通过现代化的对话界面、流畅的交互体验和丰富的功能支持，帮助用户智能分析岗位需求，提供技能匹配建议和面试准备指导。

**项目背景**：
- 基于微信小程序平台开发
- 采用分层架构设计（应用层、页面层、组件层、工具层、配置层）
- 集成自定义AI后端服务和apifm业务服务
- 使用Vant Weapp UI组件库和统一设计系统

## Glossary

- **Job Analysis Page**: 岗位分析页面，用户与AI对话分析岗位需求的页面
- **Chat Interface**: 对话界面，展示用户和AI消息的区域
- **Message Bubble**: 消息气泡，单条消息的展示容器
- **Quick Questions**: 快捷问题，预设的常用问题选项，帮助用户快速开始对话
- **Typing Indicator**: 打字指示器，显示AI正在回复的动画效果
- **Design System**: 设计系统，全局统一的样式规范（定义在app.wxss中）
- **Message Actions**: 消息操作，对AI消息进行复制、点赞等操作的功能
- **Conversation History**: 对话历史，保存在本地存储的历史对话记录
- **Session Management**: 会话管理，包括会话ID、消息列表、更新时间的管理
- **AI Service**: AI服务，封装在utils/ai.js中的AI接口调用模块
- **Auth Module**: 认证模块，封装在utils/auth.js中的用户认证功能

## Requirements

### Requirement 1: 现代化页面头部

**User Story:** 作为用户，我希望看到具有品牌感的页面头部，以便获得专业的第一印象并快速了解功能定位

#### Acceptance Criteria

1. WHEN 用户进入岗位分析页面，THE Job Analysis Page SHALL 显示渐变紫色背景的页面头部
2. THE Job Analysis Page SHALL 在头部显示"岗位分析"标题，使用特大字号和粗体样式
3. THE Job Analysis Page SHALL 在标题下方显示功能描述"AI智能分析岗位需求，助你精准匹配"
4. THE Job Analysis Page SHALL 使用 Design System 中定义的主题渐变色作为头部背景
5. THE Job Analysis Page SHALL 以白色显示头部文字，描述文字透明度为0.9

### Requirement 2: 快捷问题功能

**User Story:** 作为新用户，我希望看到预设的快捷问题，以便快速了解功能并开始使用，降低使用门槛

#### Acceptance Criteria

1. WHEN 用户首次进入且无历史消息，THE Job Analysis Page SHALL 显示快捷问题区域
2. THE Job Analysis Page SHALL 提供4个预设的快捷问题选项，涵盖大数据领域常见岗位分析场景
3. THE Quick Questions SHALL 以2列网格布局展示
4. WHEN 用户点击快捷问题，THE Job Analysis Page SHALL 自动填充到输入框并触发发送
5. WHEN 用户点击快捷问题，THE Job Analysis Page SHALL 提供触觉反馈
6. WHEN 发送第一条消息后，THE Job Analysis Page SHALL 隐藏快捷问题区域

**快捷问题列表**：
1. "分析这个大数据工程师岗位的技能要求"
2. "这个数据分析师职位需要什么经验？"
3. "帮我分析Spark开发工程师的面试重点"
4. "数据仓库工程师岗位的核心能力是什么？"

### Requirement 3: 现代化对话界面

**User Story:** 作为用户，我希望看到美观且易于区分的对话界面，以便清晰地查看对话历史和AI回复

#### Acceptance Criteria

1. THE Chat Interface SHALL 为用户消息显示右对齐的紫色渐变气泡
2. THE Chat Interface SHALL 为AI消息显示左对齐的白色气泡，包含边框
3. THE Chat Interface SHALL 为每条消息显示圆形头像，用户显示"我"，AI显示"AI"
4. THE Message Bubble SHALL 包含消息内容、时间戳和指向发送者的气泡尾巴
5. THE Chat Interface SHALL 为新消息添加从下方滑入的动画效果
6. THE Message Bubble SHALL 限制最大宽度为屏幕宽度的85%
7. THE Chat Interface SHALL 使用 Design System 中定义的圆角和阴影样式

### Requirement 4: AI打字指示器

**User Story:** 作为用户，我希望看到AI正在回复的提示，以便知道系统正在处理我的请求，避免重复提交

#### Acceptance Criteria

1. WHILE 系统正在发送消息，THE Chat Interface SHALL 显示 Typing Indicator
2. THE Typing Indicator SHALL 包含"AI正在分析中"文字和3个跳动的圆点动画
3. THE Typing Indicator SHALL 实现圆点依次跳动效果，循环周期为0.6秒
4. THE Typing Indicator SHALL 使用浅色背景的特殊气泡样式，区别于正常消息
5. WHEN AI回复完成，THE Job Analysis Page SHALL 立即隐藏 Typing Indicator

### Requirement 5: 消息操作功能

**User Story:** 作为用户，我希望能够对AI的回复进行操作，以便保存有用的信息或提供反馈

#### Acceptance Criteria

1. THE Message Bubble SHALL 为AI消息提供操作按钮栏
2. THE Message Actions SHALL 包含"复制"和"有用"两个操作按钮
3. WHEN 用户点击复制按钮，THE Job Analysis Page SHALL 将消息内容复制到剪贴板
4. WHEN 复制成功，THE Job Analysis Page SHALL 显示提示"已复制到剪贴板"
5. WHEN 用户点击有用按钮，THE Job Analysis Page SHALL 显示提示"感谢您的反馈"
6. WHEN 用户点击操作按钮，THE Message Actions SHALL 显示缩放动画效果

### Requirement 6: 智能输入框

**User Story:** 作为用户，我希望使用功能完善的输入框，以便方便地输入和发送消息，获得良好的输入体验

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 提供自动高度调整的多行输入框
2. THE Job Analysis Page SHALL 设置输入框最小高度44px，最大高度120px
3. WHEN 输入框获得焦点，THE Job Analysis Page SHALL 显示主题色边框高亮效果
4. WHILE 用户输入内容，THE Job Analysis Page SHALL 显示字数统计，格式为"当前字数/2000"
5. THE Job Analysis Page SHALL 限制输入内容最大长度为2000字符
6. THE Job Analysis Page SHALL 提供圆形发送按钮，尺寸为48px × 48px，包含火箭图标
7. WHEN 输入框为空或系统正在发送消息，THE Job Analysis Page SHALL 禁用发送按钮并显示灰色背景
8. WHILE 系统正在发送消息，THE Job Analysis Page SHALL 在发送按钮显示沙漏图标和旋转动画

### Requirement 7: 对话管理功能

**User Story:** 作为用户，我希望能够管理对话记录，以便清理历史对话或导出重要内容

#### Acceptance Criteria

1. WHEN 存在历史消息，THE Job Analysis Page SHALL 显示功能按钮栏
2. THE Job Analysis Page SHALL 提供"清空"和"导出"两个功能按钮
3. WHEN 用户点击清空按钮，THE Job Analysis Page SHALL 显示确认对话框
4. WHEN 用户确认清空，THE Job Analysis Page SHALL 清空所有消息并删除本地存储的对话数据
5. WHEN 清空成功，THE Job Analysis Page SHALL 显示提示"已清空对话"
6. WHEN 用户点击导出按钮，THE Job Analysis Page SHALL 格式化对话记录并复制到剪贴板
7. THE Job Analysis Page SHALL 在导出内容中包含角色标识、时间和消息内容

### Requirement 8: 对话历史保存

**User Story:** 作为用户，我希望系统自动保存对话历史，以便下次进入时继续查看，保持对话连续性

#### Acceptance Criteria

1. WHEN 用户发送消息或收到AI回复，THE Job Analysis Page SHALL 自动保存对话到本地存储
2. THE Job Analysis Page SHALL 保存对话数据，包含消息列表、会话ID和更新时间
3. THE Job Analysis Page SHALL 使用存储键名'job_session'保存对话数据
4. WHEN 用户进入页面，THE Job Analysis Page SHALL 尝试加载历史对话
5. WHEN 对话历史的更新时间距离当前时间小于24小时，THE Job Analysis Page SHALL 加载并显示历史记录
6. WHEN 对话历史超过24小时或不存在，THE Job Analysis Page SHALL 显示快捷问题区域

### Requirement 9: 智能时间显示

**User Story:** 作为用户，我希望看到友好的时间显示，以便了解消息的发送时间，提升可读性

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 为每条消息显示格式化的时间戳
2. WHEN 消息时间距离当前时间小于1分钟，THE Job Analysis Page SHALL 显示"刚刚"
3. WHEN 消息时间距离当前时间小于1小时，THE Job Analysis Page SHALL 显示"X分钟前"，其中X为分钟数
4. WHEN 消息时间在当天，THE Job Analysis Page SHALL 显示时分格式时间
5. WHEN 消息时间在历史日期，THE Job Analysis Page SHALL 显示月日时分格式时间
6. THE Job Analysis Page SHALL 使用时间处理库进行时间格式化

### Requirement 10: AI服务集成

**User Story:** 作为开发者，我希望页面正确集成AI服务，以便实现岗位分析功能，确保数据流畅通

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 在发送消息前检查用户登录状态
2. WHEN 用户未登录，THE Job Analysis Page SHALL 跳转到登录页面
3. THE Job Analysis Page SHALL 调用 AI Service 发送消息，传递场景标识为'job'、消息历史和会话ID
4. THE Job Analysis Page SHALL 在AI服务调用中包含完整的消息上下文
5. WHEN AI服务返回成功，THE Job Analysis Page SHALL 将AI回复添加到消息列表
6. WHEN AI服务返回失败，THE Job Analysis Page SHALL 显示错误提示并恢复发送状态
7. THE Job Analysis Page SHALL 对所有异步操作进行错误处理

### Requirement 11: 交互反馈优化

**User Story:** 作为用户，我希望获得即时的交互反馈，以便确认我的操作已被识别，提升操作体验

#### Acceptance Criteria

1. WHEN 用户点击发送按钮，THE Job Analysis Page SHALL 提供触觉反馈
2. WHEN 用户点击任何按钮，THE Job Analysis Page SHALL 显示缩放动画效果
3. WHEN 操作成功，THE Job Analysis Page SHALL 显示成功提示消息
4. WHEN 操作失败，THE Job Analysis Page SHALL 显示错误提示消息
5. THE Job Analysis Page SHALL 使用高性能的动画属性实现所有动画效果

### Requirement 12: 响应式布局

**User Story:** 作为用户，我希望页面在不同设备上都能正常显示，以便在任何设备上使用，保证体验一致性

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 使用弹性布局适配不同屏幕尺寸
2. THE Job Analysis Page SHALL 使用响应式单位定义尺寸，确保在不同设备上等比缩放
3. THE Job Analysis Page SHALL 处理底部安全区域，避免内容被遮挡
4. THE Message Bubble SHALL 限制最大宽度为屏幕宽度的85%
5. THE Job Analysis Page SHALL 在横竖屏切换时保持布局正确并自动滚动到最新消息

### Requirement 13: 设计系统集成

**User Story:** 作为开发者，我希望页面完全使用设计系统，以便保持视觉一致性，提升代码可维护性

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 使用 Design System 中定义的所有CSS变量
2. THE Job Analysis Page SHALL 使用 Design System 中定义的颜色变量
3. THE Job Analysis Page SHALL 使用 Design System 中定义的间距变量
4. THE Job Analysis Page SHALL 使用 Design System 中定义的圆角变量
5. THE Job Analysis Page SHALL 使用 Design System 中定义的阴影变量
6. THE Job Analysis Page SHALL 使用 Design System 中定义的文字样式类
7. THE Job Analysis Page SHALL 避免使用硬编码的样式值

### Requirement 14: 性能优化

**User Story:** 作为用户，我希望页面加载快速、滚动流畅，以便获得良好的使用体验，避免卡顿

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 启用增强滚动性能模式
2. THE Job Analysis Page SHALL 实现平滑滚动效果
3. THE Job Analysis Page SHALL 限制历史消息数量最多50条
4. WHEN 消息数量超过50条，THE Job Analysis Page SHALL 删除最早的消息
5. THE Job Analysis Page SHALL 优化数据更新操作，避免频繁更新
6. THE Job Analysis Page SHALL 使用防抖处理输入事件
7. THE Job Analysis Page SHALL 避免在视图层使用复杂的表达式和计算

### Requirement 15: 错误处理和日志

**User Story:** 作为开发者，我希望页面有完善的错误处理和日志记录，以便快速定位和解决问题

#### Acceptance Criteria

1. THE Job Analysis Page SHALL 对所有异步操作进行错误捕获和处理
2. WHEN 捕获到错误，THE Job Analysis Page SHALL 记录错误信息到控制台
3. WHEN 网络请求失败，THE Job Analysis Page SHALL 显示错误提示"网络连接失败，请检查网络"
4. WHEN AI服务超时，THE Job Analysis Page SHALL 显示提示"请求超时，请重试"
5. WHEN 用户未登录，THE Job Analysis Page SHALL 显示提示"请先登录"并跳转到登录页面
6. THE Job Analysis Page SHALL 在关键操作前后记录日志信息

## 技术约束

### 平台约束
- 基于微信小程序平台（版本 >= 8.4.0）
- 使用WXML、WXSS、JavaScript开发
- 遵循微信小程序开发规范和限制

### 架构约束
- 遵循项目分层架构设计（应用层、页面层、组件层、工具层、配置层）
- 页面逻辑放在pages/ai/job/目录
- AI服务调用通过utils/ai.js模块
- 用户认证通过utils/auth.js模块

### UI约束
- 使用Vant Weapp组件库（版本 1.11.6）
- 遵循app.wxss中定义的设计系统
- 使用CSS变量而非硬编码样式值

### 数据约束
- 使用wx.setStorageSync/wx.getStorageSync进行本地存储
- 存储键名：'job_session'
- 单条消息最大长度：2000字符
- 历史消息最大数量：50条
- 会话有效期：24小时

### 性能约束
- 页面加载时间 < 2秒
- 滚动帧率 >= 60fps
- 单次setData数据量 < 1MB
- AI请求超时时间：30秒

## 验收标准

### 功能验收
- ✅ 所有12个需求的验收标准全部通过
- ✅ 快捷问题点击正常，自动发送消息
- ✅ 消息发送和接收流程完整
- ✅ 对话历史保存和加载正常
- ✅ 消息操作（复制、点赞）功能正常
- ✅ 对话管理（清空、导出）功能正常

### 界面验收
- ✅ 页面布局符合设计稿
- ✅ 消息气泡样式正确（用户紫色，AI白色）
- ✅ 头像显示正确（用户"我"，AI"AI"）
- ✅ 时间格式化正确
- ✅ 打字指示器动画流畅
- ✅ 输入框聚焦效果正常

### 交互验收
- ✅ 触觉反馈正常（震动）
- ✅ 点击动画流畅（缩放效果）
- ✅ 滚动流畅，无卡顿
- ✅ Toast提示显示正确
- ✅ 错误提示友好清晰

### 兼容性验收
- ✅ iPhone系列（6及以上）正常显示
- ✅ Android主流机型正常显示
- ✅ 不同屏幕尺寸适配正常
- ✅ 横竖屏切换正常
- ✅ 刘海屏安全区域处理正常

### 性能验收
- ✅ 页面加载时间 < 2秒
- ✅ 滚动帧率 >= 60fps
- ✅ 动画流畅，无掉帧
- ✅ 内存占用合理
- ✅ 长对话（50条消息）性能正常

## 附录

### A. 数据结构定义

**消息对象**：
```javascript
{
  role: 'user' | 'assistant',  // 角色
  content: string,              // 消息内容
  timestamp: number             // 时间戳（毫秒）
}
```

**会话对象**：
```javascript
{
  messages: Array<Message>,     // 消息列表
  sessionId: string,            // 会话ID
  updateTime: number            // 更新时间戳
}
```

### B. API接口定义

**AI.chat() 方法**：
```javascript
AI.chat({
  scene: 'job',                 // 场景标识
  messages: Array<Message>,     // 消息历史
  sessionId: string             // 会话ID（可选）
})
// 返回: Promise<{ content: string, sessionId: string }>
```

### C. 样式变量参考

**颜色变量**：
- `--primary-color`: 主题色
- `--primary-gradient`: 主题渐变
- `--bg-page`: 页面背景色
- `--bg-card`: 卡片背景色
- `--text-primary`: 主要文字色
- `--text-white`: 白色文字
- `--border-light`: 浅色边框

**间距变量**：
- `--space-sm`: 小间距（8rpx）
- `--space-md`: 中间距（16rpx）
- `--space-lg`: 大间距（24rpx）
- `--space-xl`: 超大间距（32rpx）

**圆角变量**：
- `--radius-sm`: 小圆角（4rpx）
- `--radius-md`: 中圆角（8rpx）
- `--radius-lg`: 大圆角（16rpx）
- `--radius-circle`: 圆形（50%）

**阴影变量**：
- `--shadow-sm`: 小阴影
- `--shadow-md`: 中阴影
- `--shadow-lg`: 大阴影

---

**文档版本**: v2.0  
**最后更新**: 2024-11-14  
**更新说明**: 基于项目实际架构和技术栈全面优化需求文档
