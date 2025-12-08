/**
 * DeepSeek API 调用服务
 */

const axios = require('axios');
const deepseekConfig = require('../config/deepseek');

/**
 * 调用 DeepSeek API 进行对话
 * @param {Array} messages - 对话消息数组
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} AI 回复内容
 */
async function chat(messages, options = {}) {
    const config = {
        model: options.model || deepseekConfig.model,
        messages: messages,
        max_tokens: options.maxTokens || deepseekConfig.maxTokens,
        temperature: options.temperature || deepseekConfig.temperature
    };

    try {
        const response = await makeRequest(config);

        if (response.choices && response.choices.length > 0) {
            return response.choices[0].message.content;
        }

        throw new Error('DeepSeek API 返回格式异常');
    } catch (error) {
        console.error('DeepSeek API 调用失败:', error.message);
        throw error;
    }
}

/**
 * 调用 DeepSeek API 进行流式对话
 * @param {Array} messages - 对话消息数组
 * @param {Function} onChunk - 接收到数据块时的回调函数
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} 完整的AI回复内容
 */
async function chatStream(messages, onChunk, options = {}) {
    const config = {
        model: options.model || deepseekConfig.model,
        messages: messages,
        max_tokens: options.maxTokens || deepseekConfig.maxTokens,
        temperature: options.temperature || deepseekConfig.temperature,
        stream: true
    };

    try {
        return await makeStreamRequest(config, onChunk);
    } catch (error) {
        console.error('DeepSeek API 流式调用失败:', error.message);
        throw error;
    }
}

/**
 * 发送 HTTP 请求到 DeepSeek API（带重试逻辑）
 * @param {Object} data - 请求数据
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise<Object>} API 响应数据
 */
async function makeRequest(data, retryCount = 0) {
    try {
        const response = await axios.post(
            deepseekConfig.apiUrl,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepseekConfig.apiKey}`
                },
                timeout: deepseekConfig.timeout
            }
        );

        return response.data;
    } catch (error) {
        // 判断是否需要重试
        const shouldRetry = retryCount < deepseekConfig.retry.maxRetries &&
            isRetryableError(error);

        if (shouldRetry) {
            console.log(`DeepSeek API 请求失败，${deepseekConfig.retry.retryDelay}ms 后重试 (${retryCount + 1}/${deepseekConfig.retry.maxRetries})`);

            // 等待后重试
            await sleep(deepseekConfig.retry.retryDelay);
            return makeRequest(data, retryCount + 1);
        }

        // 格式化错误信息
        throw formatError(error);
    }
}

/**
 * 发送流式 HTTP 请求到 DeepSeek API
 * @param {Object} data - 请求数据
 * @param {Function} onChunk - 接收到数据块时的回调函数
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise<string>} 完整的响应内容
 */
async function makeStreamRequest(data, onChunk, retryCount = 0) {
    try {
        const response = await axios.post(
            deepseekConfig.apiUrl,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepseekConfig.apiKey}`
                },
                timeout: deepseekConfig.timeout,
                responseType: 'stream'
            }
        );

        return new Promise((resolve, reject) => {
            let fullContent = '';
            let buffer = '';

            response.data.on('data', (chunk) => {
                try {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');

                    // 保留最后一个可能不完整的行
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();

                        // 跳过空行和注释
                        if (!trimmedLine || trimmedLine.startsWith(':')) {
                            continue;
                        }

                        // 处理 SSE 数据格式
                        if (trimmedLine.startsWith('data: ')) {
                            const data = trimmedLine.substring(6);

                            // 检查是否是结束信号
                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);

                                if (parsed.choices && parsed.choices.length > 0) {
                                    const delta = parsed.choices[0].delta;

                                    if (delta && delta.content) {
                                        fullContent += delta.content;

                                        // 调用回调函数，传递增量内容
                                        if (onChunk) {
                                            onChunk(delta.content);
                                        }
                                    }
                                }
                            } catch (parseError) {
                                console.error('解析流式数据失败:', parseError.message);
                            }
                        }
                    }
                } catch (error) {
                    console.error('处理流式数据块失败:', error.message);
                }
            });

            response.data.on('end', () => {
                resolve(fullContent);
            });

            response.data.on('error', (error) => {
                reject(formatError(error));
            });
        });
    } catch (error) {
        // 判断是否需要重试
        const shouldRetry = retryCount < deepseekConfig.retry.maxRetries &&
            isRetryableError(error);

        if (shouldRetry) {
            console.log(`DeepSeek API 流式请求失败，${deepseekConfig.retry.retryDelay}ms 后重试 (${retryCount + 1}/${deepseekConfig.retry.maxRetries})`);

            // 等待后重试
            await sleep(deepseekConfig.retry.retryDelay);
            return makeStreamRequest(data, onChunk, retryCount + 1);
        }

        // 格式化错误信息
        throw formatError(error);
    }
}

/**
 * 判断错误是否可重试
 * @param {Error} error - 错误对象
 * @returns {boolean}
 */
function isRetryableError(error) {
    // 网络错误或超时错误可重试
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return true;
    }

    // 5xx 服务器错误可重试
    if (error.response && error.response.status >= 500) {
        return true;
    }

    // 429 限流错误可重试
    if (error.response && error.response.status === 429) {
        return true;
    }

    return false;
}

/**
 * 格式化错误信息
 * @param {Error} error - 原始错误对象
 * @returns {Error} 格式化后的错误
 */
function formatError(error) {
    if (error.response) {
        // API 返回了错误响应
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.response.statusText;

        if (status === 401) {
            return new Error('DeepSeek API 密钥无效');
        } else if (status === 429) {
            return new Error('DeepSeek API 请求频率超限，请稍后重试');
        } else if (status >= 500) {
            return new Error('DeepSeek API 服务异常，请稍后重试');
        } else {
            return new Error(`DeepSeek API 错误: ${message}`);
        }
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        // 请求超时
        return new Error('DeepSeek API 请求超时，请稍后重试');
    } else if (error.request) {
        // 请求已发送但没有收到响应
        return new Error('DeepSeek API 无响应，请检查网络连接');
    } else {
        // 其他错误
        return new Error(`DeepSeek API 调用失败: ${error.message}`);
    }
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 构建文档分析的对话上下文（通用版本）
 * @param {string} documentText - 文档文本内容
 * @param {string} question - 用户问题
 * @param {Array} conversationHistory - 对话历史（可选）
 * @param {string} documentType - 文档类型提示（可选）
 * @returns {Array} 格式化的消息数组
 */
function buildDocumentContext(documentText, question, conversationHistory = [], documentType = null) {
    // 根据文档类型或内容特征，智能选择系统提示
    let systemPrompt = '你是一位专业的文档分析助手，擅长理解和分析各类文档内容。请基于用户提供的文档内容，回答用户的问题。回答要专业、准确、有建设性。';

    // 如果指定了文档类型，使用更具体的提示
    if (documentType === 'resume') {
        systemPrompt = '你是一位专业的简历分析师和职业顾问，擅长分析简历内容并提供专业的优化建议。请基于用户提供的简历内容，回答用户的问题。回答要专业、具体、有建设性。';
    } else if (documentType === 'job') {
        systemPrompt = '你是一位专业的职位分析师，擅长解读职位描述（JD）和岗位要求。请基于用户提供的职位信息，回答用户的问题。回答要专业、准确、有针对性。';
    } else if (documentType === 'report') {
        systemPrompt = '你是一位专业的报告分析师，擅长理解和总结各类报告内容。请基于用户提供的报告内容，回答用户的问题。回答要专业、清晰、有洞察力。';
    }
    // 如果没有指定类型，尝试从内容中智能判断
    else if (documentText) {
        const lowerText = documentText.toLowerCase();
        if (lowerText.includes('工作经历') || lowerText.includes('教育背景') || lowerText.includes('项目经验')) {
            systemPrompt = '你是一位专业的简历分析师和职业顾问，擅长分析简历内容并提供专业的优化建议。请基于用户提供的简历内容，回答用户的问题。回答要专业、具体、有建设性。';
        } else if (lowerText.includes('岗位职责') || lowerText.includes('任职要求') || lowerText.includes('job description')) {
            systemPrompt = '你是一位专业的职位分析师，擅长解读职位描述（JD）和岗位要求。请基于用户提供的职位信息，回答用户的问题。回答要专业、准确、有针对性。';
        }
    }

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: `这是文档内容：\n\n${documentText}`
        }
    ];

    // 添加对话历史
    if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
    }

    // 添加当前问题
    messages.push({
        role: 'user',
        content: question
    });

    return messages;
}

/**
 * 构建简历分析的对话上下文（兼容旧接口）
 * @param {string} resumeText - 简历文本内容
 * @param {string} question - 用户问题
 * @param {Array} conversationHistory - 对话历史（可选）
 * @returns {Array} 格式化的消息数组
 */
function buildResumeContext(resumeText, question, conversationHistory = []) {
    return buildDocumentContext(resumeText, question, conversationHistory, 'resume');
}

module.exports = {
    chat,
    chatStream,
    buildResumeContext,
    buildDocumentContext
};
