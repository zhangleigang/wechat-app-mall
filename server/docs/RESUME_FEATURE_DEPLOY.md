# 📄 简历管理功能部署指引

> **重要提示**：本指引专门针对简历管理与智能问答功能的部署，不会影响现有的后端服务。

## 📋 部署前检查清单

在开始部署前，请确认以下内容：

- [ ] 已有运行中的 `ai-interview-helper` 服务（统一后端）
- [ ] MySQL 数据库正常运行
- [ ] 已获取 DeepSeek API Key（从 https://platform.deepseek.com/ 获取）
- [ ] 服务器有足够的磁盘空间（至少 1GB 用于存储简历文件）

## 🎯 部署概览

简历管理功能是在现有统一后端基础上的**增量更新**，包括：

1. ✅ 新增 `resumes` 数据表
2. ✅ 新增简历上传、管理、问答 API
3. ✅ 新增 DeepSeek AI 集成
4. ✅ 新增文件上传和解析功能

**不会影响**：
- ❌ 现有的认证、会员、知识库功能
- ❌ 现有的数据库表和数据
- ❌ Nginx 配置（无需修改）

---

## 📦 步骤 1: 准备部署包

### 1.1 本地打包（在你的开发机器上）

```bash
cd server
bash pack.sh
```

这会生成类似 `ai-interview-helper-server-20251205_XXXXXX.tar.gz` 的文件。

### 1.2 上传到服务器

```bash
scp ai-interview-helper-server-*.tar.gz root@47.95.196.190:/root/
```

---

## 🔧 步骤 2: 服务器端部署

### 2.1 SSH 登录服务器

```bash
ssh root@47.95.196.190
```

### 2.2 备份现有服务（重要！）

```bash
# 备份当前运行的代码
cd /root
cp -r ai-interview-helper-server ai-interview-helper-server-backup-$(date +%Y%m%d)

# 备份数据库
mysqldump -u root -p ai_interview_helper > ai_interview_helper_backup_$(date +%Y%m%d).sql
```

### 2.3 解压新版本

```bash
cd /root
tar -xzf ai-interview-helper-server-*.tar.gz -C ai-interview-helper-server-temp
```

### 2.4 更新代码（保留配置）

```bash
# 保存现有的 .env 配置
cp ai-interview-helper-server/.env ai-interview-helper-server/.env.backup

# 更新代码文件
cd ai-interview-helper-server-temp
cp -r src ../ai-interview-helper-server/
cp -r database ../ai-interview-helper-server/
cp -r scripts ../ai-interview-helper-server/
cp package.json ../ai-interview-helper-server/
cp server.js ../ai-interview-helper-server/

# 回到主目录
cd ../ai-interview-helper-server
```

---

## 🗄️ 步骤 3: 数据库迁移

### 3.1 创建 resumes 表
```

### 3.2 验证表创建成功

```bash
mysql -u root -p -e "USE ai_interview_helper; SHOW TABLES; DESCRIBE resumes;"
```

你应该看到 `resumes` 表及其字段结构。

---

## 🔑 步骤 4: 配置 DeepSeek API

### 4.1 编辑 .env 文件

```bash
vi .env
```

### 4.2 添加 DeepSeek API Key

在 `.env` 文件末尾添加：

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**获取 API Key**：
1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制并粘贴到 .env 文件

### 4.3 保存并退出

按 `ESC`，输入 `:wq`，按回车保存。

---

## 📁 步骤 5: 创建上传目录

### 5.1 创建目录结构

```bash
cd /root/ai-interview-helper-server
mkdir -p uploads/resumes
chmod 755 uploads
chmod 755 uploads/resumes
```

### 5.2 验证目录权限

```bash
ls -la uploads/
```

应该显示：
```
drwxr-xr-x 3 root root 4096 ... uploads
drwxr-xr-x 2 root root 4096 ... resumes
```

---

## 📦 步骤 6: 安装新依赖

```bash
cd /root/ai-interview-helper-server
npm install
```

这会安装以下新增的依赖：
- `multer` - 文件上传处理
- `pdf-parse` - PDF 解析
- `mammoth` - Word 文档解析

---

## 🚀 步骤 7: 重启服务

### 7.1 重启 PM2 服务

```bash
pm2 restart ai-interview-helper
```

### 7.2 查看启动日志

```bash
pm2 logs ai-interview-helper --lines 50
```

确保没有错误信息，应该看到：
```
🚀 AI面试助手后端服务已启动
📡 服务地址: http://localhost:3000
```

---

## ✅ 步骤 8: 验证部署

### 8.1 测试健康检查

```bash
curl http://localhost:3000/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T...",
  "env": "production"
}
```

### 8.2 测试简历 API（需要有效的 OpenID）

```bash
# 测试获取简历列表
curl "http://localhost:3000/api/resume/list?openid=test_openid"
```

应该返回：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "resumes": [],
    "total": 0,
    "limit": 3
  }
}
```

### 8.3 测试外网访问

```bash
curl https://api.feelnow.cn:8443/health
```

---

## 🔍 步骤 9: 监控和日志

### 9.1 实时查看日志

```bash
pm2 logs ai-interview-helper
```

### 9.2 查看服务状态

```bash
pm2 status
```

### 9.3 查看错误日志

```bash
pm2 logs ai-interview-helper --err
```

---

## 🧪 步骤 10: 功能测试

### 10.1 测试文件上传（需要实际文件）

使用 Postman 或小程序前端测试：

**接口**: `POST https://api.feelnow.cn:8443/api/resume/upload`

**Headers**:
```
Content-Type: multipart/form-data
```

**Body** (form-data):
```
file: [选择一个 PDF/Word/Markdown 文件]
openid: [有效的会员 OpenID]
```

### 10.2 测试 AI 问答

**接口**: `POST https://api.feelnow.cn:8443/api/resume/chat`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "openid": "有效的会员OpenID",
  "resumeId": 1,
  "question": "简历最大的亮点是什么？",
  "conversationHistory": []
}
```

---

## 🔄 回滚步骤（如果出现问题）

### 方案 1: 快速回滚代码

```bash
# 停止服务
pm2 stop ai-interview-helper

# 恢复备份
cd /root
rm -rf ai-interview-helper-server
mv ai-interview-helper-server-backup-YYYYMMDD ai-interview-helper-server

# 重启服务
pm2 start ai-interview-helper-server/server.js --name ai-interview-helper
```

### 方案 2: 回滚数据库

```bash
# 删除 resumes 表
mysql -u root -p -e "USE ai_interview_helper; DROP TABLE IF EXISTS resumes;"

# 恢复数据库备份（如果需要）
mysql -u root -p ai_interview_helper < ai_interview_helper_backup_YYYYMMDD.sql
```

---

## ⚠️ 常见问题排查

### Q1: 文件上传失败 - "ENOENT: no such file or directory"

**原因**: uploads 目录不存在

**解决**:
```bash
cd /root/ai-interview-helper-server
mkdir -p uploads/resumes
chmod 755 uploads uploads/resumes
pm2 restart ai-interview-helper
```

### Q2: DeepSeek API 调用失败 - "API 密钥无效"

**原因**: DEEPSEEK_API_KEY 未配置或无效

**解决**:
```bash
vi .env
# 检查 DEEPSEEK_API_KEY 是否正确
# 确保没有多余的空格或引号

pm2 restart ai-interview-helper
```

### Q3: 数据库错误 - "Table 'resumes' doesn't exist"

**原因**: 数据库迁移未执行

**解决**:
```bash
mysql -u root -p ai_interview_helper < database/init-resumes.sql
```

### Q4: 文件解析失败 - "pdf-parse 模块未找到"

**原因**: npm 依赖未安装

**解决**:
```bash
cd /root/ai-interview-helper-server
npm install
pm2 restart ai-interview-helper
```

### Q5: 会员验证失败

**原因**: members 表中没有该用户的会员记录

**解决**:
```bash
# 检查会员状态
mysql -u root -p -e "USE ai_interview_helper; SELECT * FROM members WHERE openid='用户的OpenID';"

# 如果需要，手动添加测试会员
mysql -u root -p -e "USE ai_interview_helper; INSERT INTO members (openid, expire_date) VALUES ('test_openid', DATE_ADD(NOW(), INTERVAL 30 DAY));"
```

---

## 📊 性能监控

### 监控磁盘空间

```bash
# 查看 uploads 目录大小
du -sh /root/ai-interview-helper-server/uploads/

# 查看磁盘使用情况
df -h
```

### 监控内存使用

```bash
pm2 monit
```

### 清理旧文件（可选）

```bash
# 删除 30 天前的简历文件
find /root/ai-interview-helper-server/uploads/resumes/ -type f -mtime +30 -delete
```

---

## 🔒 安全建议

1. **限制文件大小**: 已在代码中限制为 10MB
2. **文件类型验证**: 已实现 MIME 类型检查
3. **权限控制**: 所有 API 都验证会员状态和 OpenID
4. **定期备份**: 建议每天备份数据库和 uploads 目录

```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * mysqldump -u root -pYourPassword ai_interview_helper > /root/backups/db_$(date +\%Y\%m\%d).sql
0 2 * * * tar -czf /root/backups/uploads_$(date +\%Y\%m\%d).tar.gz /root/ai-interview-helper-server/uploads/
```

---

## 📝 部署检查清单

完成部署后，请逐项检查：

- [ ] 代码已更新到最新版本
- [ ] .env 文件包含 DEEPSEEK_API_KEY
- [ ] resumes 表已创建成功
- [ ] uploads/resumes 目录已创建且权限正确
- [ ] npm 依赖已安装（multer, pdf-parse, mammoth）
- [ ] PM2 服务已重启
- [ ] 健康检查接口返回正常
- [ ] 简历列表接口返回正常
- [ ] 日志中无错误信息
- [ ] 外网可以访问 API
- [ ] 已备份原有代码和数据库

---

## 📞 技术支持

如果遇到问题：

1. **查看日志**: `pm2 logs ai-interview-helper --err`
2. **检查配置**: `cat .env`
3. **测试数据库**: `mysql -u root -p -e "USE ai_interview_helper; SHOW TABLES;"`
4. **检查端口**: `netstat -tlnp | grep 3000`

---

## 🎉 部署完成

恭喜！简历管理功能已成功部署。

**下一步**：
1. 更新小程序前端代码（实现简历上传和问答界面）
2. 测试完整的用户流程
3. 监控 DeepSeek API 使用量和费用

**API 文档**: 参考 `server/docs/RESUME_API.md`（如果需要可以创建）

---

**部署时间**: 预计 15-20 分钟  
**影响范围**: 无，不影响现有功能  
**回滚时间**: 5 分钟以内
