# 📚 收藏管理 API 文档

## 概述

收藏管理功能允许用户收藏、管理和查看来自不同来源的面试问题和答案。支持标签分类、AI生成答案（流式输出）和会员配额管理。

**Base URL**: `https://api.feelnow.cn:8443/api/favorites`

**支持的来源类型**:
- `knowledge` - 知识库问题
- `resume` - 简历解读问答
- `custom` - 自定义问题

---

## 认证说明

所有接口都需要提供有效的 OpenID。部分功能（如创建收藏）会验证会员配额：
- **免费用户**: 最多收藏 10 条
- **会员用户**: 无限制

---

## API 接口

### 1. 创建收藏

创建一条新的收藏记录。

**接口**: `POST /`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | String | 是 | 用户的微信 OpenID |
| question | String | 是 | 问题内容（至少1个字符） |
| answer | String | 是 | 答案内容（Markdown格式，至少1个字符） |
| sourceType | String | 是 | 来源类型：knowledge/resume/custom |
| sourceId | String | 否 | 来源ID（知识库题目ID或简历ID） |
| sourceCategory | String | 否 | 来源分类（如HDFS、Spark等） |
| tags | Array | 否 | 标签数组，如 ["Spark", "核心概念"] |

**请求示例**:

```json
{
  "openid": "oxxx123456",
  "question": "Spark的RDD是什么？",
  "answer": "# RDD概念\n\nRDD（Resilient Distributed Dataset）是...",
  "sourceType": "knowledge",
  "sourceId": "spark-001",
  "sourceCategory": "Spark",
  "tags": ["Spark", "核心概念"]
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "收藏成功",
  "data": {
    "id": 123,
    "openid": "oxxx123456",
    "question": "Spark的RDD是什么？",
    "answer": "# RDD概念\n\nRDD（Resilient Distributed Dataset）是...",
    "source_type": "knowledge",
    "source_id": "spark-001",
    "source_category": "Spark",
    "created_at": "2025-12-05T10:30:00.000Z",
    "updated_at": "2025-12-05T10:30:00.000Z",
    "tags": [
      { "id": 1, "name": "Spark" },
      { "id": 2, "name": "核心概念" }
    ]
  }
}
```

**特殊规则**:
- 如果 `sourceType` 为 `resume`，系统会自动添加"简历分析"标签
- 标签会自动去重
- 免费用户达到10条限制时会返回错误

**错误码**:

| Code | 说明 |
|------|------|
| -1 | 参数缺失或无效 |
| 403 | 超出配额限制（免费用户最多10条） |
| 1002 | 数据库错误 |

---

### 2. 获取收藏列表

获取用户的收藏列表，支持分页和标签筛选。

**接口**: `GET /`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | String | 是 | 用户的微信 OpenID |
| page | Number | 否 | 页码（默认1） |
| pageSize | Number | 否 | 每页数量（默认20） |
| tag | String | 否 | 标签筛选（标签名称） |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "favorites": [
      {
        "id": 123,
        "openid": "oxxx123456",
        "question": "Spark的RDD是什么？",
        "answer": "# RDD概念...",
        "source_type": "knowledge",
        "source_category": "Spark",
        "created_at": "2025-12-05T10:30:00.000Z",
        "tags": [
          { "id": 1, "name": "Spark" },
          { "id": 2, "name": "核心概念" }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

**说明**:
- 列表按创建时间倒序排列（最新的在前）
- 使用 `tag` 参数可以筛选包含特定标签的收藏
- 每个收藏都包含完整的标签列表

---

### 3. 获取收藏详情

获取指定收藏的完整信息。

**接口**: `GET /:id`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 收藏ID（路径参数） |
| openid | String | 是 | 用户的微信 OpenID（查询参数） |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 123,
    "openid": "oxxx123456",
    "question": "Spark的RDD是什么？",
    "answer": "# RDD概念\n\nRDD（Resilient Distributed Dataset）是...",
    "source_type": "knowledge",
    "source_id": "spark-001",
    "source_category": "Spark",
    "created_at": "2025-12-05T10:30:00.000Z",
    "updated_at": "2025-12-05T10:30:00.000Z",
    "tags": [
      { "id": 1, "name": "Spark" },
      { "id": 2, "name": "核心概念" }
    ]
  }
}
```

**错误码**:

| Code | 说明 |
|------|------|
| 403 | 无权限访问此收藏 |
| 404 | 收藏不存在 |

---

### 4. 更新收藏

更新收藏的问题内容或标签。

**接口**: `PUT /:id`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 收藏ID（路径参数） |
| openid | String | 是 | 用户的微信 OpenID |
| question | String | 否 | 新的问题内容 |
| tags | Array | 否 | 新的标签数组（会替换所有旧标签） |

**请求示例**:

```json
{
  "openid": "oxxx123456",
  "question": "Spark的RDD是什么？有什么特点？",
  "tags": ["Spark", "核心概念", "分布式计算"]
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 123,
    "question": "Spark的RDD是什么？有什么特点？",
    "tags": [
      { "id": 1, "name": "Spark" },
      { "id": 2, "name": "核心概念" },
      { "id": 3, "name": "分布式计算" }
    ],
    "updated_at": "2025-12-05T11:00:00.000Z"
  }
}
```

**说明**:
- 只能更新自己的收藏
- 更新标签时会完全替换旧标签
- 答案内容不可修改（保持原始AI生成的答案）

---

### 5. 删除收藏

删除指定的收藏记录。

**接口**: `DELETE /:id`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 收藏ID（路径参数） |
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

**说明**:
- 删除收藏会级联删除所有关联的标签关系
- 标签的使用次数会自动减少
- 只能删除自己的收藏

---

### 6. 获取标签列表

获取用户的所有标签，按使用次数排序。

**接口**: `GET /tags`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | String | 是 | 用户的微信 OpenID |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "Spark",
      "use_count": 15,
      "created_at": "2025-12-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "核心概念",
      "use_count": 12,
      "created_at": "2025-12-01T10:05:00.000Z"
    },
    {
      "id": 3,
      "name": "简历分析",
      "use_count": 8,
      "created_at": "2025-12-02T14:20:00.000Z"
    }
  ]
}
```

**说明**:
- 标签按使用次数降序排列
- `use_count` 表示该标签关联的收藏数量
- 只返回当前用户创建的标签

---

### 7. 为收藏添加标签

为指定收藏添加一个新标签。

**接口**: `POST /:id/tags`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 收藏ID（路径参数） |
| openid | String | 是 | 用户的微信 OpenID |
| tagName | String | 是 | 标签名称（1-10个字符） |

**请求示例**:

```json
{
  "openid": "oxxx123456",
  "tagName": "面试重点"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "添加标签成功",
  "data": {
    "id": 123,
    "tags": [
      { "id": 1, "name": "Spark" },
      { "id": 2, "name": "核心概念" },
      { "id": 4, "name": "面试重点" }
    ]
  }
}
```

**错误码**:

| Code | 说明 |
|------|------|
| -1 | 标签名称无效（空或超过10个字符） |
| 403 | 无权限修改此收藏 |
| 404 | 收藏不存在 |
| 409 | 该标签已存在 |

---

### 8. 移除收藏的标签

从指定收藏中移除一个标签。

**接口**: `DELETE /:id/tags/:tagId`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 收藏ID（路径参数） |
| tagId | Number | 是 | 标签ID（路径参数） |
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
  "message": "移除标签成功",
  "data": {
    "id": 123,
    "tags": [
      { "id": 1, "name": "Spark" },
      { "id": 2, "name": "核心概念" }
    ]
  }
}
```

**说明**:
- 移除标签后，标签的使用次数会自动减少
- 如果标签使用次数降为0，标签仍会保留（不会自动删除）

---

### 9. 生成AI答案（流式输出）

使用AI为自定义问题生成答案，采用Server-Sent Events (SSE)流式输出。

**接口**: `POST /generate-answer`

**Content-Type**: `application/json`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | String | 是 | 用户的微信 OpenID |
| question | String | 是 | 问题内容（至少5个字符） |

**请求示例**:

```json
{
  "openid": "oxxx123456",
  "question": "什么是MapReduce的Shuffle过程？"
}
```

**响应格式**: Server-Sent Events (SSE)

**事件类型**:

1. **connected** - 连接建立
```
event: connected
data: {"status":"connected"}
```

2. **chunk** - 答案片段（多次）
```
event: chunk
data: {"content":"MapReduce的Shuffle过程是..."}
```

3. **done** - 生成完成
```
event: done
data: {"content":"完整答案内容","status":"completed","chunkCount":25}
```

4. **error** - 生成错误
```
event: error
data: {"error":"AI服务异常","code":"API_SERVER_ERROR","retryable":true}
```

**错误码**:

| Code | 说明 | 可重试 |
|------|------|--------|
| TIMEOUT_ERROR | 请求超时 | 是 |
| NETWORK_ERROR | 网络错误 | 是 |
| AUTH_ERROR | 认证失败 | 否 |
| RATE_LIMIT_ERROR | 频率限制 | 是 |
| API_SERVER_ERROR | AI服务异常 | 是 |
| GENERATION_ERROR | 生成失败 | 否 |

**使用示例**（小程序端）:

```javascript
// 创建SSE连接
const requestTask = wx.request({
  url: 'https://api.feelnow.cn:8443/api/favorites/generate-answer',
  method: 'POST',
  data: {
    openid: wx.getStorageSync('openid'),
    question: '什么是MapReduce的Shuffle过程？'
  },
  enableChunked: true,
  success: (res) => {
    // 处理流式数据
    res.onChunkReceived((chunk) => {
      const text = ab2str(chunk.data);
      const lines = text.split('\n');
      
      lines.forEach(line => {
        if (line.startsWith('event:')) {
          const event = line.substring(7).trim();
          // 处理不同事件类型
        } else if (line.startsWith('data:')) {
          const data = JSON.parse(line.substring(6));
          // 更新UI显示答案
        }
      });
    });
  }
});
```

---

### 10. 获取统计信息

获取用户的收藏统计信息，包括会员状态和配额信息。

**接口**: `GET /stats`

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
    "member": {
      "isValid": false,
      "expireDate": null
    },
    "favorites": {
      "total": 8,
      "bySource": {
        "knowledge": 5,
        "resume": 2,
        "custom": 1
      }
    },
    "tags": {
      "total": 6
    },
    "quota": {
      "isValid": false,
      "current": 8,
      "limit": 10,
      "remaining": 2,
      "unlimited": false
    }
  }
}
```

**说明**:
- `member.isValid`: 是否为有效会员
- `favorites.total`: 总收藏数
- `favorites.bySource`: 按来源类型统计
- `tags.total`: 标签总数
- `quota.remaining`: 剩余可创建数量（会员为null）
- `quota.unlimited`: 是否无限制

---

## 错误处理

### 统一错误响应格式

```json
{
  "code": -1,
  "message": "错误描述",
  "error": "ERROR_CODE",
  "details": {
    "additional": "info"
  }
}
```

### 常见错误码

| Code | 说明 | HTTP状态码 |
|------|------|-----------|
| -1 | 参数错误 | 400 |
| 403 | 权限不足/配额超限 | 403 |
| 404 | 资源不存在 | 404 |
| 409 | 资源冲突（如重复标签） | 409 |
| 1002 | 数据库错误 | 500 |
| 5000 | 服务器内部错误 | 500 |

### 配额超限错误详情

```json
{
  "code": 403,
  "message": "免费用户最多收藏10条，请升级会员以解除限制",
  "error": "QUOTA_EXCEEDED",
  "details": {
    "current": 10,
    "limit": 10,
    "isValid": false
  }
}
```

---

## 数据模型

### Favorite（收藏对象）

```javascript
{
  id: Number,              // 收藏ID
  openid: String,          // 用户OpenID
  question: String,        // 问题内容
  answer: String,          // 答案内容（Markdown）
  source_type: String,     // 来源类型：knowledge/resume/custom
  source_id: String,       // 来源ID（可选）
  source_category: String, // 来源分类（可选）
  created_at: Date,        // 创建时间
  updated_at: Date,        // 更新时间
  tags: Array<Tag>         // 标签列表
}
```

### Tag（标签对象）

```javascript
{
  id: Number,        // 标签ID
  name: String,      // 标签名称
  use_count: Number, // 使用次数
  created_at: Date   // 创建时间
}
```

---

## 最佳实践

### 1. 创建收藏

```javascript
// 小程序端示例
async function createFavorite(question, answer, sourceType, tags = []) {
  const res = await wx.request({
    url: 'https://api.feelnow.cn:8443/api/favorites',
    method: 'POST',
    data: {
      openid: wx.getStorageSync('openid'),
      question: question,
      answer: answer,
      sourceType: sourceType,
      tags: tags
    }
  });
  
  if (res.data.code === 0) {
    wx.showToast({ title: '收藏成功', icon: 'success' });
    return res.data.data;
  } else if (res.data.error === 'QUOTA_EXCEEDED') {
    // 显示升级会员提示
    showUpgradeModal();
  } else {
    wx.showToast({ title: res.data.message, icon: 'none' });
  }
}
```

### 2. 分页加载收藏列表

```javascript
// 小程序端示例
let currentPage = 1;
let hasMore = true;

async function loadMoreFavorites() {
  if (!hasMore) return;
  
  const res = await wx.request({
    url: 'https://api.feelnow.cn:8443/api/favorites',
    method: 'GET',
    data: {
      openid: wx.getStorageSync('openid'),
      page: currentPage,
      pageSize: 20
    }
  });
  
  if (res.data.code === 0) {
    const { favorites, pagination } = res.data.data;
    // 追加到列表
    this.setData({
      favoritesList: [...this.data.favoritesList, ...favorites]
    });
    
    currentPage++;
    hasMore = pagination.hasMore;
  }
}
```

### 3. 标签筛选

```javascript
// 小程序端示例
async function filterByTag(tagName) {
  const res = await wx.request({
    url: 'https://api.feelnow.cn:8443/api/favorites',
    method: 'GET',
    data: {
      openid: wx.getStorageSync('openid'),
      tag: tagName,
      page: 1,
      pageSize: 20
    }
  });
  
  if (res.data.code === 0) {
    this.setData({
      favoritesList: res.data.data.favorites,
      activeTag: tagName
    });
  }
}
```

### 4. 流式生成答案

```javascript
// 小程序端示例
function generateAnswer(question, onChunk, onComplete, onError) {
  let fullAnswer = '';
  
  const requestTask = wx.request({
    url: 'https://api.feelnow.cn:8443/api/favorites/generate-answer',
    method: 'POST',
    data: {
      openid: wx.getStorageSync('openid'),
      question: question
    },
    enableChunked: true,
    success: (res) => {
      res.onChunkReceived((chunk) => {
        const text = ab2str(chunk.data);
        const lines = text.split('\n');
        
        lines.forEach(line => {
          if (line.startsWith('event: chunk')) {
            // 下一行是data
          } else if (line.startsWith('data:')) {
            const data = JSON.parse(line.substring(6));
            if (data.content) {
              fullAnswer += data.content;
              onChunk(data.content);
            }
            if (data.status === 'completed') {
              onComplete(fullAnswer);
            }
          } else if (line.startsWith('event: error')) {
            // 下一行是错误data
          }
        });
      });
    },
    fail: onError
  });
  
  return requestTask;
}

// 辅助函数：ArrayBuffer转字符串
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
```

---

## 性能优化建议

1. **缓存标签列表**: 前端缓存标签列表5分钟，减少API调用
2. **分页加载**: 使用分页避免一次加载过多数据
3. **批量操作**: 更新多个标签时使用PUT接口一次性更新
4. **索引优化**: 数据库已创建复合索引，查询性能优化

---

## 安全说明

1. **权限验证**: 所有操作都验证OpenID，确保用户只能操作自己的数据
2. **SQL注入防护**: 使用参数化查询
3. **XSS防护**: 对用户输入进行转义
4. **配额限制**: 免费用户限制10条，防止滥用
5. **流式输出**: 监听连接状态，避免资源泄漏

---

## 数据库表结构

### favorites 表

```sql
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer LONGTEXT NOT NULL,
    source_type ENUM('knowledge', 'resume', 'custom') NOT NULL,
    source_id VARCHAR(100),
    source_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_openid_created (openid, created_at DESC)
);
```

### tags 表

```sql
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    openid VARCHAR(100) NOT NULL,
    use_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_openid_name (openid, name)
);
```

### favorite_tags 表

```sql
CREATE TABLE favorite_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    favorite_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_favorite_tag (favorite_id, tag_id),
    FOREIGN KEY (favorite_id) REFERENCES favorites(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

## 更新日志

### v1.0.0 (2025-12-08)

- ✅ 初始版本发布
- ✅ 支持收藏CRUD操作
- ✅ 支持标签管理
- ✅ 支持AI流式生成答案
- ✅ 支持会员配额管理
- ✅ 支持分页和标签筛选

---

## 技术支持

如有问题，请查看：
- 部署文档: `server/docs/DEPLOYMENT_GUIDE.md`
- 错误日志: `pm2 logs ai-interview-helper --err`
- 数据库状态: `mysql -u root -p -e "USE ai_interview_helper; SELECT COUNT(*) FROM favorites;"`
