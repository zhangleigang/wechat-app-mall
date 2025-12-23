/**
 * 数据传递管理器
 * 提供多重存储和多源获取的数据传递机制
 * 解决页面跳转时数据丢失的问题
 */

const ErrorHandler = require('./error-handler.js');

/**
 * 数据存储键前缀
 */
const STORAGE_PREFIX = 'dt_'; // data-transfer prefix

/**
 * 数据过期时间（毫秒）
 */
const DATA_EXPIRE_TIME = 30 * 60 * 1000; // 30分钟

/**
 * 最大URL参数长度（微信小程序限制）
 */
const MAX_URL_LENGTH = 1000;

/**
 * 数据传递管理器类
 */
class DataTransferManager {
    /**
     * 设置题目数据（多重存储）
     * @param {Object} questionData - 题目数据
     * @param {string} dataId - 数据ID（可选，自动生成）
     * @returns {string} 数据ID
     */
    static setQuestionData(questionData, dataId = null) {
        try {
            // 生成或使用提供的数据ID
            const id = dataId || this.generateDataId();

            // 验证数据完整性
            if (!questionData || typeof questionData !== 'object') {
                throw new Error('Invalid question data');
            }

            // 添加元数据
            const dataWithMeta = {
                ...questionData,
                _meta: {
                    id: id,
                    timestamp: Date.now(),
                    expireTime: Date.now() + DATA_EXPIRE_TIME,
                    source: 'data-transfer'
                }
            };

            // 1. 存储到全局变量（最快访问）
            const app = getApp();
            if (app) {
                app.globalData = app.globalData || {};
                app.globalData.currentQuestion = dataWithMeta;
            }

            // 2. 存储到本地存储（持久化）
            const storageKey = STORAGE_PREFIX + id;
            wx.setStorageSync(storageKey, dataWithMeta);

            // 3. 记录数据ID到索引（用于清理过期数据）
            this.addToIndex(id);

            return id;
        } catch (error) {
            console.error('[DataTransfer] 设置数据失败:', error);
            ErrorHandler.showError(ErrorHandler.ErrorTypes.DATA_ERROR, {
                customMessage: '数据保存失败，请重试'
            });
            throw error;
        }
    }

    /**
     * 获取题目数据（多源获取）
     * @param {Object} options - 获取选项
     * @param {string} options.dataId - 数据ID
     * @param {Object} options.urlParams - URL参数（降级方案）
     * @param {boolean} options.allowExpired - 是否允许过期数据
     * @returns {Object|null} 题目数据
     */
    static getQuestionData(options = {}) {
        const {
            dataId,
            urlParams = {},
            allowExpired = false
        } = options;

        try {
            let questionData = null;

            // 1. 优先从全局变量获取
            questionData = this.getFromGlobalData();
            if (questionData && this.isDataValid(questionData, allowExpired)) {
                return this.cleanMetadata(questionData);
            }

            // 2. 从本地存储获取
            if (dataId) {
                questionData = this.getFromStorage(dataId);
                if (questionData && this.isDataValid(questionData, allowExpired)) {
                    // 恢复到全局变量
                    this.restoreToGlobalData(questionData);
                    return this.cleanMetadata(questionData);
                }
            }

            // 3. 从URL参数获取（兼容性降级）
            questionData = this.getFromUrlParams(urlParams);
            if (questionData) {
                // 重新存储到全局变量和本地存储
                const newId = this.setQuestionData(questionData);
                return questionData;
            }

            // 4. 所有方式都失败
            return null;

        } catch (error) {
            console.error('[DataTransfer] 获取数据失败:', error);
            ErrorHandler.showError(ErrorHandler.ErrorTypes.DATA_ERROR, {
                customMessage: '数据获取失败，请返回重试'
            });
            return null;
        }
    }

    /**
     * 清理题目数据
     * @param {string} dataId - 数据ID（可选）
     */
    static clearQuestionData(dataId = null) {
        try {
            // 清理全局变量
            const app = getApp();
            if (app && app.globalData && app.globalData.currentQuestion) {
                delete app.globalData.currentQuestion;
            }

            // 清理本地存储
            if (dataId) {
                const storageKey = STORAGE_PREFIX + dataId;
                wx.removeStorageSync(storageKey);
                this.removeFromIndex(dataId);
            }
        } catch (error) {
            console.error('[DataTransfer] 清理数据失败:', error);
        }
    }

    /**
     * 清理所有过期数据
     */
    static cleanupExpiredData() {
        try {
            const index = this.getIndex();
            const now = Date.now();
            let cleanedCount = 0;

            index.forEach(id => {
                const storageKey = STORAGE_PREFIX + id;
                const data = wx.getStorageSync(storageKey);

                if (data && data._meta && data._meta.expireTime < now) {
                    wx.removeStorageSync(storageKey);
                    this.removeFromIndex(id);
                    cleanedCount++;
                }
            });

            if (cleanedCount > 0) {
            }
        } catch (error) {
            console.error('[DataTransfer] 清理过期数据失败:', error);
        }
    }

    /**
     * 生成数据ID
     * @returns {string} 数据ID
     */
    static generateDataId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 从全局变量获取数据
     * @returns {Object|null} 数据
     */
    static getFromGlobalData() {
        try {
            const app = getApp();
            return app && app.globalData && app.globalData.currentQuestion || null;
        } catch (error) {
            console.error('[DataTransfer] 从全局变量获取数据失败:', error);
            return null;
        }
    }

    /**
     * 从本地存储获取数据
     * @param {string} dataId - 数据ID
     * @returns {Object|null} 数据
     */
    static getFromStorage(dataId) {
        try {
            const storageKey = STORAGE_PREFIX + dataId;
            return wx.getStorageSync(storageKey) || null;
        } catch (error) {
            console.error('[DataTransfer] 从本地存储获取数据失败:', error);
            return null;
        }
    }

    /**
     * 从URL参数获取数据
     * @param {Object} urlParams - URL参数
     * @returns {Object|null} 数据
     */
    static getFromUrlParams(urlParams) {
        try {
            const { id, question, answer, category, categoryName } = urlParams;

            if (!question) {
                return null;
            }

            return {
                id: id || this.generateDataId(),
                question: decodeURIComponent(question),
                answer: decodeURIComponent(answer || ''),
                category: category || '',
                categoryName: decodeURIComponent(categoryName || '')
            };
        } catch (error) {
            console.error('[DataTransfer] 从URL参数获取数据失败:', error);
            return null;
        }
    }

    /**
     * 恢复数据到全局变量
     * @param {Object} data - 数据
     */
    static restoreToGlobalData(data) {
        try {
            const app = getApp();
            if (app) {
                app.globalData = app.globalData || {};
                app.globalData.currentQuestion = data;
            }
        } catch (error) {
            console.error('[DataTransfer] 恢复数据到全局变量失败:', error);
        }
    }

    /**
     * 验证数据有效性
     * @param {Object} data - 数据
     * @param {boolean} allowExpired - 是否允许过期数据
     * @returns {boolean} 是否有效
     */
    static isDataValid(data, allowExpired = false) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // 检查必要字段
        if (!data.question) {
            return false;
        }

        // 检查过期时间
        if (!allowExpired && data._meta && data._meta.expireTime) {
            return Date.now() < data._meta.expireTime;
        }

        return true;
    }

    /**
     * 清理元数据
     * @param {Object} data - 数据
     * @returns {Object} 清理后的数据
     */
    static cleanMetadata(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const { _meta, ...cleanData } = data;
        return cleanData;
    }

    /**
     * 获取数据索引
     * @returns {Array} 数据ID数组
     */
    static getIndex() {
        try {
            return wx.getStorageSync(STORAGE_PREFIX + 'index') || [];
        } catch (error) {
            console.error('[DataTransfer] 获取索引失败:', error);
            return [];
        }
    }

    /**
     * 添加到索引
     * @param {string} dataId - 数据ID
     */
    static addToIndex(dataId) {
        try {
            const index = this.getIndex();
            if (!index.includes(dataId)) {
                index.push(dataId);
                wx.setStorageSync(STORAGE_PREFIX + 'index', index);
            }
        } catch (error) {
            console.error('[DataTransfer] 添加到索引失败:', error);
        }
    }

    /**
     * 从索引移除
     * @param {string} dataId - 数据ID
     */
    static removeFromIndex(dataId) {
        try {
            const index = this.getIndex();
            const newIndex = index.filter(id => id !== dataId);
            wx.setStorageSync(STORAGE_PREFIX + 'index', newIndex);
        } catch (error) {
            console.error('[DataTransfer] 从索引移除失败:', error);
        }
    }

    /**
     * 创建安全的跳转URL
     * @param {string} basePath - 基础路径
     * @param {Object} questionData - 题目数据
     * @returns {Object} 跳转信息 { url, dataId }
     */
    static createSafeNavigationUrl(basePath, questionData) {
        try {
            // 存储数据并获取ID
            const dataId = this.setQuestionData(questionData);

            // 构建基础URL
            let url = `${basePath}?dataId=${dataId}`;

            // 如果URL不会太长，添加关键参数作为降级方案
            const fallbackParams = `&id=${encodeURIComponent(questionData.id || '')}&category=${encodeURIComponent(questionData.category || '')}`;

            if ((url + fallbackParams).length < MAX_URL_LENGTH) {
                url += fallbackParams;
            }

            return { url, dataId };
        } catch (error) {
            console.error('[DataTransfer] 创建安全跳转URL失败:', error);
            throw error;
        }
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    static getStats() {
        try {
            const index = this.getIndex();
            const now = Date.now();
            let validCount = 0;
            let expiredCount = 0;

            index.forEach(id => {
                const data = this.getFromStorage(id);
                if (data && data._meta) {
                    if (data._meta.expireTime > now) {
                        validCount++;
                    } else {
                        expiredCount++;
                    }
                }
            });

            return {
                total: index.length,
                valid: validCount,
                expired: expiredCount,
                hasGlobalData: !!this.getFromGlobalData()
            };
        } catch (error) {
            console.error('[DataTransfer] 获取统计信息失败:', error);
            return { total: 0, valid: 0, expired: 0, hasGlobalData: false };
        }
    }
}

module.exports = DataTransferManager;