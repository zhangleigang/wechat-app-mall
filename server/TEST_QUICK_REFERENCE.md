# 测试快速参考卡

## 🚀 快速开始

### 运行后端API测试
```bash
cd server
node test-resume-api.js
```

### 前端快速测试（15分钟）
1. ✅ 上传1个简历
2. ✅ 点击预设问题
3. ✅ 发送自定义问题
4. ✅ 切换简历
5. ✅ 删除简历

---

## 📚 文档快速链接

| 文档 | 用途 | 位置 |
|------|------|------|
| 测试索引 | 所有测试文档概览 | [docs/TESTING_README.md](./docs/TESTING_README.md) |
| 测试指南 | 完整测试说明 | [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) |
| 前端清单 | 前端测试检查项 | [docs/FRONTEND_TEST_CHECKLIST.md](./docs/FRONTEND_TEST_CHECKLIST.md) |
| 集成测试 | 端到端测试场景 | [docs/INTEGRATION_TEST_GUIDE.md](./docs/INTEGRATION_TEST_GUIDE.md) |
| 测试总结 | 测试实施总结 | [TESTING_SUMMARY.md](./TESTING_SUMMARY.md) |

---

## 🎯 测试覆盖

### 后端API测试
- **15个测试用例**
- **5个API接口**
- **100%覆盖率**

### 前端功能测试
- **139个检查项**
- **12个功能模块**
- **100%覆盖率**

### 集成测试
- **12个测试场景**
- **53个测试步骤**
- **100%覆盖率**

---

## ⚡ 常用命令

### 环境准备
```bash
# 启动数据库
mysql.server start

# 启动后端
cd server && npm start

# 检查服务
curl http://localhost:3000/api/health
```

### 运行测试
```bash
# 后端API测试
node test-resume-api.js

# 自定义配置
TEST_API_URL=http://localhost:3000 node test-resume-api.js
TEST_OPENID=my_test_id node test-resume-api.js
```

### 清理数据
```bash
# 清理测试简历
mysql -u root -p -e "DELETE FROM ai_interview_helper.resumes WHERE openid LIKE 'test_%';"

# 清理测试会员
mysql -u root -p -e "DELETE FROM ai_interview_helper.members WHERE openid LIKE 'test_%';"

# 删除测试文件
rm -rf server/uploads/resumes/test_*
rm -rf server/test-files/
```

---

## 🐛 问题排查

### 测试脚本失败
```bash
# 1. 检查服务器
curl http://localhost:3000/api/health

# 2. 检查数据库
mysql -u root -p -e "SHOW DATABASES;"

# 3. 检查环境变量
cat .env

# 4. 重新安装依赖
npm install
```

### 文件上传失败
```bash
# 创建uploads目录
mkdir -p uploads/resumes

# 设置权限
chmod 755 uploads/resumes

# 检查磁盘空间
df -h
```

### AI问答失败
```bash
# 检查API密钥
echo $DEEPSEEK_API_KEY

# 测试API连接
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

---

## 📊 测试优先级

### P0 - 必须测试
- ✅ 简历上传
- ✅ 简历列表
- ✅ AI问答
- ✅ 简历删除

### P1 - 应该测试
- ✅ 简历切换
- ✅ 预设问题
- ✅ 对话历史
- ✅ 权限验证

### P2 - 可选测试
- ✅ 消息复制
- ✅ 对话导出
- ✅ UI动画
- ✅ 触觉反馈

---

## 🔍 测试检查点

### 上传功能
- [ ] PDF文件可以上传
- [ ] Word文件可以上传
- [ ] Markdown文件可以上传
- [ ] 不支持的格式显示错误
- [ ] 超过10MB显示错误
- [ ] 达到3个限制提示

### 列表功能
- [ ] 显示所有简历
- [ ] 显示文件名和时间
- [ ] 选中状态高亮
- [ ] 可以横向滚动

### 问答功能
- [ ] 预设问题可以点击
- [ ] 自定义问题可以发送
- [ ] AI回复正确显示
- [ ] 对话历史保存

### 删除功能
- [ ] 长按显示删除选项
- [ ] 确认后删除成功
- [ ] 列表自动刷新
- [ ] 文件被删除

---

## 📈 性能指标

| 指标 | 目标值 | 测试方法 |
|------|--------|---------|
| 页面加载 | < 2s | 计时器 |
| 简历上传 | < 5s | 计时器 |
| AI响应 | < 10s | 计时器 |
| 简历切换 | < 500ms | 计时器 |

---

## 🎓 测试技巧

### 1. 准备测试文件
```bash
# 创建测试目录
mkdir -p test-files

# 准备不同大小的文件
# - small.pdf (< 1MB)
# - medium.pdf (1-5MB)
# - large.pdf (5-10MB)
# - huge.pdf (> 10MB)
```

### 2. 模拟网络异常
- 使用微信开发者工具的网络模拟
- 使用Charles代理工具
- 手动断开网络连接

### 3. 测试边界情况
- 空文件
- 损坏的文件
- 特殊字符文件名
- 并发操作

### 4. 记录测试结果
- 截图保存关键步骤
- 记录错误信息
- 标注问题优先级

---

## 📞 获取帮助

### 查看文档
```bash
# 查看测试指南
cat docs/TESTING_GUIDE.md

# 查看前端清单
cat docs/FRONTEND_TEST_CHECKLIST.md

# 查看集成测试
cat docs/INTEGRATION_TEST_GUIDE.md
```

### 联系团队
- 开发团队：技术问题
- QA团队：测试问题
- 项目经理：流程问题

---

## ✅ 测试完成检查

### 后端测试
- [ ] 所有15个API测试通过
- [ ] 测试报告已生成
- [ ] 测试数据已清理

### 前端测试
- [ ] 核心功能测试完成
- [ ] 测试清单已填写
- [ ] 问题已记录

### 集成测试
- [ ] 完整流程测试完成
- [ ] 边界场景测试完成
- [ ] 测试报告已提交

---

**保存此文档以便快速参考！** 📌
