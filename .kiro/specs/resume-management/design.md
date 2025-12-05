# 简历管理与智能问答优化 - 设计文档

## 概述

本设计文档描述了简历管理与智能问答功能的技术实现方案。系统将在现有简历解读功能的基础上，增加简历文件的持久化存储、列表管理、选择切换等功能，并优化用户交互体验。

核心改进包括：
1. 后端新增简历管理API服务（扩展server服务）
2. 前端重构简历解读页面，支持多简历管理
3. 集成DeepSeek API进行智能问答
4. 优化预设问题和对话流程

## 架构

### 整体架构

```
┌─────────────────┐
│  微信小程序前端  │
│  (resume页面)   │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Server服务     │
│  (Node.js)      │
│  新增简历API    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐       ┌──────────────┐
│  MySQL数据库    │       │  文件存储    │
│  resumes表      │       │  /uploads/   │
└─────────────────┘       └──────────────┘
         ↑
         │
         ↓
┌─────────────────┐
│  DeepSeek API   │
│  (AI问答服务)   │
└─────────────────┘
```

### 数据流

1. **上传流程**: 前端 → Server → 文件系统 + MySQL → 返回简历ID
2. **列表查询**: 前端 → Server → MySQL → 返回简历列表
3. **问答流程**: 前端 → Server → DeepSeek API → 返回AI回答
4. **删除流程**: 前端 → Server → 删除文件 + MySQL记录 → 返回成功

## 组件和接口

### 后端组件

#### 1. 简历管理API (Server服务扩展)

**新增路由**:
- `POST /api/resume/upload` - 上传简历
- `GET /api/resume/list` - 获取简历列表
- `GET /api/resume/:id` - 获取简历详情
- `DELETE /api/resume/:id` - 删除简历
- `POST /api/resume/chat` - 基于简历的AI问答

**中间件**:
- `authMiddleware` - 验证OpenID和会员状态
- `uploadMiddleware` - 处理文件上传（使用multer）
- `fileSizeLimit` - 限制文件大小（10MB）

#### 2. 文件解析服务

**支持格式**:
- PDF: 使用 `pdf-parse` 库
- Word (.docx): 使用 `mammoth` 库
- Markdown (.md): 直接读取文本内容
- 图片 (.jpg, .png): 使用 OCR服务（可选，初期可提示不支持）

#### 3. DeepSeek API集成

**配置**:
```javascript
{
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
  maxTokens: 2000
}
```

### 前端组件

#### 1. 简历列表组件 (resume-list)

**功能**:
- 横向滚动显示简历卡片
- 支持选择、删除操作
- 显示上传按钮（当数量<3时）
- 上传引导文案："支持 PDF、Word、Markdown 格式"

**数据结构**:
```javascript
{
  id: Number,
  filename: String,
  uploadTime: String,
  isActive: Boolean
}
```

#### 2. 预设问题组件 (preset-questions)

**预设问题列表**:
1. "整个简历最大的亮点是什么？"
2. "简历还有哪些可以优化的？"
3. "用STAR原则解读这份简历"

#### 3. 对话组件 (chat-interface)

**功能**:
- 显示对话历史
- 发送用户问题
- 展示AI回复
- 支持复制、导出

### API接口定义

#### POST /api/resume/upload

**请求**:
- Content-Type: multipart/form-data
- Headers: Authorization (Bearer token)
- Body: 
  - file: 文件对象
  - openid: 用户OpenID

**响应**:
```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "id": 123,
    "filename": "张三_数据分析师.pdf",
    "uploadTime": "2025-12-05 10:30:00",
    "parsedText": "简历文本内容..."
  }
}
```

#### GET /api/resume/list

**请求**:
- Headers: Authorization (Bearer token)
- Query: openid

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "resumes": [
      {
        "id": 123,
        "filename": "张三_数据分析师.pdf",
        "uploadTime": "2025-12-05 10:30:00"
      }
    ],
    "total": 1,
    "limit": 3
  }
}
```

#### DELETE /api/resume/:id

**请求**:
- Headers: Authorization (Bearer token)
- Body: { openid: String }

**响应**:
```json
{
  "code": 0,
  "message": "删除成功"
}
```

#### POST /api/resume/chat

**请求**:
```json
{
  "openid": "xxx",
  "resumeId": 123,
  "question": "简历最大的亮点是什么？",
  "conversationHistory": []
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "answer": "根据您的简历，最大的亮点是...",
    "timestamp": 1733380800000
  }
}
```

## 数据模型

### MySQL - resumes表

```sql
CREATE TABLE resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(100) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  parsed_text TEXT,
  file_size INT,
  upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid),
  INDEX idx_upload_time (upload_time)
);
```

### 前端数据模型

#### ResumeItem
```javascript
{
  id: Number,           // 简历ID
  filename: String,     // 文件名
  uploadTime: String,   // 上传时间（格式化后）
  isActive: Boolean     // 是否为当前选中
}
```

#### Message
```javascript
{
  role: String,         // 'user' | 'assistant' | 'system'
  content: String,      // 消息内容
  time: String,         // 时间戳（格式化）
  timestamp: Number     // 原始时间戳
}
```

## 正确性属性

*属性是系统在所有有效执行中应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 简历数量限制

*对于任何*用户，当该用户已上传3个简历时，系统应拒绝新的上传请求并返回错误提示。

**验证**: 需求 1.4

### 属性 2: 简历与用户关联

*对于任何*简历记录，该简历应仅对上传它的用户（通过OpenID标识）可见和可操作。

**验证**: 需求 2.1, 6.5

### 属性 3: 删除操作的完整性

*对于任何*删除操作，当数据库记录被删除时，对应的文件系统文件也应被删除，反之亦然（原子性）。

**验证**: 需求 7.4

### 属性 4: Active Resume唯一性

*对于任何*用户会话，最多只能有一个简历被标记为Active Resume。

**验证**: 需求 2.3

### 属性 5: 问答上下文一致性

*对于任何*AI问答请求，发送到DeepSeek API的简历文本应与当前Active Resume的parsed_text字段完全一致。

**验证**: 需求 4.1

### 属性 6: 文件格式验证

*对于任何*上传请求，只有文件扩展名为.pdf、.doc、.docx、.md、.jpg、.png的文件应被接受处理。

**验证**: 需求 1.1

### 属性 7: 会员权限验证

*对于任何*简历相关API请求，只有具有有效会员状态的用户应被允许访问。

**验证**: 需求 6.5

## 错误处理

### 前端错误处理

1. **网络错误**: 显示"网络连接失败，请检查网络"，提供重试按钮
2. **文件格式错误**: 显示"不支持的文件格式，请上传PDF、Word或Markdown文档"
3. **文件大小超限**: 显示"文件过大，请上传小于10MB的文件"
4. **上传数量超限**: 显示"最多只能上传3个简历，请先删除旧简历"
5. **会员验证失败**: 跳转到会员购买页面
6. **AI服务异常**: 显示"AI服务暂时不可用，请稍后重试"

### 后端错误处理

1. **文件解析失败**: 返回 `{ code: 1001, message: "文件解析失败" }`
2. **数据库错误**: 返回 `{ code: 1002, message: "数据存储失败" }`
3. **文件存储失败**: 返回 `{ code: 1003, message: "文件保存失败" }`
4. **DeepSeek API错误**: 返回 `{ code: 1004, message: "AI服务异常" }`
5. **权限验证失败**: 返回 `{ code: 403, message: "无权限访问" }`
6. **资源不存在**: 返回 `{ code: 404, message: "简历不存在" }`

### 错误日志

所有错误应记录到日志文件，包含：
- 时间戳
- 用户OpenID
- 错误类型
- 错误详情
- 请求参数

## 测试策略

### 单元测试

**后端测试**:
1. 文件上传处理函数
2. 文件解析函数（PDF、Word）
3. 数据库CRUD操作
4. DeepSeek API调用封装
5. 权限验证中间件

**前端测试**:
1. 简历列表渲染
2. 简历选择逻辑
3. 预设问题点击
4. 对话消息格式化

### 集成测试

1. 完整上传流程：前端选择文件 → 后端解析 → 数据库存储 → 返回结果
2. 完整问答流程：前端发送问题 → 后端调用DeepSeek → 返回答案 → 前端显示
3. 删除流程：前端请求删除 → 后端删除文件和记录 → 前端更新列表
4. 会员验证流程：非会员访问 → 拦截 → 跳转购买页

### 属性测试

1. **属性1测试**: 模拟用户上传3个简历后尝试上传第4个，验证被拒绝
2. **属性2测试**: 创建两个用户，验证用户A无法访问用户B的简历
3. **属性3测试**: 删除简历后，验证数据库记录和文件都被删除
4. **属性4测试**: 选择多个简历，验证只有最后选择的是Active
5. **属性5测试**: 发送问答请求，验证请求中的简历文本与数据库一致

### 手动测试场景

1. 上传各种格式的文件（PDF、Word、Markdown、图片、其他格式）
2. 上传超大文件（>10MB）
3. 网络中断时的上传和问答
4. 快速连续点击上传按钮
5. 删除当前Active Resume后的状态
6. 长时间对话后的性能表现

## 性能考虑

1. **文件上传**: 使用流式上传，支持大文件
2. **文件解析**: 异步处理，避免阻塞
3. **数据库查询**: 为openid字段添加索引
4. **前端缓存**: 简历列表缓存5分钟
5. **DeepSeek API**: 设置30秒超时，失败后重试1次

## 安全考虑

1. **文件验证**: 检查文件MIME类型，不仅依赖扩展名
2. **路径遍历**: 使用安全的文件命名，避免路径注入
3. **SQL注入**: 使用参数化查询
4. **XSS防护**: 对用户输入和AI输出进行转义
5. **文件访问**: 简历文件不直接暴露URL，通过API访问
6. **权限控制**: 每个请求都验证OpenID和会员状态

## 部署计划

### 数据库迁移

1. 在member-service数据库中创建resumes表
2. 运行初始化SQL脚本
3. 验证表结构和索引

### 后端部署

1. 在server服务中添加简历管理路由
2. 安装新依赖：multer、pdf-parse、mammoth
3. 配置DeepSeek API密钥（.env文件）
4. 创建uploads目录并设置权限
5. 重启Node.js服务

### 前端部署

1. 更新resume页面代码
2. 新增resume-api.js工具模块
3. 更新config.js配置
4. 提交代码并构建npm
5. 上传到微信小程序后台

### 回滚计划

如果出现问题：
1. 前端：恢复旧版本代码
2. 后端：注释掉新路由，重启服务
3. 数据库：保留resumes表（不影响旧功能）
