# 🚀 生产环境部署检查清单

## 概述

本文档提供简历管理功能的生产环境部署步骤和验证清单。

**部署时间**: 预计 15-20 分钟  
**服务器**: https://api.feelnow.cn:8443  
**数据库**: ai_interview_helper

---

## 前置条件

- [ ] 服务器访问权限（SSH）
- [ ] 数据库访问权限
- [ ] DeepSeek API 密钥
- [ ] 代码已打包（使用 `pack.sh`）

---

## 部署步骤

### 1. 服务器准备

#### 1.1 连接服务器

```bash
ssh root@api.feelnow.cn
```

#### 1.2 进入项目目录

```bash
cd /root/ai-interview-helper-server
# 或者你的实际部署目录
```

#### 1.3 备份当前版本（可选但推荐）

```bash
# 备份当前代码
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz src/ server.js package.json

# 备份数据库
mysqldump -u root -p ai_interview_helper > backup-db-$(date +%Y%m%d-%H%M%S).sql
```

---

### 2. 创建必要的目录

```bash
# 在项目根目录下创建
mkdir -p uploads/resumes
mkdir -p src/static/avatars
mkdir -p src/static/images

# 设置权限
chmod 755 uploads
chmod 755 uploads/resumes
chmod 755 src/static
chmod 755 src/static/avatars
chmod 755 src/static/images
```

**验证**:
```bash
ls -la uploads/
ls -la src/static/
```

预期输出应该显示这些目录存在且权限正确。

---

### 3. 配置 DeepSeek API 密钥

#### 3.1 编辑 .env 文件

```bash
vi .env
```

#### 3.2 添加/更新 DeepSeek 配置

确保 `.env` 文件包含以下内容：

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

**重要**: 将 `sk-your-actual-api-key-here` 替换为实际的 API 密钥。

#### 3.3 验证配置

```bash
# 检查配置是否存在
grep DEEPSEEK_API_KEY .env
```

---

### 4. 执行数据库迁移

#### 4.1 检查数据库连接

```bash
mysql -u root -p -e "USE ai_interview_helper; SHOW TABLES;"
```

#### 4.2 执行简历表创建脚本

```bash
mysql -u root -p ai_interview_helper < database/init-resumes.sql
```

#### 4.3 验证表结构

```bash
mysql -u root -p -e "USE ai_interview_helper; DESCRIBE resumes;"
```

**预期输出**:
```
+-------------+--------------+------+-----+-------------------+
| Field       | Type         | Null | Key | Default           |
+-------------+--------------+------+-----+-------------------+
| id          | int          | NO   | PRI | NULL              |
| openid      | varchar(100) | NO   | MUL | NULL              |
| filename    | varchar(255) | NO   |     | NULL              |
| file_path   | varchar(500) | NO   |     | NULL              |
| parsed_text | text         | YES  |     | NULL              |
| file_size   | int          | YES  |     | NULL              |
| upload_time | datetime     | YES  |     | CURRENT_TIMESTAMP |
| created_at  | datetime     | YES  |     | CURRENT_TIMESTAMP |
| updated_at  | datetime     | YES  |     | CURRENT_TIMESTAMP |
+-------------+--------------+------+-----+-------------------+
```

---

### 5. 部署后端代码

#### 5.1 上传代码包

在本地执行：

```bash
cd server
bash pack.sh
scp ai-interview-helper-server-*.tar.gz root@api.feelnow.cn:/root/
```

#### 5.2 解压并部署

在服务器上执行：

```bash
cd /root
tar -xzf ai-interview-helper-server-*.tar.gz
cd ai-interview-helper-server

# 安装依赖
npm install

# 或者使用部署脚本
bash deploy.sh
```

#### 5.3 重启服务

```bash
pm2 restart ai-interview-helper
```

#### 5.4 检查服务状态

```bash
pm2 status ai-interview-helper
pm2 logs ai-interview-helper --lines 50
```

**预期**: 服务状态为 `online`，日志中没有错误。

---

### 6. 验证后端功能

#### 6.1 健康检查

```bash
curl http://localhost:3000/health
```

**预期输出**:
```json
{"status":"ok","timestamp":1733380800000}
```

#### 6.2 测试简历列表接口

```bash
curl "http://localhost:3000/api/resume/list?openid=test_openid"
```

**预期输出**:
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

#### 6.3 检查文件上传目录权限

```bash
# 测试写入权限
touch uploads/resumes/test.txt
rm uploads/resumes/test.txt
```

如果没有错误，说明权限正确。

---

### 7. 部署前端代码

#### 7.1 更新小程序代码

在本地开发环境：

1. 确保 `miniprogram/config.js` 中的 API 地址正确：
   ```javascript
   baseUrl: 'https://api.feelnow.cn:8443'
   ```

2. 使用微信开发者工具打开项目

3. 点击"上传"按钮，填写版本号和备注

#### 7.2 提交审核

1. 登录微信公众平台
2. 进入"版本管理"
3. 提交审核

---

### 8. 功能验证

#### 8.1 简历上传测试

1. 打开小程序（体验版或正式版）
2. 进入"简历解读"页面
3. 点击上传按钮
4. 选择一个 PDF 或 Word 文件
5. 验证上传成功

**检查点**:
- [ ] 文件上传成功
- [ ] 简历列表显示新上传的文件
- [ ] 文件名和上传时间正确

#### 8.2 简历列表测试

1. 查看简历列表
2. 点击不同的简历卡片

**检查点**:
- [ ] 列表显示正确
- [ ] 选中状态高亮显示
- [ ] 可以切换不同简历

#### 8.3 AI 问答测试

1. 选择一个简历
2. 点击预设问题或输入自定义问题
3. 等待 AI 回复

**检查点**:
- [ ] 问题发送成功
- [ ] AI 回复正常显示
- [ ] 回复内容相关且专业

#### 8.4 简历删除测试

1. 长按某个简历卡片
2. 点击删除按钮
3. 确认删除

**检查点**:
- [ ] 删除成功
- [ ] 列表更新正确
- [ ] 服务器文件已删除

---

### 9. 性能和日志检查

#### 9.1 检查服务器资源

```bash
# CPU 和内存使用
top

# 磁盘空间
df -h

# 上传目录大小
du -sh uploads/
```

#### 9.2 检查应用日志

```bash
# 查看最近的日志
pm2 logs ai-interview-helper --lines 100

# 查看错误日志
pm2 logs ai-interview-helper --err --lines 50
```

**检查点**:
- [ ] 没有频繁的错误日志
- [ ] 没有内存泄漏警告
- [ ] API 响应时间正常

#### 9.3 检查数据库

```bash
mysql -u root -p -e "
USE ai_interview_helper;
SELECT COUNT(*) as total_resumes FROM resumes;
SELECT openid, COUNT(*) as count FROM resumes GROUP BY openid;
"
```

---

### 10. 监控设置

#### 10.1 设置 PM2 监控

```bash
# 启用 PM2 监控
pm2 monitor

# 设置自动重启
pm2 startup
pm2 save
```

#### 10.2 设置日志轮转

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 回滚计划

如果部署出现问题，按以下步骤回滚：

### 1. 回滚代码

```bash
# 停止当前服务
pm2 stop ai-interview-helper

# 恢复备份
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz

# 重启服务
pm2 restart ai-interview-helper
```

### 2. 回滚数据库

```bash
# 删除新表（如果需要）
mysql -u root -p -e "USE ai_interview_helper; DROP TABLE IF EXISTS resumes;"

# 恢复备份
mysql -u root -p ai_interview_helper < backup-db-YYYYMMDD-HHMMSS.sql
```

### 3. 清理文件

```bash
# 删除上传的文件
rm -rf uploads/resumes/*
```

---

## 常见问题

### Q1: 文件上传失败，提示"文件保存失败"

**解决方案**:
```bash
# 检查目录权限
ls -la uploads/resumes/

# 修复权限
chmod 755 uploads/resumes/
chown -R node:node uploads/
```

### Q2: AI 问答返回"AI 服务异常"

**解决方案**:
```bash
# 检查 DeepSeek API 密钥
grep DEEPSEEK_API_KEY .env

# 测试 API 连接
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

### Q3: 数据库连接失败

**解决方案**:
```bash
# 检查数据库配置
cat .env | grep DB_

# 测试连接
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
```

### Q4: PM2 服务无法启动

**解决方案**:
```bash
# 查看详细错误
pm2 logs ai-interview-helper --err

# 检查端口占用
netstat -tulpn | grep 3000

# 手动启动测试
node server.js
```

---

## 部署完成检查清单

在完成部署后，确认以下所有项目：

### 服务器配置
- [ ] uploads/resumes 目录已创建
- [ ] 目录权限正确（755）
- [ ] DeepSeek API 密钥已配置
- [ ] .env 文件配置正确

### 数据库
- [ ] resumes 表已创建
- [ ] 表结构正确
- [ ] 索引已创建

### 后端服务
- [ ] 代码已部署
- [ ] 依赖已安装
- [ ] PM2 服务运行正常
- [ ] 健康检查通过
- [ ] 日志无错误

### 前端应用
- [ ] 小程序代码已上传
- [ ] API 地址配置正确
- [ ] 审核已提交（如需要）

### 功能测试
- [ ] 简历上传功能正常
- [ ] 简历列表显示正确
- [ ] 简历切换功能正常
- [ ] AI 问答功能正常
- [ ] 简历删除功能正常

### 监控和日志
- [ ] PM2 监控已启用
- [ ] 日志轮转已配置
- [ ] 错误日志无异常

---

## 联系支持

如果遇到问题：

1. 查看日志: `pm2 logs ai-interview-helper`
2. 查看文档: `server/docs/`
3. 检查 API 文档: `server/docs/RESUME_API.md`

---

**部署完成时间**: ___________  
**部署人员**: ___________  
**验证人员**: ___________  
**备注**: ___________
