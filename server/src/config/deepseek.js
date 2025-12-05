/**
 * DeepSeek API 配置
 */

require('dotenv').config();

module.exports = {
    // DeepSeek API 配置
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.7,

    // 请求超时配置（毫秒）
    timeout: 30000,

    // 重试配置
    retry: {
        maxRetries: 1,
        retryDelay: 1000
    }
};
