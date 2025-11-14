# 知识库 API 集成完成

## 📦 已完成的修改

### 1. 配置文件更新 (`config.js`)

添加了知识库 API 配置：

```javascript
{
  // 知识库 API 配置
  knowledgeApiUrl: 'http://localhost:3000/api', // 开发环境
  // knowledgeApiUrl: 'https://api.yourdomain.com/api', // 生产环境
  useLocalKnowledge: false // false: 使用 API, true: 使用本地数据
}
```

### 2. API 工具更新 (`utils/knowledge-api.js`)

- ✅ 从配置文件读取 API 地址
- ✅ 支持缓存机制
- ✅ 支持版本检查
- ✅ 自动降级处理

### 3. 知识库页面更新 (`pages/knowledge/index.js`)

**新功能**：
- ✅ 从 API 加载分类和题目
- ✅ 支持下拉刷新
- ✅ 自动降级到本地数据
- ✅ 加载状态提示
- ✅ 错误处理

**备份文件**：
- `pages/knowledge/index.backup.js` - 原始版本（使用本地数据）

## 🚀 使用方法

### 开发环境

1. **启动 API 服务**
   ```bash
   cd knowledge-api
   npm start
   ```

2. **配置小程序**
   
   在微信开发者工具中：
   - 打开 "详情" -> "本地设置"
   - 勾选 "不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

3. **编译运行**
   
   重新编译小程序，知识库页面会自动从 API 加载数据

### 生产环境

1. **部署 API 服务**
   
   参考 `knowledge-api/DEPLOYMENT.md`

2. **修改配置**
   
   在 `config.js` 中修改：
   ```javascript
   knowledgeApiUrl: 'https://api.yourdomain.com/api'
   ```

3. **配置域名白名单**
   
   在微信公众平台 -> 开发 -> 开发管理 -> 服务器域名中添加：
   ```
   request合法域名: https://api.yourdomain.com
   ```

## 🔄 降级方案

如果 API 加载失败，系统会自动降级到本地数据：

1. **自动降级**
   - API 请求失败时自动切换
   - 用户无感知
   - 显示提示信息

2. **手动降级**
   
   在 `config.js` 中设置：
   ```javascript
   useLocalKnowledge: true
   ```

## 📊 数据流程

### API 模式
```
小程序启动
    ↓
检查缓存
    ↓
[有缓存] → 使用缓存数据 → 后台检查更新
    ↓
[无缓存] → 从 API 加载 → 缓存到本地
    ↓
显示数据
```

### 降级模式
```
API 请求失败
    ↓
检查本地数据
    ↓
[有本地数据] → 使用本地数据 → 显示提示
    ↓
[无本地数据] → 显示错误信息
```

## 🎯 功能对比

| 功能 | 本地数据模式 | API 模式 |
|------|-------------|---------|
| 首次加载速度 | ⚡ 极快 | 🐢 较慢（1-2秒） |
| 后续加载速度 | ⚡ 极快 | ⚡ 极快（有缓存） |
| 代码包大小 | ❌ 大（2MB） | ✅ 小（~800KB） |
| 数据更新 | ❌ 需要发版 | ✅ 实时更新 |
| 离线访问 | ✅ 支持 | ✅ 支持（有缓存） |
| 网络依赖 | ✅ 无 | ⚠️ 首次需要 |

## 🔧 调试技巧

### 1. 查看 API 请求

在小程序控制台中查看：
```javascript
// 查看缓存
wx.getStorageSync('knowledge_full')

// 查看版本
wx.getStorageSync('knowledge_version')

// 清除缓存
wx.clearStorage()
```

### 2. 测试降级

临时关闭 API 服务，观察小程序是否自动降级

### 3. 查看日志

在控制台中查看：
- "从 API 加载成功" - API 模式
- "从本地加载成功" - 降级模式
- "降级到本地数据" - 自动降级

## ⚠️ 注意事项

### 1. 开发环境

- ✅ 必须勾选"不校验合法域名"
- ✅ API 服务必须运行在 localhost:3000
- ✅ 确保防火墙允许访问

### 2. 生产环境

- ⚠️ 必须使用 HTTPS
- ⚠️ 必须在微信公众平台配置域名白名单
- ⚠️ 建议使用 CDN 加速

### 3. 数据同步

- 📝 修改 `utils/knowledge.js` 后需要重新转换数据
- 📝 运行 `node convert-data.js` 更新 API 数据
- 📝 重启 API 服务

## 📝 常见问题

### Q1: 小程序显示"加载失败"？

**A**: 检查以下几点：
1. API 服务是否启动
2. 是否勾选"不校验合法域名"
3. 查看控制台错误信息

### Q2: 数据没有更新？

**A**: 
1. 清除小程序缓存：`wx.clearStorage()`
2. 重新编译小程序
3. 检查 API 服务的数据是否已更新

### Q3: 如何切换回本地数据模式？

**A**: 
在 `config.js` 中设置：
```javascript
useLocalKnowledge: true
```

### Q4: 生产环境如何配置？

**A**: 
1. 部署 API 服务到服务器
2. 配置 HTTPS 和域名
3. 修改 `config.js` 中的 `knowledgeApiUrl`
4. 在微信公众平台配置域名白名单

## 🎉 完成检查清单

- [x] API 服务启动成功
- [x] 配置文件已更新
- [x] 知识库页面已更新
- [x] 降级方案已实现
- [x] 缓存机制已实现
- [ ] 小程序测试通过
- [ ] 生产环境部署
- [ ] 域名白名单配置

## 📚 相关文档

- [API 服务文档](../knowledge-api/README.md)
- [快速开始](../knowledge-api/QUICK_START.md)
- [部署指南](../knowledge-api/DEPLOYMENT.md)
- [测试结果](../knowledge-api/TEST_RESULTS.md)

---

**更新时间**: 2024-11-14  
**状态**: ✅ 集成完成，等待测试  
**下一步**: 在小程序中测试 API 加载功能
