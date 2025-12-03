/**
 * JWT 工具
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * 生成 JWT token
 * @param {Object} payload - 载荷数据
 * @returns {String} token
 */
function generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
}

/**
 * 验证 JWT token
 * @param {String} token - JWT token
 * @returns {Object|null} 解码后的数据，失败返回 null
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};
