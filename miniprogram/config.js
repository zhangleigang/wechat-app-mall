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

  // === 收款码支付配置 ===
  paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.png',
    accountName: '请填写收款人姓名', // ⚠️ 需要替换为实际收款人姓名
    enabled: true
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
  }
}