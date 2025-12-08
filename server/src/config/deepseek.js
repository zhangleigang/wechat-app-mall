/**
 * DeepSeek API 配置
 */

require('dotenv').config();

module.exports = {
    // DeepSeek API 配置
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    maxTokens: null,  // 不限制 tokens，让 API 自动决定
    temperature: 0.7,

    // 请求超时配置（毫秒）
    // 增加到 60 秒，因为 DeepSeek API 响应较慢（通常需要 20-30 秒）
    timeout: 60000,

    // 重试配置
    retry: {
        maxRetries: 2,  // 增加重试次数
        retryDelay: 2000  // 增加重试延迟
    }
};
