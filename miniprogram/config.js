/**
 * 小程序配置文件
 * 包含API地址、AI服务、支付配置等
 */
module.exports = {
  // === AI 服务配置 ===
  ai_api_base: 'https://your-ai-backend.example.com', // AI 服务地址
  ai_api_key: '', // AI服务密钥（如需要）

  // === 统一后端 API 配置 ===
  // 所有后端服务已整合（认证、知识库、会员、订单、上传）
  apiBaseUrl: 'https://api.feelnow.cn/api', // 生产环境
  // apiBaseUrl: 'http://localhost:3000/api', // 本地开发

  // === 备用 API 配置（降级使用） ===
  backupApiBaseUrl: null, // 备用API地址，如有需要可配置

  // === 网络请求配置 ===
  network: {
    timeout: 10000,           // 默认超时时间（毫秒）
    retryCount: 3,            // 默认重试次数
    retryDelay: 1000,         // 默认重试延迟（毫秒）
    enableFallback: true      // 是否启用降级处理
  },

  // === 收款码支付配置 - 审核期间暂时禁用 ===
  paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.png',
    accountName: '请填写收款人姓名', // ⚠️ 需要替换为实际收款人姓名
    enabled: false // 审核期间禁用支付功能
  },

  // === 简历管理配置 ===
  resume: {
    // 文件上传限制
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxResumeCount: 3, // 最多上传3个简历

    // 支持的文件格式
    supportedFormats: [
      'pdf',   // PDF文档
      'doc',   // Word 2003
      'docx',  // Word 2007+
      'md'     // Markdown
    ],

    // 文件格式说明文本
    formatDescription: '支持 PDF、Word、Markdown 格式',

    // 缓存配置
    cacheExpireTime: 5 * 60 * 1000 // 简历列表缓存5分钟
  },

  // === 微信转账支付配置 ===
  wechatPayment: {
    wechatId: 'csuzhangleigang',        // 管理员微信号
    memberPrice: 99,                    // 会员价格(元)
    memberDuration: 365,                // 会员时长(天)
    enabled: true                       // 启用微信转账功能
  }
}