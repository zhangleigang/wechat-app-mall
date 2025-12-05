# 📄 简历管理 API 文档

## 概述

简历管理功能提供文档上传、管理和 AI 智能问答服务。支持 PDF、Word、Markdown 等多种格式。

**Base URL**: `https://api.feelnow.cn:8443/api/resume`

---

## 认证说明

所有接口都需要验证用户的会员状态。请确保：
1. 用户已开通会员
2. 会员未过期
3. 提供有效的 OpenID

---

## API 接口

### 1. 上传简历

上传并解析简历文件。

**接口**: `POST /upload`

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 简历文件（PDF/Word/Markdown） |
| openid | String | 是 | 用户的微信 OpenID |

**支持的文件格式**:
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Markdown (`.md`)

**文件大小限制**: 10MB

**响应示例**:

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "id": 123,
    "filename": "张三_数据分析师.pdf",
    "uploadTime": "2025-12-05T10:30:00.000Z",
    "parsedText": "简历文本内容..."
  }
}
```

**错误码**:

| Code | 说明 |
|------|------|
| -1 | 缺少参数或参数无效 |
| 403 | 未开通会员或会员已过期 |
| 1001 | 文件解析失败 |
| 1002 | 数据存储失败 |
| 1004 | 简历数量已达上限（最多3个） |

---

### 2. 获取简历列表

获取用户上传的所有简历。

**接口**: `GET /list`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | String | 是 | 用户的微信 OpenID |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "resumes": [
      {
        "id": 123,
        "filename": "张三_数据分析师.pdf",
        "uploadTime": "2025-12-05T10:30:00.000Z",
        "fileSize": 245678
      },
      {
        "id": 124,
        "filename": "李四_Java开发.docx",
        "uploadTime": "2025-12-04T15:20:00.000Z",
        "fileSize": 189234
      }
    ],
    "total": 2,
    "limit": 3
  }
}
```

**说明**:
- `total`: 当前已上传的简历数量
- `limit`: 最多可上传的简历数量（3个）
- 列表按上传时间倒序排列

---

### 3. 获取简历详情

获取指定简历的完整信息，包括解析后的文本内容。

**接口**: `GET /:id`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 简历ID（路径参数） |
| openid | String | 是 | 用户的微信 OpenID（查询参数） |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 123,
    "filename": "张三_数据分析师.pdf",
    "filePath": "uploads/resumes/oxxx_1733380800000_张三_数据分析师.pdf",
    "parsedText": "姓名：张三\n职位：数据分析师\n...",
    "fileSize": 245678,
    "uploadTime": "2025-12-05T10:30:00.000Z"
  }
}
```

**错误码**:

| Code | 说明 |
|------|------|
| 403 | 无权限访问此简历 |
| 404 | 简历不存在 |

---

### 4. 删除简历

删除指定的简历，包括数据库记录和文件。

**接口**: `DELETE /:id`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 简历ID（路径参数） |
| openid | String | 是 | 用户的微信 OpenID（请求体） |

**请求示例**:

```json
{
  "openid": "oxxx123456"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

**错误码**:

| Code | 说明 |
|------|------|
| 403 | 无权限删除此简历 |
| 404 | 简历不存在 |
| 1002 | 删除失败 |

---

### 5. AI 智能问答

基于简历内容进行 AI 问答分析。

**接口**: `POST /chat`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | String | 是 | 用户的微信 OpenID |
| resumeId | Number | 是 | 简历ID |
| question | String | 是 | 用户的问题 |
| conversationHistory | Array | 否 | 对话历史 |
| documentType | String | 否 | 文档类型提示 |

**documentType 可选值**:
- `resume` - 简历（默认）
- `job` - 职位描述
- `report` - 报告文档
- `null` - 自动判断

**请求示例**:

```json
{
  "openid": "oxxx123456",
  "resumeId": 123,
  "question": "简历最大的亮点是什么？",
  "conversationHistory": [
    {
      "role": "user",
      "content": "帮我分析一下这份简历"
    },
    {
      "role": "assistant",
      "content": "好的，我来帮您分析..."
    }
  ],
  "documentType": "resume"
}
```

**响应示例**:

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

**错误码**:

| Code | 说明 |
|------|------|
| -1 | 参数缺失或无效 |
| 403 | 未开通会员、会员已过期或无权限访问 |
| 404 | 简历不存在 |
| 1001 | 简历内容为空 |
| 1004 | AI 服务异常 |

---

## 对话历史格式

`conversationHistory` 是一个消息数组，每条消息包含：

```json
{
  "role": "user" | "assistant",
  "content": "消息内容"
}
```

**示例**:

```json
[
  {
    "role": "user",
    "content": "帮我分析一下这份简历"
  },
  {
    "role": "assistant",
    "content": "好的，我来帮您分析这份简历..."
  },
  {
    "role": "user",
    "content": "有哪些可以优化的地方？"
  },
  {
    "role": "assistant",
    "content": "根据分析，以下几个方面可以优化..."
  }
]
```

---

## 预设问题示例

推荐的预设问题：

1. **亮点分析**: "整个简历最大的亮点是什么？"
2. **优化建议**: "简历还有哪些可以优化的？"
3. **STAR 解读**: "用 STAR 原则解读这份简历"
4. **岗位匹配**: "这份简历适合什么样的岗位？"
5. **技能评估**: "简历中体现了哪些核心技能？"

---

## 错误处理

### 统一错误响应格式

```json
{
  "code": -1,
  "message": "错误描述"
}
```

### 常见错误码

| Code | 说明 | 处理建议 |
|------|------|----------|
| -1 | 参数错误 | 检查请求参数 |
| 403 | 权限不足 | 引导用户开通会员 |
| 404 | 资源不存在 | 提示用户重新选择 |
| 1001 | 文件解析失败 | 提示用户重新上传 |
| 1002 | 数据库错误 | 稍后重试 |
| 1004 | AI 服务异常 | 稍后重试 |

---

## 使用限制

1. **简历数量**: 每个用户最多上传 3 个简历
2. **文件大小**: 单个文件不超过 10MB
3. **文件格式**: 仅支持 PDF、Word、Markdown
4. **会员要求**: 所有功能需要有效会员

---

## 最佳实践

### 1. 文件上传

```javascript
// 小程序端示例
wx.chooseMessageFile({
  count: 1,
  type: 'file',
  extension: ['pdf', 'doc', 'docx', 'md'],
  success: (res) => {
    const tempFilePath = res.tempFiles[0].path;
    
    wx.uploadFile({
      url: 'https://api.feelnow.cn:8443/api/resume/upload',
      filePath: tempFilePath,
      name: 'file',
      formData: {
        openid: wx.getStorageSync('openid')
      },
      success: (uploadRes) => {
        const data = JSON.parse(uploadRes.data);
        if (data.code === 0) {
          console.log('上传成功', data.data);
        }
      }
    });
  }
});
```

### 2. AI 问答

```javascript
// 小程序端示例
async function chatWithResume(resumeId, question, history = []) {
  const res = await wx.request({
    url: 'https://api.feelnow.cn:8443/api/resume/chat',
    method: 'POST',
    data: {
      openid: wx.getStorageSync('openid'),
      resumeId: resumeId,
      question: question,
      conversationHistory: history
    }
  });
  
  if (res.data.code === 0) {
    return res.data.data.answer;
  } else {
    throw new Error(res.data.message);
  }
}
```

### 3. 对话历史管理

```javascript
// 维护对话历史
let conversationHistory = [];

function addMessage(role, content) {
  conversationHistory.push({ role, content });
  
  // 限制历史长度（避免 token 超限）
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
}

// 发送问题
async function sendQuestion(question) {
  addMessage('user', question);
  
  const answer = await chatWithResume(
    currentResumeId,
    question,
    conversationHistory
  );
  
  addMessage('assistant', answer);
  return answer;
}

// 切换简历时清空历史
function switchResume(newResumeId) {
  currentResumeId = newResumeId;
  conversationHistory = [];
}
```

---

## 性能优化建议

1. **缓存简历列表**: 前端缓存 5 分钟，减少 API 调用
2. **分页加载对话**: 对话历史较长时分页显示
3. **压缩上传**: 大文件上传前进行压缩
4. **异步处理**: 文件解析使用异步，避免阻塞

---

## 安全说明

1. **文件验证**: 后端会验证文件 MIME 类型，不仅依赖扩展名
2. **权限控制**: 所有操作都验证 OpenID 和会员状态
3. **文件隔离**: 每个用户的文件独立存储，无法访问他人文件
4. **SQL 注入防护**: 使用参数化查询
5. **XSS 防护**: 对用户输入和 AI 输出进行转义

---

## 更新日志

### v1.0.0 (2025-12-05)

- ✅ 初始版本发布
- ✅ 支持简历上传和解析
- ✅ 支持简历列表管理
- ✅ 集成 DeepSeek AI 问答
- ✅ 支持多种文档类型智能识别

---

## 技术支持

如有问题，请查看：
- 部署文档: `server/RESUME_FEATURE_DEPLOY.md`
- 错误日志: `pm2 logs ai-interview-helper --err`
- 数据库状态: `mysql -u root -p -e "USE ai_interview_helper; SELECT COUNT(*) FROM resumes;"`
