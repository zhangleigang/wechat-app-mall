module.exports = {
  version: '25.09.06',
  note: '分销中心显示分销等级、订单列表，点击区域方法', // 这个为版本描述，无需修改
  subDomain: 'tz', // 此处改成你自己的专属域名。什么是专属域名？请看教程 https://www.it120.cc/help/qr6l4m.html
  merchantId: 951, // 商户ID，可在后台工厂设置-->商户信息查看
  sdkAppID: 1400450467, // 腾讯实时音视频应用编号，请看教程 https://www.it120.cc/help/nxoqsl.html
  bindSeller: false, // true 开启三级分销抢客； false 为不开启
  customerServiceType: 'XCX', // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，XCX 为小程序的默认客服
  openIdAutoRegister: true, // 用户打开小程序的时候自动注册新用户【用户不存在的时候】
  ai_api_base: 'https://your-ai-backend.example.com', // AI 服务网关地址
  ai_api_key: '', // 若需要服务端鉴权，可填密钥或留空

  // 知识库 API 配置
  knowledgeApiUrl: 'http://47.95.196.190:8080/api', // 生产环境
  // knowledgeApiUrl: 'http://localhost:3000/api', // 本地开发环境
  // knowledgeApiUrl: 'https://api.feelnow.cn:8443/api', // HTTPS（配置证书后使用）
  useLocalKnowledge: false // false: 使用 API 加载, true: 使用本地数据（降级方案）
}