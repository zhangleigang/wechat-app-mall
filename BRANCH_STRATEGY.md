# Git 分支管理策略

## 分支结构

### 主要分支

- **`master`** - 生产环境分支，始终保持稳定可发布状态
- **`develop`** - 开发主分支，集成所有功能开发
- **`feature/*`** - 功能开发分支
- **`hotfix/*`** - 紧急修复分支
- **`release/*`** - 发布准备分支

### 当前分支说明

- **`master`** - v1.2.1 生产版本（微信支付版本）
- **`feature/wechat-contact-payment`** - 微信联系支付方案（当前分支）

## 分支命名规范

### 功能分支 (feature/*)
- `feature/wechat-contact-payment` - 微信联系支付方案
- `feature/ai-enhancement` - AI功能增强
- `feature/ui-optimization` - UI优化

### 修复分支 (hotfix/*)
- `hotfix/modal-text-limit` - 修复弹窗文本长度限制
- `hotfix/member-status-check` - 修复会员状态检查

### 发布分支 (release/*)
- `release/v1.3.0` - v1.3.0版本发布准备

## 工作流程

### 1. 功能开发流程

```bash
# 从master创建功能分支
git checkout master
git pull origin master
git checkout -b feature/new-feature

# 开发完成后提交
git add .
git commit -m "feat: 新功能描述"

# 推送到远程
git push origin feature/new-feature

# 创建Pull Request合并到develop
```

### 2. 发布流程

```bash
# 从develop创建发布分支
git checkout develop
git checkout -b release/v1.3.0

# 发布准备（版本号更新、文档更新等）
git commit -m "chore: 准备v1.3.0发布"

# 合并到master并打标签
git checkout master
git merge release/v1.3.0
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin master --tags
```

### 3. 紧急修复流程

```bash
# 从master创建修复分支
git checkout master
git checkout -b hotfix/critical-fix

# 修复完成后
git commit -m "fix: 紧急修复描述"

# 合并到master和develop
git checkout master
git merge hotfix/critical-fix
git checkout develop
git merge hotfix/critical-fix
```

## 提交信息规范

### 提交类型
- `feat:` - 新功能
- `fix:` - 修复bug
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 代码重构
- `test:` - 测试相关
- `chore:` - 构建过程或辅助工具变动

### 提交示例
```
feat: 实现微信联系支付方案

- 移除微信支付相关页面和组件
- 实现添加微信号的人工支付流程
- 优化会员开通体验
```

## 版本管理

### 版本号规范 (Semantic Versioning)
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 当前版本规划
- **v1.2.1** - 当前生产版本（微信支付）
- **v1.3.0** - 微信联系支付版本（计划）
- **v1.3.1** - 后续优化版本

## 分支保护策略

### master分支保护
- 禁止直接推送
- 必须通过Pull Request合并
- 需要代码审查
- 必须通过CI检查

### develop分支保护
- 允许功能分支合并
- 建议代码审查
- 自动化测试通过

## 当前项目特殊说明

### 微信支付 → 微信联系支付迁移

**背景**: 微信不允许个人开发者使用微信支付API

**解决方案**: 
1. 保留`master`分支作为微信支付版本的备份
2. `feature/wechat-contact-payment`分支实现新的支付方案
3. 测试稳定后合并到新的`develop`分支
4. 最终发布为`v1.3.0`版本

**关键变更**:
- 删除`pages/member/`支付相关页面
- 删除`components/login/`等不需要的组件  
- 优化个人中心的会员开通流程
- 添加微信小程序API限制规范文档
- 完善管理员手动激活会员功能

## 最佳实践

### 1. 分支命名
- 使用描述性名称
- 使用小写字母和连字符
- 包含功能或修复的简短描述

### 2. 提交频率
- 小而频繁的提交
- 每个提交只包含一个逻辑变更
- 提交信息清晰描述变更内容

### 3. 合并策略
- 功能分支使用`merge`保留历史
- 修复分支可以使用`rebase`保持线性历史
- 重要版本使用`merge`并打标签

### 4. 代码审查
- 所有合并到主分支的代码都需要审查
- 关注代码质量、安全性、性能
- 确保符合项目规范

## 工具推荐

### Git GUI工具
- **SourceTree** - 可视化Git管理
- **GitKraken** - 现代化Git客户端
- **VS Code Git** - 编辑器集成

### 命令行别名
```bash
# 添加到 ~/.gitconfig
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
```

---

**记住**: 好的分支管理策略能让团队协作更高效，代码历史更清晰！