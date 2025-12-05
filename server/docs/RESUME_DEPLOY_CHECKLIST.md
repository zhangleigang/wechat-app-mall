# ✅ 简历管理功能部署检查清单

> 快速参考：按顺序完成每一项，确保部署成功

---

## 📋 部署前准备

- [ ] 已获取 DeepSeek API Key（https://platform.deepseek.com/）
- [ ] 服务器磁盘空间充足（至少 1GB）
- [ ] 已备份现有代码和数据库
- [ ] 确认当前服务正常运行

---

## 🚀 部署步骤

### 1️⃣ 本地操作

- [ ] 执行 `cd server && bash pack.sh` 打包
- [ ] 执行 `scp ai-interview-helper-server-*.tar.gz root@47.95.196.190:/root/` 上传

### 2️⃣ 服务器备份

```bash
# 备份代码
cp -r ai-interview-helper-server ai-interview-helper-server-backup-$(date +%Y%m%d)

# 备份数据库
mysqldump -u root -p ai_interview_helper > ai_interview_helper_backup_$(date +%Y%m%d).sql
```

- [ ] 代码已备份
- [ ] 数据库已备份

### 3️⃣ 更新代码

```bash
# 解压到临时目录
tar -xzf ai-interview-helper-server-*.tar.gz -C ai-interview-helper-server-temp

# 保存 .env
cp ai-interview-helper-server/.env ai-interview-helper-server/.env.backup

# 更新文件
cd ai-interview-helper-server-temp
cp -r src ../ai-interview-helper-server/
cp -r database ../ai-interview-helper-server/
cp -r scripts ../ai-interview-helper-server/
cp package.json ../ai-interview-helper-server/
cp server.js ../ai-interview-helper-server/
```

- [ ] 代码已更新
- [ ] .env 配置已保留

### 4️⃣ 数据库迁移

```bash
cd /root/ai-interview-helper-server
mysql -u root -p ai_interview_helper < database/init-resumes.sql
```

- [ ] resumes 表已创建
- [ ] 执行 `mysql -u root -p -e "USE ai_interview_helper; DESCRIBE resumes;"` 验证成功

### 5️⃣ 配置 DeepSeek

```bash
vi .env
```

添加：
```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] API Key 已添加到 .env
- [ ] 保存并退出（:wq）

### 6️⃣ 创建上传目录

```bash
mkdir -p uploads/resumes
chmod 755 uploads uploads/resumes
```

- [ ] 目录已创建
- [ ] 权限已设置（755）

### 7️⃣ 安装依赖

```bash
npm install
```

- [ ] multer 已安装
- [ ] pdf-parse 已安装
- [ ] mammoth 已安装

### 8️⃣ 重启服务

```bash
pm2 restart ai-interview-helper
```

- [ ] 服务已重启
- [ ] 执行 `pm2 logs ai-interview-helper --lines 20` 无错误

### 9️⃣ 验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# 简历列表
curl "http://localhost:3000/api/resume/list?openid=test"

# 外网访问
curl https://api.feelnow.cn:8443/health
```

- [ ] 健康检查返回 `{"status":"ok"}`
- [ ] 简历列表返回 `{"code":0}`
- [ ] 外网可访问

---

## 🧪 功能测试

### 测试上传（使用 Postman 或小程序）

- [ ] 上传 PDF 文件成功
- [ ] 上传 Word 文件成功
- [ ] 上传 Markdown 文件成功
- [ ] 文件大小超限被拒绝（>10MB）
- [ ] 非会员上传被拒绝

### 测试列表

- [ ] 获取简历列表成功
- [ ] 列表显示正确的文件名和时间
- [ ] total 和 limit 字段正确

### 测试删除

- [ ] 删除简历成功
- [ ] 数据库记录已删除
- [ ] 文件已从服务器删除
- [ ] 无权限删除他人简历被拒绝

### 测试 AI 问答

- [ ] 发送问题获得回复
- [ ] 回复内容相关且专业
- [ ] 对话历史正确传递
- [ ] 非会员问答被拒绝

---

## 📊 监控检查

```bash
# 服务状态
pm2 status

# 实时日志
pm2 logs ai-interview-helper

# 磁盘空间
df -h

# uploads 目录大小
du -sh uploads/
```

- [ ] PM2 状态显示 online
- [ ] 日志无错误信息
- [ ] 磁盘空间充足
- [ ] uploads 目录可访问

---

## 🔍 问题排查

如果遇到问题，按顺序检查：

### 1. 服务无法启动

```bash
# 查看错误日志
pm2 logs ai-interview-helper --err

# 手动启动测试
cd /root/ai-interview-helper-server
node server.js
```

### 2. 数据库错误

```bash
# 检查表是否存在
mysql -u root -p -e "USE ai_interview_helper; SHOW TABLES;"

# 检查 .env 配置
cat .env | grep DB_
```

### 3. 文件上传失败

```bash
# 检查目录
ls -la uploads/

# 检查权限
ls -la uploads/resumes/

# 重新创建
mkdir -p uploads/resumes
chmod 755 uploads uploads/resumes
```

### 4. DeepSeek API 错误

```bash
# 检查配置
cat .env | grep DEEPSEEK

# 测试 API Key（在本地）
curl https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

---

## 🔄 回滚步骤（如需要）

```bash
# 停止服务
pm2 stop ai-interview-helper

# 恢复代码
rm -rf ai-interview-helper-server
mv ai-interview-helper-server-backup-YYYYMMDD ai-interview-helper-server

# 恢复数据库
mysql -u root -p -e "USE ai_interview_helper; DROP TABLE IF EXISTS resumes;"

# 重启服务
pm2 start ai-interview-helper-server/server.js --name ai-interview-helper
```

---

## ✅ 部署完成确认

全部完成后，确认以下内容：

- [ ] 所有 API 接口正常响应
- [ ] 文件上传、列表、删除功能正常
- [ ] AI 问答功能正常
- [ ] 会员验证正常工作
- [ ] 日志无错误
- [ ] 外网可访问
- [ ] 已清理临时文件（ai-interview-helper-server-temp）

---

## 📝 部署记录

**部署日期**: _______________

**部署人员**: _______________

**服务器**: 47.95.196.190

**版本**: v1.0.0

**备份位置**:
- 代码: `/root/ai-interview-helper-server-backup-YYYYMMDD`
- 数据库: `/root/ai_interview_helper_backup_YYYYMMDD.sql`

**遇到的问题**: 

_______________________________________________

**解决方案**: 

_______________________________________________

**部署耗时**: _______________ 分钟

---

## 📞 紧急联系

如遇到严重问题无法解决：

1. 立即执行回滚步骤
2. 查看详细日志：`pm2 logs ai-interview-helper --lines 200`
3. 检查数据库状态：`mysql -u root -p -e "SHOW PROCESSLIST;"`
4. 保存错误信息以便排查

---

**预计部署时间**: 15-20 分钟  
**建议部署时段**: 凌晨或低峰期  
**影响范围**: 无（不影响现有功能）
