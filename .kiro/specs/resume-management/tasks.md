# 简历管理与智能问答优化 - 实施任务

## 任务列表

- [x] 1. 数据库设计与初始化
  - [x] 1.1 创建resumes表SQL脚本
    - 编写CREATE TABLE语句，包含所有必需字段
    - 添加索引优化查询性能
    - 编写初始化脚本 `server/database/init-resumes.sql`
    - _需求: 6.6_

  - [x] 1.2 在server服务中执行数据库迁移
    - 连接到MySQL数据库
    - 执行SQL脚本创建表
    - 验证表结构正确性
    - _需求: 6.6_

- [x] 2. 后端API开发 - 文件上传与解析
  - [x] 2.1 安装必要的npm依赖
    - 安装multer（文件上传）
    - 安装pdf-parse（PDF解析）
    - 安装mammoth（Word解析）
    - 更新package.json
    - _需求: 6.1_

  - [x] 2.2 创建文件上传中间件
    - 配置multer存储策略
    - 实现文件大小限制（10MB）
    - 实现文件类型验证
    - 创建 `server/src/middleware/upload.js`
    - _需求: 1.1, 7.5_

  - [x] 2.3 实现文件解析服务
    - 创建PDF解析函数
    - 创建Word解析函数
    - 创建Markdown解析函数（直接读取文本）
    - 创建统一的解析接口
    - 创建 `server/src/services/fileParser.js`
    - _需求: 1.2_

  - [x] 2.4 实现POST /api/resume/upload接口
    - 接收文件上传请求
    - 验证用户会员状态
    - 检查简历数量限制（最多3个）
    - 解析文件内容
    - 保存文件到服务器
    - 存储简历信息到数据库
    - 返回简历ID和基本信息
    - 创建 `server/src/routes/resume.js`
    - _需求: 1.1, 1.2, 1.3, 1.4, 6.1, 7.1, 7.2_

- [x] 3. 后端API开发 - 简历管理
  - [x] 3.1 实现GET /api/resume/list接口
    - 根据OpenID查询用户的所有简历
    - 返回简历列表（不包含parsed_text）
    - 返回总数和限制信息
    - _需求: 2.1, 2.2, 6.2_

  - [x] 3.2 实现GET /api/resume/:id接口
    - 根据ID查询简历详情
    - 验证简历所有权（OpenID匹配）
    - 返回完整简历信息（包含parsed_text）
    - _需求: 6.4_

  - [x] 3.3 实现DELETE /api/resume/:id接口
    - 验证简历所有权
    - 从数据库删除记录
    - 从文件系统删除文件
    - 确保删除操作的原子性
    - _需求: 2.4, 2.5, 6.3, 7.4_

- [x] 4. 后端API开发 - AI问答集成
  - [x] 4.1 配置DeepSeek API
    - 在.env文件中添加DEEPSEEK_API_KEY
    - 创建DeepSeek API配置对象
    - 创建 `server/src/config/deepseek.js`
    - _需求: 4.1_

  - [x] 4.2 实现DeepSeek API调用服务
    - 封装HTTP请求到DeepSeek API
    - 处理请求超时和重试逻辑
    - 格式化请求和响应数据
    - 创建 `server/src/services/deepseek.js`
    - _需求: 4.1, 4.2_

  - [x] 4.3 实现POST /api/resume/chat接口
    - 接收用户问题和resumeId
    - 从数据库获取简历文本
    - 构建AI对话上下文
    - 调用DeepSeek API
    - 返回AI回答
    - _需求: 4.1, 4.2, 4.5_

- [x] 5. 前端工具模块开发
  - [x] 5.1 创建resume-api.js工具模块
    - 实现uploadResume函数（上传简历）
    - 实现getResumeList函数（获取列表）
    - 实现getResumeDetail函数（获取详情）
    - 实现deleteResume函数（删除简历）
    - 实现chatWithResume函数（AI问答）
    - 统一错误处理和token管理
    - 创建 `miniprogram/utils/resume-api.js`
    - _需求: 1.1, 2.1, 2.4, 4.1_

  - [x] 5.2 更新config.js配置
    - 添加简历API的base URL配置
    - 添加文件上传相关配置
    - _需求: 6.1, 6.2, 6.3, 6.4_

- [x] 6. 前端页面重构 - 简历列表管理
  - [x] 6.1 重构页面数据结构
    - 添加resumeList数组（存储简历列表）
    - 添加activeResumeId（当前选中的简历ID）
    - 添加activeResumeText（当前简历的文本内容）
    - 移除旧的resumeStatus和resumeText字段
    - 修改 `miniprogram/pages/ai/resume/index.js`
    - _需求: 2.1, 2.3_

  - [x] 6.2 实现简历列表加载逻辑
    - 在onLoad中调用getResumeList
    - 更新resumeList数据
    - 如果列表不为空，自动选中第一个简历
    - _需求: 2.1, 2.2_

  - [x] 6.3 实现简历上传功能
    - 检查简历数量限制（最多3个）
    - 调用uploadResume API
    - 上传成功后刷新列表
    - 自动选中新上传的简历
    - _需求: 1.1, 1.2, 1.3, 1.4_

  - [x] 6.4 实现简历选择功能
    - 处理简历卡片点击事件
    - 更新activeResumeId
    - 加载选中简历的详细内容
    - 清空当前对话历史
    - 显示切换提示
    - _需求: 2.3, 4.3_

  - [x] 6.5 实现简历删除功能
    - 处理长按事件显示删除选项
    - 调用deleteResume API
    - 删除成功后刷新列表
    - 如果删除的是当前选中简历，清空activeResumeId
    - _需求: 2.4, 2.5_

- [x] 7. 前端页面重构 - UI组件
  - [x] 7.1 创建简历列表UI组件
    - 设计简历卡片样式（横向滚动）
    - 显示文件名、上传时间
    - 高亮显示选中状态
    - 添加删除按钮（长按显示）
    - 添加上传按钮（数量<3时显示）
    - 更新上传引导文案为"支持 PDF、Word、Markdown 格式"
    - 修改 `miniprogram/pages/ai/resume/index.wxml`
    - _需求: 2.2, 2.3, 8.1, 8.2, 8.3_

  - [x] 7.2 更新预设问题UI
    - 更新预设问题文本为新的三个问题
    - 调整显示逻辑（仅在有activeResume时显示）
    - 修改 `miniprogram/pages/ai/resume/index.wxml`
    - _需求: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.3 优化样式和动画
    - 添加简历卡片选中动画
    - 添加上传成功动画
    - 添加删除动画
    - 优化触觉反馈
    - 修改 `miniprogram/pages/ai/resume/index.wxss`
    - _需求: 8.5_

- [x] 8. 前端页面重构 - 问答逻辑
  - [x] 8.1 更新预设问题点击逻辑
    - 检查是否有activeResume
    - 自动填充问题到输入框
    - 自动发送问题
    - _需求: 3.3, 4.4_

  - [x] 8.2 重构发送消息逻辑
    - 检查是否有activeResume
    - 调用chatWithResume API而非原AI.chat
    - 传递activeResumeId和问题
    - 处理AI回复并显示
    - _需求: 4.1, 4.2_

  - [x] 8.3 实现对话历史管理
    - 切换简历时清空对话
    - 保存对话到本地缓存（关联resumeId）
    - 加载对话时检查resumeId匹配
    - _需求: 4.3, 5.1, 5.2, 5.3_

- [x] 9. 错误处理和用户提示
  - [x] 9.1 实现前端错误处理
    - 网络错误提示
    - 文件格式错误提示
    - 文件大小超限提示
    - 数量超限提示
    - AI服务异常提示
    - _需求: 1.5, 4.5_

  - [x] 9.2 实现后端错误处理
    - 统一错误响应格式
    - 文件解析失败处理
    - 数据库错误处理
    - DeepSeek API错误处理
    - 权限验证失败处理
    - _需求: 1.5, 4.5, 6.5_

  - [x] 9.3 添加错误日志记录
    - 记录所有错误到日志文件
    - 包含时间戳、用户ID、错误详情
    - 创建 `server/src/utils/logger.js`
    - _需求: 6.5_

- [x] 10. 测试与验证
  - [x] 10.1 后端API测试
    - 测试上传接口（各种文件格式）
    - 测试列表查询接口
    - 测试删除接口
    - 测试问答接口
    - 测试权限验证
    - _需求: 所有后端需求_

  - [x] 10.2 前端功能测试
    - 测试简历上传流程
    - 测试简历列表显示
    - 测试简历选择切换
    - 测试简历删除
    - 测试预设问题
    - 测试AI问答
    - _需求: 所有前端需求_

  - [x] 10.3 集成测试
    - 测试完整上传到问答流程
    - 测试多简历切换场景
    - 测试边界情况（3个简历限制）
    - 测试网络异常场景
    - _需求: 所有需求_

- [x] 11. 文档和部署
  - [x] 11.1 编写API文档
    - 记录所有新增API接口
    - 包含请求/响应示例
    - 记录错误码说明
    - 创建 `server/docs/RESUME_API.md`
    - _需求: 6.1, 6.2, 6.3, 6.4_

  - [x] 11.2 更新部署脚本
    - 更新deploy.sh添加uploads目录创建
    - 更新.env.example添加DeepSeek配置
    - _需求: 7.1, 7.2_

  - [x] 11.3 生产环境部署
    - 在服务器上创建uploads目录
    - 配置DeepSeek API密钥
    - 执行数据库迁移
    - 部署后端代码
    - 部署前端代码
    - 验证功能正常
    - _需求: 所有需求_

- [ ] 12. 最终检查点
  - 确保所有测试通过
  - 验证生产环境功能正常
  - 检查错误日志
  - 询问用户是否有问题
