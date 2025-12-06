/**
 * 简历管理 API 客户端
 * 对接后端简历服务
 */

const CONFIG = require('../config.js')

/**
 * 错误类型映射
 */
const ERROR_MESSAGES = {
    // 网络错误
    'request:fail': '网络连接失败，请检查网络设置',
    'request:fail timeout': '请求超时，请稍后重试',
    'request:fail abort': '请求已取消',

    // 文件错误
    1001: '文件解析失败，请确认文件格式正确',
    1002: '数据存储失败，请稍后重试',
    1003: '文件保存失败，请稍后重试',
    1004: 'AI服务异常，请稍后重试',

    // 权限错误
    403: '无权限访问，请先开通会员',
    404: '资源不存在',

    // 业务错误
    'FILE_TOO_LARGE': '文件过大，请上传小于10MB的文件',
    'INVALID_FORMAT': '不支持的文件格式，请上传PDF、Word或Markdown文档',
    'LIMIT_EXCEEDED': '最多只能上传3个简历，请先删除旧简历',
    'MEMBER_REQUIRED': '此功能需要开通会员',
    'MEMBER_EXPIRED': '会员已过期，请续费后继续使用'
}

/**
 * 获取友好的错误提示
 */
function getFriendlyErrorMessage(error, code) {
    // 优先使用错误码映射
    if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code]
    }

    // 检查错误消息中的关键词
    if (error && typeof error === 'string') {
        if (error.includes('网络') || error.includes('network')) {
            return ERROR_MESSAGES['request:fail']
        }
        if (error.includes('超时') || error.includes('timeout')) {
            return ERROR_MESSAGES['request:fail timeout']
        }
        if (error.includes('文件格式') || error.includes('format')) {
            return ERROR_MESSAGES['INVALID_FORMAT']
        }
        if (error.includes('文件过大') || error.includes('too large')) {
            return ERROR_MESSAGES['FILE_TOO_LARGE']
        }
        if (error.includes('数量') || error.includes('limit')) {
            return ERROR_MESSAGES['LIMIT_EXCEEDED']
        }
        if (error.includes('会员') || error.includes('member')) {
            return ERROR_MESSAGES['MEMBER_REQUIRED']
        }
    }

    // 返回原始错误消息或默认消息
    return error || '操作失败，请稍后重试'
}

/**
 * HTTP请求封装
 */
function request(url, method = 'GET', data = null, isFormData = false) {
    return new Promise((resolve, reject) => {
        const token = wx.getStorageSync('token')

        const options = {
            url: `${CONFIG.apiBaseUrl}${url}`,
            method: method,
            header: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data)
                } else {
                    const errorMsg = getFriendlyErrorMessage(
                        res.data?.message,
                        res.data?.code || res.statusCode
                    )
                    reject(new Error(errorMsg))
                }
            },
            fail: (err) => {
                const errorMsg = getFriendlyErrorMessage(
                    err.errMsg,
                    null
                )
                reject(new Error(errorMsg))
            }
        }

        // 处理不同类型的数据
        if (isFormData) {
            // FormData 类型（文件上传）
            options.formData = data
        } else {
            // JSON 类型
            options.header['Content-Type'] = 'application/json'
            options.data = data
        }

        wx.request(options)
    })
}

/**
 * 上传简历文件
 * @param {string} filePath - 本地文件路径
 * @param {string} openid - 用户OpenID
 * @param {string} originalName - 原始文件名（可选）
 * @returns {Promise<Object>}
 */
async function uploadResume(filePath, openid, originalName = null) {
    try {
        const token = wx.getStorageSync('token')

        return new Promise((resolve, reject) => {
            wx.uploadFile({
                url: `${CONFIG.apiBaseUrl}/resume/upload`,
                filePath: filePath,
                name: 'file',
                formData: {
                    openid: openid,
                    originalName: originalName || '' // 传递原始文件名
                },
                header: {
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                success: (res) => {
                    try {
                        const data = JSON.parse(res.data)

                        if (data.code === 0) {
                            // 清除简历列表缓存
                            clearResumeCache()

                            resolve({
                                success: true,
                                resume: {
                                    id: data.data.id,
                                    filename: data.data.filename,
                                    uploadTime: data.data.uploadTime,
                                    parsedText: data.data.parsedText
                                }
                            })
                        } else {
                            // 使用友好的错误提示
                            const errorMsg = getFriendlyErrorMessage(data.message, data.code)
                            resolve({
                                success: false,
                                message: errorMsg,
                                code: data.code
                            })
                        }
                    } catch (parseError) {
                        console.error('解析响应失败:', parseError)
                        reject(new Error('服务器响应异常，请稍后重试'))
                    }
                },
                fail: (err) => {
                    console.error('上传请求失败:', err)
                    const errorMsg = getFriendlyErrorMessage(err.errMsg, null)
                    reject(new Error(errorMsg))
                }
            })
        })
    } catch (err) {
        console.error('上传简历异常:', err)
        return {
            success: false,
            message: getFriendlyErrorMessage(err.message, null)
        }
    }
}

/**
 * 获取简历列表
 * @param {string} openid - 用户OpenID
 * @param {boolean} useCache - 是否使用缓存
 * @returns {Promise<Object>}
 */
async function getResumeList(openid, useCache = true) {
    try {
        // 先尝试从缓存读取
        if (useCache) {
            const cachedList = wx.getStorageSync('resumeList')
            const cacheTime = wx.getStorageSync('resumeListTime')

            // 缓存有效期5分钟
            if (cachedList && cacheTime && (Date.now() - cacheTime < 300000)) {
                return {
                    success: true,
                    resumes: cachedList.resumes,
                    total: cachedList.total,
                    limit: cachedList.limit
                }
            }
        }

        // 从服务器获取
        const res = await request(`/resume/list?openid=${openid}`)

        if (res.code === 0) {
            const result = {
                success: true,
                resumes: res.data.resumes,
                total: res.data.total,
                limit: res.data.limit
            }

            // 缓存列表数据
            wx.setStorageSync('resumeList', {
                resumes: res.data.resumes,
                total: res.data.total,
                limit: res.data.limit
            })
            wx.setStorageSync('resumeListTime', Date.now())

            return result
        } else {
            const errorMsg = getFriendlyErrorMessage(res.message, res.code)
            return {
                success: false,
                message: errorMsg
            }
        }
    } catch (err) {
        console.error('获取简历列表失败:', err)
        const errorMsg = getFriendlyErrorMessage(err.message, null)
        return {
            success: false,
            message: errorMsg
        }
    }
}

/**
 * 获取简历详情
 * @param {number} resumeId - 简历ID
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function getResumeDetail(resumeId, openid) {
    try {
        const res = await request(`/resume/${resumeId}?openid=${openid}`)

        if (res.code === 0) {
            return {
                success: true,
                resume: {
                    id: res.data.id,
                    filename: res.data.filename,
                    filePath: res.data.filePath,
                    parsedText: res.data.parsedText,
                    fileSize: res.data.fileSize,
                    uploadTime: res.data.uploadTime
                }
            }
        } else {
            const errorMsg = getFriendlyErrorMessage(res.message, res.code)
            return {
                success: false,
                message: errorMsg,
                code: res.code
            }
        }
    } catch (err) {
        console.error('获取简历详情失败:', err)
        const errorMsg = getFriendlyErrorMessage(err.message, null)
        return {
            success: false,
            message: errorMsg
        }
    }
}

/**
 * 删除简历
 * @param {number} resumeId - 简历ID
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function deleteResume(resumeId, openid) {
    try {
        const res = await request(`/resume/${resumeId}`, 'DELETE', { openid: openid })

        if (res.code === 0) {
            // 清除简历列表缓存
            clearResumeCache()

            return {
                success: true,
                message: res.message
            }
        } else {
            const errorMsg = getFriendlyErrorMessage(res.message, res.code)
            return {
                success: false,
                message: errorMsg,
                code: res.code
            }
        }
    } catch (err) {
        console.error('删除简历失败:', err)
        const errorMsg = getFriendlyErrorMessage(err.message, null)
        return {
            success: false,
            message: errorMsg
        }
    }
}

/**
 * 基于简历的AI问答
 * @param {number} resumeId - 简历ID
 * @param {string} question - 用户问题
 * @param {string} openid - 用户OpenID
 * @param {Array} conversationHistory - 对话历史（可选）
 * @param {string} documentType - 文档类型（可选：'resume', 'job', 'report'）
 * @returns {Promise<Object>}
 */
async function chatWithResume(resumeId, question, openid, conversationHistory = [], documentType = null) {
    try {
        const res = await request('/resume/chat', 'POST', {
            openid: openid,
            resumeId: resumeId,
            question: question,
            conversationHistory: conversationHistory,
            documentType: documentType
        })

        if (res.code === 0) {
            return {
                success: true,
                answer: res.data.answer,
                timestamp: res.data.timestamp
            }
        } else {
            // 使用友好的错误提示
            const errorMsg = getFriendlyErrorMessage(res.message, res.code)
            return {
                success: false,
                message: errorMsg,
                code: res.code
            }
        }
    } catch (err) {
        console.error('AI问答失败:', err)
        const errorMsg = getFriendlyErrorMessage(err.message, null)
        return {
            success: false,
            message: errorMsg
        }
    }
}

/**
 * 清除简历列表缓存
 */
function clearResumeCache() {
    wx.removeStorageSync('resumeList')
    wx.removeStorageSync('resumeListTime')
}

/**
 * 刷新简历列表（强制从服务器获取）
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function refreshResumeList(openid) {
    clearResumeCache()
    return await getResumeList(openid, false)
}

module.exports = {
    uploadResume,
    getResumeList,
    getResumeDetail,
    deleteResume,
    chatWithResume,
    clearResumeCache,
    refreshResumeList
}
