# 简历解读页面优化设计文档

## Overview

本设计文档详细描述了简历解读页面的优化方案。设计目标是创建一个专业、易用、功能完善的简历分析界面，提供流畅的上传体验和智能的对话分析。

## Architecture

### 页面结构

```
┌─────────────────────────────────────┐
│         Gradient Header             │  渐变头部
│    (标题 + 描述 + 上传按钮)         │
├─────────────────────────────────────┤
│      Upload Section                 │  上传区域
│   (未上传时显示引导)                │
│   或                                │
│      Resume Status Card             │  简历状态卡片
│   (已上传时显示)                    │
├─────────────────────────────────────┤
│      Quick Analysis Options         │  快捷分析选项
│   (上传后显示)                      │
├─────────────────────────────────────┤
│        Chat Container               │  对话区域
│      (Scroll View)                  │
├─────────────────────────────────────┤
│      Function Bar                   │  功能按钮栏
├─────────────────────────────────────┤
│      Input Section                  │  输入区域
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Gradient Header Component

**功能**: 显示页面标题、描述和上传按钮

**视觉设计**:
- 背景: 紫色渐变
- 标题: "简历解读"
- 描述: "AI智能分析简历，提供优化建议"
- 上传按钮: 圆角按钮，白色背景

### 2. Upload Section Component

**未上传状态**:
```xml
<view class="upload-section">
  <view class="upload-icon">📄</view>
  <text class="upload-title">上传简历开始分析</text>
  <text class="upload-desc">支持 PDF、Word、图片格式</text>
  <button class="upload-btn">选择文件</button>
</view>
```

**已上传状态**:
```xml
<view class="resume-status-card">
  <view class="status-icon">✅</view>
  <view class="status-info">
    <text class="file-name">我的简历.pdf</text>
    <text class="upload-time">上传于 14:30</text>
  </view>
  <button class="reupload-btn">重新上传</button>
</view>
```

### 3. Quick Analysis Options Component

**功能**: 提供常用的分析选项

**选项列表**:
1. "分析简历亮点和优势"
2. "找出简历中的问题"
3. "针对XX岗位优化建议"
4. "生成面试问答清单"

**布局**: 横向滚动或网格布局

### 4. Chat Interface Component

**复用岗位分析页面的对话界面设计**:
- 用户消息: 紫色渐变气泡
- AI消息: 白色气泡
- 头像、时间、操作按钮

### 5. Input Section Component

**复用岗位分析页面的输入区域设计**:
- 智能输入框
- 字数统计
- 圆形发送按钮
- 功能按钮栏

## Data Models

### Page Data Structure

```javascript
{
  // 会话ID
  sessionId: string,
  
  // 输入内容
  inputVal: string,
  
  // 简历文本
  resumeText: string,
  
  // 简历状态
  resumeStatus: {
    uploaded: boolean,
    fileName: string,
    uploadTime: string
  },
  
  // 对话消息
  messages: Array<{
    role: 'user' | 'assistant',
    content: string,
    time: string,
    timestamp: number
  }>,
  
  // 发送状态
  sending: boolean,
  
  // 滚动位置
  scrollTop: number,
  
  // 快捷分析选项
  quickAnalysis: [
    '分析简历亮点和优势',
    '找出简历中的问题',
    '针对数据分析岗位优化建议',
    '生成面试问答清单'
  ]
}
```

### Local Storage Structure

```javascript
// 存储键: 'resume_conversation'
{
  messages: Array<Message>,
  resumeStatus: Object,
  updateTime: number
}
```

## Interaction Flows

### 1. 首次进入流程

```
用户进入页面
  ↓
检查本地存储
  ↓
无历史记录
  ↓
显示上传引导区域
  ↓
用户点击上传
  ↓
选择文件
  ↓
上传并解析
  ↓
显示简历状态卡片
  ↓
显示快捷分析选项
```

### 2. 上传简历流程

```
用户点击上传按钮
  ↓
调用 wx.chooseMessageFile
  ↓
显示"上传解析中"加载提示
  ↓
调用 AI.uploadResume()
  ↓
解析成功
  ↓
保存简历文本和状态
  ↓
隐藏加载提示
  ↓
显示成功Toast
  ↓
更新界面显示简历状态
  ↓
显示快捷分析选项
```

### 3. 快捷分析流程

```
用户点击分析选项
  ↓
自动填充问题到输入框
  ↓
自动发送消息
  ↓
显示打字指示器
  ↓
收到AI回复
  ↓
显示分析结果
```

## Styling and Design System

### Color Scheme

**页面配色**:
- 头部背景: `--primary-gradient`
- 上传区域: `--bg-card`
- 状态卡片: `--bg-card` + `--border-light`
- 快捷选项: `--bg-page` + `--primary-lighter`

### Component Styles

**上传区域样式**:
```css
.upload-section {
  background: var(--bg-card);
  padding: var(--space-2xl);
  text-align: center;
  border-radius: var(--radius-lg);
  margin: var(--space-lg);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.upload-btn {
  background: var(--primary-gradient);
  color: var(--text-white);
  border-radius: var(--radius-round);
  padding: var(--space-md) var(--space-xl);
}
```

**简历状态卡片样式**:
```css
.resume-status-card {
  background: var(--success-lighter);
  border: 2px solid var(--success-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
```

## Error Handling

### 上传错误处理

```javascript
try {
  const parsed = await AI.uploadResume(file.path)
  // 处理成功
} catch (error) {
  wx.hideLoading()
  wx.showModal({
    title: '上传失败',
    content: '请检查文件格式或网络连接',
    confirmText: '重试',
    success: (res) => {
      if (res.confirm) {
        this.uploadResume()
      }
    }
  })
}
```

### 文件格式验证

```javascript
const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png']
const fileExt = file.name.substring(file.name.lastIndexOf('.'))
if (!allowedTypes.includes(fileExt.toLowerCase())) {
  wx.showToast({
    title: '不支持的文件格式',
    icon: 'none'
  })
  return
}
```

## Performance Optimization

### 1. 文件上传优化
- 显示上传进度
- 压缩大文件
- 超时处理

### 2. 界面渲染优化
- 复用对话界面组件
- 懒加载历史消息
- 优化动画性能

## Testing Strategy

### 功能测试
- ✅ 文件上传功能
- ✅ 文件格式验证
- ✅ 上传进度显示
- ✅ 快捷分析功能
- ✅ 对话功能
- ✅ 历史记录保存

### 界面测试
- ✅ 上传区域显示
- ✅ 状态卡片显示
- ✅ 快捷选项显示
- ✅ 对话界面显示

### 错误测试
- ✅ 网络错误处理
- ✅ 文件格式错误
- ✅ 上传超时处理
