module.exports = {
  version: '25.09.06',
  note: '分销中心显示分销等级、订单列表，点击区域方法', // 这个为版本描述，无需修改

  // === 已废弃的 apifm 配置（保留以避免引用错误）===
  // 注意：以下配置已不再使用，仅保留以避免代码引用报错
  subDomain: 'deprecated', // 已废弃，不再使用
  merchantId: 0, // 已废弃，不再使用
  sdkAppID: 0, // 已废弃，不再使用
  bindSeller: false, // 已废弃，不再使用
  customerServiceType: 'XCX', // 已废弃，不再使用
  openIdAutoRegister: false, // 已废弃，不再使用

  // === AI 服务配置 ===
  ai_api_base: 'https://your-ai-backend.example.com', // AI 服务网关地址
  ai_api_key: '', // 若需要服务端鉴权，可填密钥或留空

  // === 知识库 API 配置（包含认证服务）===
  knowledgeApiUrl: 'https://api.feelnow.cn:8443/api', // 生产环境（HTTPS已启用）
  // knowledgeApiUrl: 'http://localhost:3000/api', // 本地开发环境
  // knowledgeApiUrl: 'http://47.95.196.190:8080/api', // 旧的HTTP地址（已弃用）

  // 认证API已集成到知识库API中
  // 登录接口: https://api.feelnow.cn:8443/api/auth/login
  // 验证接口: https://api.feelnow.cn:8443/api/auth/check
  useLocalKnowledge: false, // false: 使用 API 加载, true: 使用本地数据（降级方案）

  // === 收款码支付配置 ===
  paymentQrcode: {
    url: 'https://api.feelnow.cn:8443/static/images/payment-qrcode.png', // 收款码图片URL
    accountName: '请填写收款人姓名', // 收款账户名（⚠️ 需要替换为实际的收款人姓名）
    enabled: true // 是否启用收款码支付
  }
}