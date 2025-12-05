# 简历管理功能测试指南

本文档提供简历管理功能的完整测试指南，包括后端API测试、前端功能测试和集成测试。

## 目录

- [后端API测试](#后端api测试)
- [前端功能测试](#前端功能测试)
- [集成测试](#集成测试)
- [测试环境准备](#测试环境准备)
- [常见问题](#常见问题)

---

## 后端API测试

### 自动化测试

使用提供的测试脚本进行自动化测试：

```bash
cd server

# 安装依赖（如果还没安装）
npm install

# 运行测试脚本
node test-resume-api.js
```

### 环境变量配置

可以通过环境变量自定义测试配置：

```bash
# 自定义API地址
TEST_API_URL=http://localhost:3000 node test-resume-api.js

# 自定义测试OpenID
TEST_OPENID=my_test_openid node test-resume-api.js
```

### 测试覆盖范围

自动化测试脚本覆盖以下场景：

#### 1. 上传接口测试
- ✅ 成功上传简历（Markdown格式）
- ✅ 文件格式错误（.txt文件）
- ✅ 文件过大（>10MB）
- ✅ 缺少OpenID参数

#### 2. 列表查询测试
- ✅ 成功获取简历列表
- ✅ 缺少OpenID参数

#### 3. 详情查询测试
- ✅ 成功获取简历详情
- ✅ 简历不存在
- ✅ 权限验证（OpenID不匹配）

#### 4. AI问答测试
- ✅ 成功进行AI问答
- ✅ 缺少问题参数
- ✅ 权限验证（OpenID不匹配）

#### 5. 删除接口测试
- ✅ 成功删除简历
- ✅ 简历不存在
- ✅ 权限验证（OpenID不匹配）

### 手动测试

使用 Postman 或 curl 进行手动测试：

#### 上传简历

```bash
curl -X POST http://localhost:3000/api/resume/upload \
  -F "file=@/path/to/resume.pdf" \
  -F "openid=test_openid"
```

#### 获取简历列表

```bash
curl -X GET "http://localhost:3000/api/resume/list?openid=test_openid"
```

#### 获取简历详情

```bash
curl -X GET "http://localhost:3000/api/resume/123?openid=test_openid"
```

#### AI问答

```bash
curl -X POST http://localhost:3000/api/resume/chat \
  -H "Content-Type: application/json" \
  -d '{
    "openid": "test_openid",
    "resumeId": 123,
    "question": "简历的主要亮点是什么？",
    "conversationHistory": []
  }'
```

#### 删除简历

```bash
curl -X DELETE http://localhost:3000/api/resume/123 \
  -H "Content-Type: application/json" \
  -d '{"openid": "test_openid"}'
```

---

## 前端功能测试

### 测试环境准备

1. 在微信开发者工具中打开项目
2. 确保后端服务正在运行
3. 配置测试账号（需要有效的会员状态）

### 测试清单

#### 1. 简历上传功能

**测试步骤：**
1. 进入简历解读页面
2. 点击"上传简历"按钮
3. 选择文件（PDF/Word/Markdown）
4. 等待上传完成

**预期结果：**
- ✅ 文件选择器正常打开
- ✅ 支持的格式可以上传
- ✅ 不支持的格式显示错误提示
- ✅ 文件过大（>10MB）显示错误提示
- ✅ 上传成功后显示成功提示
- ✅ 简历列表自动刷新
- ✅ 新上传的简历自动被选中

**边界测试：**
- 上传第3个简历后，上传按钮应该隐藏
- 尝试上传第4个简历时，应显示"已达上限"提示

#### 2. 简历列表显示

**测试步骤：**
1. 进入简历解读页面
2. 观察简历列表区域

**预期结果：**
- ✅ 显示所有已上传的简历
- ✅ 每个简历卡片显示文件名和上传时间
- ✅ 当前选中的简历有高亮显示
- ✅ 列表可以横向滚动（如果简历较多）
- ✅ 空列表时显示上传引导

#### 3. 简历选择切换

**测试步骤：**
1. 点击不同的简历卡片
2. 观察界面变化

**预期结果：**
- ✅ 点击后简历卡片高亮
- ✅ 显示"已切换简历"提示
- ✅ 对话历史被清空
- ✅ 预设问题区域正常显示
- ✅ 有触觉反馈

#### 4. 简历删除功能

**测试步骤：**
1. 长按简历卡片
2. 选择"删除简历"
3. 确认删除

**预期结果：**
- ✅ 长按后显示操作菜单
- ✅ 显示删除确认对话框
- ✅ 确认后简历被删除
- ✅ 简历列表自动刷新
- ✅ 如果删除的是当前选中简历，activeResumeId被清空
- ✅ 有触觉反馈

#### 5. 预设问题功能

**测试步骤：**
1. 选择一个简历
2. 点击预设问题按钮

**预期结果：**
- ✅ 问题自动填入输入框
- ✅ 自动发送到AI
- ✅ 收到AI回复
- ✅ 没有选中简历时，点击预设问题显示提示

#### 6. AI问答功能

**测试步骤：**
1. 选择一个简历
2. 在输入框输入问题
3. 点击发送

**预期结果：**
- ✅ 用户消息显示在对话区域
- ✅ 显示"发送中"状态
- ✅ 收到AI回复并显示
- ✅ 对话历史正确保存
- ✅ 没有选中简历时，发送按钮被禁用或显示提示

#### 7. 对话历史管理

**测试步骤：**
1. 进行几轮对话
2. 切换简历
3. 重新进入页面

**预期结果：**
- ✅ 切换简历时对话历史被清空
- ✅ 重新进入页面时加载最近24小时的对话
- ✅ 对话历史与resumeId关联正确

#### 8. 错误处理

**测试场景：**
- 网络断开时上传简历
- 网络断开时发送问题
- 会员过期时使用功能
- 未登录时使用功能

**预期结果：**
- ✅ 显示友好的错误提示
- ✅ 网络错误时提供重试选项
- ✅ 会员过期时引导到购买页面
- ✅ 未登录时引导到登录页面

---

## 集成测试

### 完整流程测试

#### 场景1: 首次使用流程

**测试步骤：**
1. 新用户进入简历解读页面
2. 上传第一个简历
3. 使用预设问题进行分析
4. 查看AI回复
5. 继续提问
6. 导出对话记录

**预期结果：**
- ✅ 整个流程顺畅无阻
- ✅ 所有功能正常工作
- ✅ 对话记录正确保存和导出

#### 场景2: 多简历管理流程

**测试步骤：**
1. 上传3个不同的简历
2. 在不同简历之间切换
3. 对每个简历进行问答
4. 删除其中一个简历
5. 再上传一个新简历

**预期结果：**
- ✅ 可以成功上传3个简历
- ✅ 切换简历时对话历史正确清空
- ✅ 删除后可以继续上传
- ✅ 简历数量限制正确执行

#### 场景3: 边界情况测试

**测试步骤：**
1. 上传3个简历（达到上限）
2. 尝试上传第4个简历
3. 删除1个简历
4. 再次上传新简历
5. 快速连续点击上传按钮
6. 快速连续发送多个问题

**预期结果：**
- ✅ 达到上限时正确提示
- ✅ 删除后可以继续上传
- ✅ 快速操作不会导致错误
- ✅ 并发请求正确处理

#### 场景4: 网络异常测试

**测试步骤：**
1. 断开网络
2. 尝试上传简历
3. 恢复网络
4. 重试上传
5. 断开网络
6. 尝试发送问题
7. 恢复网络
8. 重试发送

**预期结果：**
- ✅ 网络错误时显示友好提示
- ✅ 提供重试选项
- ✅ 重试后功能正常

---

## 测试环境准备

### 后端环境

1. **数据库准备**
   ```bash
   # 确保MySQL服务运行
   mysql -u root -p
   
   # 创建测试数据库（如果需要）
   CREATE DATABASE ai_interview_helper_test;
   
   # 运行初始化脚本
   source database/init.sql
   source database/init-resumes.sql
   ```

2. **环境变量配置**
   ```bash
   # 复制环境变量示例
   cp .env.example .env
   
   # 编辑.env文件，配置：
   # - 数据库连接信息
   # - DeepSeek API密钥
   # - 其他必要配置
   ```

3. **启动服务**
   ```bash
   npm install
   npm start
   ```

### 前端环境

1. **配置API地址**
   ```javascript
   // miniprogram/config.js
   module.exports = {
     // 开发环境使用本地API
     resumeApiUrl: 'http://localhost:3000',
     // 或使用测试服务器
     // resumeApiUrl: 'https://test-api.example.com'
   }
   ```

2. **准备测试账号**
   - 确保有有效的会员账号
   - 或在数据库中手动添加测试会员

3. **打开微信开发者工具**
   - 导入项目
   - 编译并运行

### 测试文件准备

在 `server/test-files/` 目录下准备以下测试文件：

1. **test-resume.pdf** - 标准PDF简历
2. **test-resume.docx** - Word格式简历
3. **test-resume.md** - Markdown格式简历
4. **large-file.md** - 大文件（>10MB）
5. **test.txt** - 不支持的格式

---

## 常见问题

### Q1: 测试脚本运行失败

**可能原因：**
- 服务器未启动
- 数据库连接失败
- 环境变量未配置

**解决方法：**
```bash
# 检查服务器状态
curl http://localhost:3000/api/health

# 检查数据库连接
mysql -u root -p -e "SHOW DATABASES;"

# 检查环境变量
cat .env
```

### Q2: 文件上传失败

**可能原因：**
- 文件路径不正确
- 文件权限问题
- uploads目录不存在

**解决方法：**
```bash
# 创建uploads目录
mkdir -p uploads/resumes

# 设置权限
chmod 755 uploads/resumes
```

### Q3: AI问答返回错误

**可能原因：**
- DeepSeek API密钥无效
- API配额用尽
- 网络连接问题

**解决方法：**
```bash
# 检查API密钥
echo $DEEPSEEK_API_KEY

# 测试API连接
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

### Q4: 前端无法连接后端

**可能原因：**
- API地址配置错误
- CORS配置问题
- 网络防火墙

**解决方法：**
```javascript
// 检查config.js中的API地址
console.log(CONFIG.resumeApiUrl)

// 检查CORS配置（server.js）
app.use(cors({
  origin: '*',
  credentials: true
}))
```

### Q5: 会员验证失败

**可能原因：**
- 测试账号没有会员权限
- 会员已过期
- OpenID不匹配

**解决方法：**
```sql
-- 手动添加测试会员
INSERT INTO members (openid, expire_date) 
VALUES ('test_openid', DATE_ADD(NOW(), INTERVAL 30 DAY));

-- 或更新现有会员
UPDATE members 
SET expire_date = DATE_ADD(NOW(), INTERVAL 30 DAY) 
WHERE openid = 'test_openid';
```

---

## 测试报告模板

### 测试执行记录

| 测试项 | 测试结果 | 备注 |
|--------|---------|------|
| 后端API测试 | ✅ 通过 | 15/15 |
| 前端功能测试 | ✅ 通过 | 8/8 |
| 集成测试 | ✅ 通过 | 4/4 |

### 发现的问题

| 问题描述 | 严重程度 | 状态 | 解决方案 |
|---------|---------|------|---------|
| 示例问题 | 高/中/低 | 已修复/待修复 | 解决方案描述 |

### 测试结论

- [ ] 所有测试通过，功能正常
- [ ] 存在问题，需要修复
- [ ] 需要进一步测试

---

## 持续集成

### 自动化测试集成

可以将测试脚本集成到CI/CD流程中：

```yaml
# .github/workflows/test.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'
    
    - name: Install dependencies
      run: |
        cd server
        npm install
    
    - name: Run tests
      run: |
        cd server
        node test-resume-api.js
      env:
        TEST_API_URL: ${{ secrets.TEST_API_URL }}
        TEST_OPENID: ${{ secrets.TEST_OPENID }}
```

---

## 总结

本测试指南涵盖了简历管理功能的所有测试场景。建议在以下情况下执行完整测试：

1. 新功能开发完成后
2. 代码重构后
3. 部署到生产环境前
4. 发现bug修复后
5. 定期回归测试（每周/每月）

确保所有测试通过后再部署到生产环境。
