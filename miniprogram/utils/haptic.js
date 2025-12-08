/**
 * 触觉反馈工具
 * 提供统一的震动反馈接口
 */

/**
 * 轻微震动 - 用于按钮点击等轻量交互
 */
function light() {
    try {
        wx.vibrateShort({
            type: 'light'
        });
    } catch (error) {
        console.warn('触觉反馈失败:', error);
    }
}

/**
 * 中等震动 - 用于成功操作、重要交互
 */
function medium() {
    try {
        wx.vibrateShort({
            type: 'medium'
        });
    } catch (error) {
        console.warn('触觉反馈失败:', error);
    }
}

/**
 * 强烈震动 - 用于警告、错误、删除等重要操作
 */
function heavy() {
    try {
        wx.vibrateShort({
            type: 'heavy'
        });
    } catch (error) {
        console.warn('触觉反馈失败:', error);
    }
}

/**
 * 成功反馈 - 双击震动
 */
function success() {
    try {
        wx.vibrateShort({
            type: 'medium'
        });
        setTimeout(() => {
            wx.vibrateShort({
                type: 'light'
            });
        }, 100);
    } catch (error) {
        console.warn('触觉反馈失败:', error);
    }
}

/**
 * 错误反馈 - 三次短震动
 */
function error() {
    try {
        wx.vibrateShort({
            type: 'heavy'
        });
        setTimeout(() => {
            wx.vibrateShort({
                type: 'heavy'
            });
        }, 100);
        setTimeout(() => {
            wx.vibrateShort({
                type: 'heavy'
            });
        }, 200);
    } catch (error) {
        console.warn('触觉反馈失败:', error);
    }
}

/**
 * 选择反馈 - 用于选择、切换操作
 */
function selection() {
    try {
        wx.vibrateShort({
            type: 'light'
        });
    } catch (error) {
        console.warn('触觉反馈失败:', error);
    }
}

module.exports = {
    light,
    medium,
    heavy,
    success,
    error,
    selection
};
