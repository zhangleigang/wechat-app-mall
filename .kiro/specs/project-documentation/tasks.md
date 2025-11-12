# 实施计划

- [ ] 1. 创建文档目录结构
  - 在项目根目录创建docs文件夹及子目录结构：docs/technical、docs/user、docs/operations、docs/management
  - 创建docs/README.md作为文档导航入口，包含所有文档的链接和简要说明
  - _需求: 1.1, 2.1_

- [x] 2. 编写技术文档 - 架构概览
  - 创建docs/technical/ARCHITECTURE.md文件
  - 编写系统概述，说明AI面试助手的核心功能（岗位分析、知识库、简历解读、情绪支持、个人中心）
  - 列出完整技术栈清单，包含版本号（微信小程序、Vant Weapp 1.11.6、apifm-wxapi 24.06.19、dayjs 1.11.6、mp-html 2.3.1等）
  - 使用Mermaid绘制系统架构图，展示应用层、页面层、组件层、工具层、配置层的层次关系
  - 说明目录结构，详细解释pages、components、utils、images、config.js等的用途
  - 描述数据流（用户交互→页面层→工具层→后端服务→本地存储）
  - _需求: 1.1, 1.2_

- [ ] 3. 编写技术文档 - API接口
  - 创建docs/technical/API.md文件
  - 记录AI服务的/chat接口规范（POST请求、Headers包含Authorization、Body包含scene/sessionId/messages等参数、响应格式）
  - 记录AI服务的/resume/upload接口规范（POST请求、FormData格式、文件上传、响应包含resumeText）
  - 记录apifm-wxapi的核心接口（WXAPI.userDetail、WXAPI.orderStatistics、WXAPI.queryConfigBatch等）
  - 说明Token认证机制（wx.getStorageSync('token')的使用、Token传递方式）
  - 为每个接口提供JavaScript调用示例代码
  - 列出常见错误码（401未授权、500服务器错误等）和处理方式
  - _需求: 1.3_

- [ ] 4. 编写技术文档 - 组件参考
  - 创建docs/technical/COMPONENTS.md文件
  - 记录login组件的使用方法（引入方式、触发登录、事件回调）
  - 记录bind-mobile组件的使用方法（手机号绑定流程、属性配置）
  - 记录payment组件的使用方法（支付参数、支付回调）
  - 记录fuwuxieyi、goods-pop等其他业务组件
  - 为每个组件提供WXML使用示例和JavaScript调用示例
  - 说明Vant Weapp组件库的引入和使用（van-button、van-field、van-popup等）
  - _需求: 1.4_

- [ ] 5. 编写技术文档 - 开发环境搭建
  - 创建docs/technical/SETUP.md文件
  - 列出前置要求（Node.js 14+、微信开发者工具最新稳定版）
  - 提供微信开发者工具下载链接和安装步骤
  - 说明项目获取方法（git clone仓库地址）
  - 说明依赖安装步骤（npm install或使用微信开发者工具的构建npm）
  - 详细说明config.js的配置（subDomain、merchantId、ai_api_base、ai_api_key的修改方法）
  - 提供本地调试步骤（导入项目、编译、预览、真机调试）
  - 列出5-10个常见问题和解决方案（依赖安装失败、编译报错、接口调用失败等）
  - _需求: 1.5_

- [ ] 6. 编写代码组织文档 - 文件结构
  - 创建docs/technical/FILE_STRUCTURE.md文件
  - 使用树形结构列出完整的项目目录（pages、components、utils、images、miniprogram_npm等）
  - 解释每个主要目录的用途和职责
  - 详细说明pages目录下的功能模块（pages/ai包含岗位分析/简历解读/情绪支持，pages/knowledge包含知识库，pages/my包含个人中心等）
  - 详细说明utils目录下各工具文件的职责（ai.js处理AI接口、auth.js处理认证、knowledge.js存储知识库数据、tools.js提供通用工具）
  - 说明关键配置文件的作用（app.json全局配置、config.js应用配置、project.config.json项目配置）
  - _需求: 2.1_

- [ ] 7. 编写代码组织文档 - 编码标准
  - 创建docs/technical/CODING_STANDARDS.md文件
  - 定义JavaScript编码规范（驼峰命名、2空格缩进、单引号、注释规范）
  - 定义WXML/WXSS编码规范（标签小写、类名kebab-case、样式组织）
  - 说明文件命名约定（页面用index、组件用功能名、工具文件用小写）
  - 提供代码组织最佳实践（单一职责、模块化、避免重复、合理注释）
  - 说明Git提交信息规范（feat/fix/docs/style/refactor等前缀）
  - _需求: 2.2_

- [ ] 8. 编写代码组织文档 - 模块依赖
  - 创建docs/technical/DEPENDENCIES.md文件
  - 使用Mermaid绘制utils模块依赖图（ai.js→config.js、auth.js→apifm-wxapi等）
  - 绘制pages与utils的依赖关系（pages/ai/job→utils/ai.js等）
  - 说明components的使用关系和引入方式
  - 列出第三方库依赖（apifm-wxapi、@vant/weapp、dayjs、mp-html等）及其用途
  - 提供依赖更新建议（定期检查、测试后更新、记录变更）
  - _需求: 2.3_

- [ ] 9. 编写代码组织文档 - 开发模板
  - 创建docs/technical/FEATURE_TEMPLATE.md文件
  - 提供新功能开发的标准流程（需求分析→设计→编码→测试→文档）
  - 提供页面开发模板（包含index.js的Page结构、index.wxml的布局、index.wxss的样式、index.json的配置）
  - 提供组件开发模板（Component结构、properties、methods、生命周期）
  - 提供工具函数开发模板（模块导出、函数注释、错误处理）
  - 说明如何为新功能编写文档（更新ARCHITECTURE.md、添加API说明、更新CHANGELOG.md）
  - _需求: 2.4_

- [ ] 10. 编写用户文档 - 用户手册
  - 创建docs/user/USER_GUIDE.md文件
  - 编写快速开始部分（打开小程序→浏览功能→选择需要的服务）
  - 详细说明岗位分析功能（在"岗位分析"标签页输入JD或岗位链接→点击发送→查看AI分析结果→使用快捷问题深入了解）
  - 详细说明知识库功能（在"面试知识"标签页浏览分类→切换技术栈→使用搜索框查找→点击主题查看详情）
  - 详细说明简历解读功能（在"简历解读"标签页上传简历文件→等待解析→查看分析结果→与AI对话获取优化建议）
  - 详细说明情绪小屋功能（在"情绪小屋"标签页表达情绪和压力→获取AI的支持和建议）
  - 详细说明个人中心功能（登录账号→查看个人信息→修改头像和昵称→查看订单统计）
  - 提供使用技巧（保持网络连接、清晰描述问题、合理使用AI建议）
  - _需求: 3.1_

- [ ] 11. 编写用户文档 - 功能教程
  - 创建docs/user/TUTORIALS.md文件
  - 编写教程1：使用岗位分析准备面试（场景：收到面试通知→复制JD→打开岗位分析→粘贴JD→获取分析→针对性准备）
  - 编写教程2：学习大数据面试知识（场景：准备Spark面试→打开知识库→选择Spark分类→浏览常见问题→记录重点）
  - 编写教程3：优化简历内容（场景：投递前检查→上传简历→查看AI分析→根据建议修改→重新上传验证）
  - 编写教程4：缓解面试压力（场景：面试前焦虑→打开情绪小屋→描述感受→获取放松建议→练习呼吸技巧）
  - 为每个教程提供预期结果说明
  - _需求: 3.2_

- [ ] 12. 编写用户文档 - 常见问题
  - 创建docs/user/FAQ.md文件
  - 编写账号问题（Q:如何登录？A:使用微信授权自动登录；Q:如何绑定手机号？A:在个人中心点击绑定）
  - 编写功能问题（Q:AI没有响应？A:检查网络连接和AI服务配置；Q:简历上传失败？A:检查文件格式和大小；Q:搜索无结果？A:尝试更换关键词）
  - 编写AI服务问题（Q:回复不准确？A:提供更详细的问题描述；Q:响应慢？A:高峰期可能延迟，请稍候；Q:服务不可用？A:联系管理员检查配置）
  - 编写隐私问题（Q:数据存储在哪？A:本地存储和服务器；Q:如何删除数据？A:联系客服；Q:隐私如何保护？A:加密传输和存储）
  - 提供技术支持联系方式（客服微信、QQ、邮箱）
  - _需求: 3.3_

- [ ] 13. 编写用户文档 - 隐私政策
  - 创建docs/user/PRIVACY.md文件
  - 说明收集的信息类型（微信昵称、头像、手机号、简历内容、对话记录）
  - 说明信息使用目的（提供AI分析服务、改进功能、用户支持）
  - 说明数据保护措施（HTTPS加密传输、服务器安全存储、访问权限控制）
  - 说明用户权利（查看个人信息、修改昵称头像、申请删除数据）
  - 说明隐私政策更新机制（重大变更会通知用户、定期审查更新）
  - 提供隐私相关问题的联系方式
  - _需求: 3.4_

- [ ] 14. 编写运维文档 - 部署指南
  - 创建docs/operations/DEPLOYMENT.md文件
  - 编写发布前检查清单（代码审查完成、功能测试通过、config.js配置正确、隐私政策已添加）
  - 详细说明代码上传步骤（微信开发者工具→上传→填写版本号和备注→确认上传）
  - 说明版本号管理规范（主版本.次版本.修订号，如8.5.0）
  - 说明提交审核注意事项（选择正确类目"工具-信息查询"、详细描述功能、配置隐私设置、提供测试账号）
  - 列出审核常见问题（功能描述不清、隐私政策缺失、测试账号无效）和解决方法
  - 说明发布后验证（扫码体验、功能测试、用户反馈收集）
  - _需求: 4.1_

- [ ] 15. 编写运维文档 - 配置参考
  - 创建docs/operations/CONFIGURATION.md文件
  - 详细说明config.js配置项（version版本号、subDomain专属域名、merchantId商户ID、sdkAppID腾讯云应用ID、bindSeller分销开关、customerServiceType客服类型、openIdAutoRegister自动注册、ai_api_base AI服务地址、ai_api_key API密钥）
  - 说明subDomain的获取方法（在apifm后台查看专属域名）
  - 说明merchantId的获取方法（在apifm后台商户信息中查看）
  - 说明ai_api_base的配置（替换为实际的AI服务网关地址）
  - 说明ai_api_key的配置（如需鉴权则填写，否则留空）
  - 说明app.json关键配置（pages页面路径、tabBar底部导航、permission权限声明、usingComponents全局组件）
  - 提供开发/生产环境配置示例
  - _需求: 4.2_

- [ ] 16. 编写运维文档 - 后端集成
  - 创建docs/operations/BACKEND_INTEGRATION.md文件
  - 说明AI服务接口规范（POST /chat和POST /resume/upload的完整规范）
  - 提供AI服务集成步骤（部署AI服务→配置ai_api_base→配置ai_api_key→测试接口）
  - 说明AI服务认证配置（Bearer Token方式、请求头设置）
  - 说明错误处理机制（try-catch捕获、wx.showToast提示、日志记录）
  - 说明apifm-wxapi初始化（WXAPI.init(subDomain)、WXAPI.setMerchantId(merchantId)）
  - 说明商户配置方法（在apifm后台配置商户信息、支付参数、系统参数）
  - _需求: 4.3_

- [ ] 17. 编写运维文档 - 监控和故障排除
  - 创建docs/operations/MONITORING.md文件
  - 说明日志查看方法（微信开发者工具Console、真机调试vConsole、微信公众平台运维中心）
  - 列出关键性能指标（页面加载时间<2s、AI响应时间<5s、接口成功率>95%）
  - 提供常见错误诊断（网络错误：检查网络连接和域名配置；AI服务异常：检查ai_api_base配置和服务状态；认证失败：检查Token有效性；简历上传失败：检查文件大小和格式）
  - 说明应急响应流程（发现问题→评估影响→快速修复→通知用户→事后总结）
  - 提供问题上报方式（GitHub Issues、客服反馈、邮件联系）
  - _需求: 4.4_

- [ ] 18. 编写管理文档 - 知识库管理
  - 创建docs/management/KNOWLEDGE_MANAGEMENT.md文件
  - 详细说明知识库数据结构（categories数组包含key和name字段；topics数组包含id、title、summary、tags、categoryKey、faqs、answers、examples字段）
  - 提供添加新分类的步骤（在utils/knowledge.js的categories数组中添加对象，包含唯一key和显示name）和代码示例
  - 提供添加新主题的步骤（在utils/knowledge.js的topics数组中添加对象，填写所有必需字段）和代码示例
  - 说明FAQ和答案编写规范（问题简洁明确、答案详细准确、使用换行符\n分段、提供代码示例）
  - 提供内容质量标准（技术准确性、内容完整性、语言可读性、格式一致性）
  - 说明更新流程（修改utils/knowledge.js→本地测试→提交代码→部署发布）
  - _需求: 5.1, 5.2, 5.3, 5.4_

- [ ] 19. 编写管理文档 - 测试文档
  - 创建docs/management/TESTING.md文件
  - 编写测试策略（功能测试验证核心功能、集成测试验证模块协作、性能测试验证响应速度）
  - 创建岗位分析测试用例（输入空文本应提示、输入JD应返回分析、网络异常应提示错误、快捷问题应正确填充）
  - 创建知识库测试用例（分类切换应更新列表、搜索应过滤结果、点击主题应跳转详情、详情应正确显示FAQ和答案）
  - 创建简历解读测试用例（选择文件应上传、上传成功应显示解析文本、AI对话应正常交互、上传失败应提示错误）
  - 创建情绪支持测试用例（输入消息应发送、AI应返回支持性回复、会话历史应保持）
  - 创建用户中心测试用例（未登录应显示登录按钮、登录应获取用户信息、修改昵称头像应成功、订单统计应正确显示）
  - 提供缺陷报告模板（包含标题、描述、重现步骤、预期结果、实际结果、严重程度字段）
  - _需求: 6.1, 6.2, 6.3, 6.4_

- [ ] 20. 编写管理文档 - 安全文档
  - 创建docs/management/SECURITY.md文件
  - 说明认证机制（使用微信登录wx.login获取code、调用后端换取Token、Token存储在wx.storage、每次请求携带Token）
  - 说明授权机制（用户只能访问自己的数据、管理员可访问后台管理功能、使用Token验证身份）
  - 说明数据传输安全（所有接口使用HTTPS、敏感数据加密传输、配置SSL证书）
  - 说明Token管理（Token有效期设置、过期自动刷新、退出登录清除Token）
  - 说明敏感信息处理（简历内容不在本地长期存储、用户数据访问控制、日志脱敏处理）
  - 说明安全审计（记录关键操作日志、定期安全检查、漏洞扫描）
  - 提供漏洞响应流程（接收报告→评估严重性→24小时内响应→修复并测试→发布更新→通知用户）
  - _需求: 8.1, 8.2, 8.4_

- [ ] 21. 编写管理文档 - 合规性检查
  - 创建docs/management/COMPLIANCE.md文件
  - 列出微信小程序平台要求（选择正确类目、不得包含违规内容、必须提供隐私政策、测试账号可用、功能描述准确）
  - 列出数据隐私法规要求（明确告知数据收集目的、获得用户授权、提供数据删除途径、保障数据安全）
  - 提供合规性自查清单（✓隐私政策已添加、✓用户协议已展示、✓数据收集已授权、✓敏感权限已说明、✓内容合法合规）
  - 说明隐私政策展示要求（首次使用时展示、用户协议链接可访问、重大变更需通知）
  - 说明数据授权流程（使用wx.authorize获取权限、用户拒绝后提供手动授权入口、说明权限用途）
  - _需求: 8.3_

- [ ] 22. 编写产品管理文档 - 功能矩阵
  - 创建docs/management/FEATURES.md文件
  - 列出岗位分析功能（状态：已完成、版本：8.4.0、价值：帮助求职者理解岗位要求和准备面试、场景：收到面试通知后分析JD）
  - 列出知识库功能（状态：已完成、版本：8.4.0、价值：提供大数据技术面试题库、场景：准备技术面试时学习）
  - 列出简历解读功能（状态：已完成、版本：8.4.0、价值：AI分析简历并提供优化建议、场景：投递简历前优化内容）
  - 列出情绪支持功能（状态：已完成、版本：8.4.0、价值：缓解面试压力和焦虑、场景：面试前情绪管理）
  - 列出个人中心功能（状态：已完成、版本：8.4.0、价值：管理个人信息和查看数据、场景：日常使用和设置）
  - 使用表格格式组织（功能名称、状态、版本、核心价值、使用场景）
  - _需求: 7.1_

- [ ] 23. 编写产品管理文档 - 变更日志
  - 创建docs/management/CHANGELOG.md文件
  - 记录当前版本8.4.0（发布日期：2024-XX-XX、新增：完整的AI面试助手功能、改进：优化UI交互、修复：无、已知问题：AI服务需要配置）
  - 提供历史版本记录模板（版本号、发布日期、新增功能、功能改进、缺陷修复、已知问题）
  - 说明版本号规则（主版本.次版本.修订号）
  - 说明如何添加新版本记录（在文件顶部添加新版本、按时间倒序排列）
  - _需求: 7.2_

- [ ] 24. 编写产品管理文档 - 产品路线图
  - 创建docs/management/ROADMAP.md文件
  - 概述短期计划（1-3个月：优化AI回复质量、增加更多技术栈知识、支持简历模板下载、添加面试经验分享）
  - 概述中期计划（3-6个月：支持模拟面试功能、集成视频面试指导、添加薪资谈判建议、支持多语言）
  - 概述长期愿景（6个月以上：打造完整的职业发展平台、AI职业规划、企业招聘对接）
  - 说明优先级评估标准（用户需求强度、开发成本、商业价值、技术可行性）
  - 提供反馈渠道（GitHub Issues、用户反馈表单、客服微信）
  - _需求: 7.3_

- [ ]* 25. 编写产品管理文档 - 用户分析
  - 创建docs/management/ANALYTICS.md文件
  - 说明微信小程序数据分析的使用（登录微信公众平台→数据分析→查看用户、访问、行为数据）
  - 列出关键指标（DAU日活跃用户、页面访问量PV、功能使用率、用户留存率、平均使用时长）
  - 说明自定义事件埋点（使用wx.reportAnalytics上报事件、定义事件ID和参数、在关键操作处添加埋点）
  - 提供数据分析方法（对比不同时间段、分析用户路径、识别流失点、优化转化率）
  - _需求: 7.4_

- [ ] 26. 创建文档导航入口
  - 创建docs/README.md文件
  - 编写文档系统概述（本文档系统为AI面试助手小程序提供完整的技术和使用文档）
  - 创建技术文档目录（链接到ARCHITECTURE.md、API.md、COMPONENTS.md、SETUP.md、FILE_STRUCTURE.md、CODING_STANDARDS.md、DEPENDENCIES.md、FEATURE_TEMPLATE.md）
  - 创建用户文档目录（链接到USER_GUIDE.md、TUTORIALS.md、FAQ.md、PRIVACY.md）
  - 创建运维文档目录（链接到DEPLOYMENT.md、CONFIGURATION.md、BACKEND_INTEGRATION.md、MONITORING.md）
  - 创建管理文档目录（链接到KNOWLEDGE_MANAGEMENT.md、TESTING.md、SECURITY.md、COMPLIANCE.md、FEATURES.md、CHANGELOG.md、ROADMAP.md）
  - 提供角色快速导航（开发者→技术文档、用户→用户文档、管理员→运维文档、QA→测试文档）
  - 说明文档更新频率（随代码变更实时更新）
  - _需求: 1.1, 2.1, 3.1, 4.1_

- [ ] 27. 添加架构图和流程图
  - 在ARCHITECTURE.md中使用Mermaid绘制系统架构图（展示应用层、页面层、组件层、工具层、配置层的层次结构）
  - 在ARCHITECTURE.md中使用Mermaid绘制数据流图（用户交互→页面→工具→后端→存储）
  - 在USER_GUIDE.md中使用Mermaid绘制用户交互流程图（打开小程序→选择功能→使用服务→查看结果）
  - 在DEPLOYMENT.md中使用Mermaid绘制部署流程图（开发→测试→上传→审核→发布）
  - 在DEPENDENCIES.md中使用Mermaid绘制模块依赖图
  - _需求: 1.1, 8.2_

- [ ]* 28. 为用户文档添加截图
  - 截取岗位分析功能界面（输入框、AI回复、快捷问题）
  - 截取知识库功能界面（分类列表、搜索框、主题卡片、详情页）
  - 截取简历解读功能界面（上传按钮、解析结果、对话界面）
  - 截取情绪支持功能界面（对话界面、AI回复）
  - 截取个人中心界面（用户信息、订单统计、设置选项）
  - 将截图保存到docs/images目录并在USER_GUIDE.md和TUTORIALS.md中引用
  - _需求: 3.2_

- [ ] 29. 创建文档维护指南
  - 创建docs/DOCUMENTATION_GUIDE.md文件
  - 说明文档更新触发条件（新增功能需更新ARCHITECTURE和FEATURES、修改API需更新API.md、修改配置需更新CONFIGURATION.md、修复bug需更新CHANGELOG.md）
  - 说明文档审查流程（编写→自查→同行评审→测试验证→合并发布）
  - 提供文档编写规范（使用Markdown格式、标题使用#层次、代码使用```包裹、链接使用相对路径、中文和英文间加空格）
  - 说明文档版本管理（文档与代码同步提交、使用Git管理变更、重大更新标注版本号）
  - 提供文档模板（技术文档模板、用户文档模板、API文档模板）
  - _需求: 2.4_

- [ ] 30. 审查文档准确性
  - 对照实际代码验证ARCHITECTURE.md中的架构描述
  - 对照utils/ai.js验证API.md中的接口规范
  - 对照config.js验证CONFIGURATION.md中的参数说明
  - 对照实际操作验证USER_GUIDE.md中的步骤
  - 修正发现的不一致之处
  - _需求: 所有需求_

- [ ] 31. 审查文档完整性
  - 检查需求文档中的8个需求是否都有对应的文档覆盖
  - 检查5个核心功能（岗位分析、知识库、简历解读、情绪支持、个人中心）是否都有使用说明
  - 检查config.js和app.json中的所有配置项是否都有说明
  - 检查FAQ.md是否覆盖了常见问题
  - 补充缺失的内容
  - _需求: 所有需求_

- [ ] 32. 审查文档可读性
  - 检查所有文档的标题层次是否清晰（使用#、##、###）
  - 检查语言表达是否简洁明了（避免冗长句子、使用主动语态）
  - 检查代码示例是否完整（包含必要的上下文、添加注释说明）
  - 检查格式是否统一（代码块使用```、列表使用-、强调使用**）
  - 优化不够清晰的部分
  - _需求: 所有需求_

- [ ]* 33. 测试代码示例
  - 在开发环境中运行API.md中的AI接口调用示例
  - 在小程序中测试COMPONENTS.md中的组件使用示例
  - 验证CONFIGURATION.md中的配置示例是否有效
  - 验证FEATURE_TEMPLATE.md中的模板代码是否可用
  - 修复不可用的示例代码
  - _需求: 1.3, 1.4, 4.2_

- [ ] 34. 提交文档到代码仓库
  - 使用git add docs/将所有文档文件添加到暂存区
  - 使用git commit -m "docs: 添加完整的项目文档系统"提交
  - 使用git push推送到远程仓库
  - 验证文档在远程仓库中正确显示
  - _需求: 所有需求_

- [ ] 35. 更新项目README.md
  - 在README.md中添加"📚 文档"章节
  - 添加docs/README.md的链接（完整文档请查看 [文档中心](docs/README.md)）
  - 说明文档组织方式（按技术、用户、运维、管理四个类别组织）
  - 添加快速链接（[快速开始](docs/technical/SETUP.md)、[用户手册](docs/user/USER_GUIDE.md)、[API文档](docs/technical/API.md)）
  - 鼓励贡献者阅读和更新文档
  - _需求: 1.1, 2.1_

- [ ]* 36. 部署在线文档
  - 选择文档托管平台（推荐使用GitHub Pages + VuePress或Docsify）
  - 配置文档构建脚本（package.json中添加docs:build和docs:dev命令）
  - 配置部署流程（使用GitHub Actions自动部署）
  - 发布在线文档网站
  - 在README.md中添加在线文档访问地址
  - _需求: 所有需求_

- [ ] 37. 建立文档更新机制
  - 在开发流程中加入文档更新检查（Pull Request模板中添加"是否更新了相关文档"检查项）
  - 指定文档维护负责人（在DOCUMENTATION_GUIDE.md中说明）
  - 建立定期审查计划（每季度审查一次文档准确性和完整性）
  - 建立用户反馈收集机制（在文档中添加反馈链接、定期查看Issues）
  - 在DOCUMENTATION_GUIDE.md中记录这些机制
  - _需求: 所有需求_
