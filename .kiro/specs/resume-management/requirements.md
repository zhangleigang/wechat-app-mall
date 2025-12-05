# 简历管理与智能问答优化 - 需求文档

## 简介

本功能旨在优化现有的简历解读功能，通过引入简历文件管理机制，允许用户上传、管理多个简历文件，并基于选定的简历进行智能问答。系统将在后端持久化存储用户上传的简历内容，支持用户在多个简历之间切换，并提供预设问题快速分析功能。

## 术语表

- **System**: 大数据AI面试助手小程序系统
- **User**: 使用小程序的求职者
- **Resume**: 用户上传的简历文件及其解析后的文本内容
- **Resume List**: 用户已上传的简历文件列表
- **Active Resume**: 当前选中用于问答的简历
- **Preset Question**: 系统预设的快速分析问题
- **DeepSeek API**: 用于处理简历分析和问答的AI服务接口
- **OpenID**: 微信用户的唯一标识符
- **Resume Storage**: 后端数据库中存储简历信息的表

## 需求

### 需求 1: 简历文件上传与存储

**用户故事**: 作为求职者，我希望能够上传多个简历文件并保存在系统中，以便后续随时查看和分析。

#### 验收标准

1. WHEN 用户点击上传按钮 THEN System SHALL 允许用户选择PDF、Word、Markdown或图片格式的文件
2. WHEN 用户选择文件后 THEN System SHALL 将文件上传到后端服务器并解析文本内容
3. WHEN 文件上传成功 THEN System SHALL 将简历信息（文件名、上传时间、解析文本、文件路径）存储到数据库中并关联到用户的OpenID
4. WHEN 用户已上传3个简历文件 THEN System SHALL 阻止继续上传并提示用户已达到上限
5. WHEN 简历解析失败 THEN System SHALL 提示用户错误信息并允许重新上传

### 需求 2: 简历列表管理

**用户故事**: 作为求职者，我希望能够查看我上传的所有简历，并可以选择、删除或重新上传简历。

#### 验收标准

1. WHEN 用户进入简历解读页面 THEN System SHALL 从后端加载该用户的所有简历列表
2. WHEN 简历列表加载成功 THEN System SHALL 显示每个简历的文件名、上传时间和状态标识
3. WHEN 用户点击某个简历 THEN System SHALL 将该简历设置为Active Resume并高亮显示
4. WHEN 用户长按某个简历 THEN System SHALL 显示删除选项
5. WHEN 用户确认删除简历 THEN System SHALL 从数据库中删除该简历记录并更新前端列表
6. WHEN 简历列表为空 THEN System SHALL 显示上传引导界面

### 需求 3: 预设问题快速分析

**用户故事**: 作为求职者，我希望能够快速选择常见的分析问题，而不必每次都手动输入。

#### 验收标准

1. WHEN Active Resume 存在 THEN System SHALL 显示三个预设问题按钮
2. THE System SHALL 提供以下预设问题："整个简历最大的亮点是什么"、"简历还有哪些可以优化的"、"用STAR原则解读简历"
3. WHEN 用户点击预设问题 THEN System SHALL 自动将问题填入输入框并发送到AI服务
4. WHEN 没有Active Resume THEN System SHALL 隐藏预设问题区域

### 需求 4: 基于选定简历的智能问答

**用户故事**: 作为求职者，我希望能够针对选定的简历进行提问，并获得AI的分析和建议。

#### 验收标准

1. WHEN 用户发送问题 THEN System SHALL 将Active Resume的文本内容和用户问题一起发送到DeepSeek API
2. WHEN DeepSeek API 返回回答 THEN System SHALL 在对话界面显示AI的回复
3. WHEN 用户切换Active Resume THEN System SHALL 清空当前对话历史并提示用户已切换简历
4. WHEN 没有Active Resume THEN System SHALL 阻止用户发送问题并提示先选择简历
5. WHEN AI服务调用失败 THEN System SHALL 显示友好的错误提示并允许用户重试

### 需求 5: 对话历史管理

**用户故事**: 作为求职者，我希望系统能够保存我与AI的对话历史，以便回顾之前的分析结果。

#### 验收标准

1. WHEN 用户与AI进行对话 THEN System SHALL 将对话记录存储到本地缓存中
2. WHEN 用户重新进入页面 THEN System SHALL 加载最近24小时内的对话历史
3. WHEN 用户切换Active Resume THEN System SHALL 清空当前显示的对话历史
4. WHEN 用户点击清空按钮 THEN System SHALL 删除当前对话历史并清空界面
5. WHEN 用户点击导出按钮 THEN System SHALL 将对话内容复制到剪贴板

### 需求 6: 后端API设计

**用户故事**: 作为系统开发者，我需要设计后端API来支持简历的上传、存储、查询和删除功能。

#### 验收标准

1. THE System SHALL 提供POST /api/resume/upload接口用于上传和解析简历文件
2. THE System SHALL 提供GET /api/resume/list接口用于获取用户的简历列表
3. THE System SHALL 提供DELETE /api/resume/:id接口用于删除指定简历
4. THE System SHALL 提供GET /api/resume/:id接口用于获取指定简历的详细信息
5. WHEN 调用任何简历API THEN System SHALL 验证用户的OpenID和会员状态
6. THE System SHALL 使用MySQL数据库存储简历信息，包含字段：id、openid、filename、upload_time、file_path、parsed_text、created_at

### 需求 7: 文件存储策略

**用户故事**: 作为系统管理员，我需要确保上传的文件安全存储并可以被系统访问。

#### 验收标准

1. WHEN 用户上传文件 THEN System SHALL 将文件保存到服务器的指定目录（如/uploads/resumes/）
2. THE System SHALL 使用"openid_timestamp_原始文件名"的格式命名存储的文件
3. WHEN 文件存储成功 THEN System SHALL 在数据库中记录文件的相对路径
4. WHEN 用户删除简历 THEN System SHALL 同时删除数据库记录和服务器上的文件
5. THE System SHALL 限制单个文件大小不超过10MB

### 需求 8: 前端交互优化

**用户故事**: 作为求职者，我希望界面清晰易用，能够方便地管理简历和进行问答。

#### 验收标准

1. WHEN 页面加载 THEN System SHALL 在顶部显示简历列表区域
2. WHEN 简历列表有内容 THEN System SHALL 以卡片形式横向滚动显示所有简历
3. WHEN 用户选择简历 THEN System SHALL 在卡片上显示选中状态（如边框高亮）
4. WHEN 显示预设问题 THEN System SHALL 在简历列表下方以按钮组形式展示
5. WHEN 用户上传或删除简历 THEN System SHALL 提供触觉反馈和动画效果
