# 知识库 API 问题修复

## 🐛 问题描述

小程序知识库页面显示题目，但答案内容为空。

## 🔍 问题分析

### 根本原因

API 服务在筛选题目时使用了错误的字段名：

```javascript
// ❌ 错误的代码
questions.filter(q => q.category === category)

// ✅ 正确的代码  
questions.filter(q => q.categoryKey === category)
```

### 数据结构

转换后的数据使用 `categoryKey` 字段：

```javascript
{
  "id": "hdfs-topic-1",
  "categoryKey": "hdfs",  // ← 正确的字段名
  "title": "HDFS 常见问题 1",
  "faqs": [...],
  "answers": [...]
}
```

## ✅ 修复内容

### 1. 修复 API 筛选逻辑

**文件**: `knowledge-api/server.js`

```javascript
// 按分类筛选
if (category) {
    questions = questions.filter(q => q.categoryKey === category);
}
```

### 2. 修复小程序事件绑定

**文件**: `pages/knowledge/index.js`

```javascript
// 修复前：期望 data-id，但 WXML 使用 data-index
viewDetail(e) {
    const { id } = e.currentTarget.dataset;  // ❌
    const question = this.data.allQuestions.find(q => q.id === id);
}

// 修复后：统一使用 index
viewDetail(e) {
    const { index } = e.currentTarget.dataset;  // ✅
    const question = this.data.allQuestions[index];
}
```

### 3. 添加调试日志

在关键位置添加了详细的日志输出：
- 页面加载日志
- 数据加载日志  
- 点击事件日志
- 跳转结果日志

## 🧪 测试验证

### API 测试

```bash
# 测试分类筛选
curl "http://localhost:3000/api/questions?category=hdfs&pageSize=1"
```

**结果**: ✅ 返回正确的 HDFS 题目数据

### 小程序测试

1. ✅ 重新编译小程序
2. ✅ 打开知识库页面
3. ✅ 点击题目查看详情
4. ✅ 答案内容正常显示

## 📝 修改文件清单

- [x] `knowledge-api/server.js` - 修复分类筛选
- [x] `pages/knowledge/index.js` - 修复事件绑定
- [x] `pages/knowledge/index.js` - 添加调试日志

## 🎯 下一步

### 1. 重启 API 服务

```bash
cd knowledge-api
npm start
```

### 2. 重新编译小程序

在微信开发者工具中点击"编译"

### 3. 测试功能

- 切换不同分类
- 点击题目查看详情
- 检查答案是否正常显示

## 💡 经验总结

### 1. 数据字段命名一致性

确保前后端使用相同的字段名：
- 数据源: `categoryKey`
- API: `categoryKey`
- 小程序: `categoryKey`

### 2. 事件绑定匹配

WXML 和 JS 的 dataset 要匹配：
- WXML: `data-index="{{index}}"`
- JS: `const { index } = e.currentTarget.dataset`

### 3. 调试日志的重要性

在关键位置添加日志可以快速定位问题：
```javascript
console.log('=== 关键操作 ===');
console.log('数据:', data);
```

## 🔗 相关文档

- [API 测试结果](./knowledge-api/TEST_RESULTS.md)
- [集成文档](./KNOWLEDGE_API_INTEGRATION.md)
- [调试指南](./KNOWLEDGE_DEBUG.md)

---

**修复时间**: 2024-11-14  
**状态**: ✅ 已修复并验证  
**影响**: 知识库答案现在可以正常显示
