module.exports = {
    // 测试环境
    testEnvironment: 'node',

    // 测试文件匹配模式
    testMatch: [
        '**/tests/**/*.test.js'
    ],

    // 覆盖率收集
    collectCoverageFrom: [
        'utils/**/*.js',
        'pages/**/*.js',
        '!**/node_modules/**',
        '!**/miniprogram_npm/**',
        '!**/knowledge-api/**'
    ],

    // 覆盖率阈值
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // 模块路径映射
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },

    // 忽略的路径
    testPathIgnorePatterns: [
        '/node_modules/',
        '/miniprogram_npm/',
        '/knowledge-api/'
    ],

    // 覆盖率报告格式
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov'
    ],

    // 详细输出
    verbose: true,

    // 清除mock
    clearMocks: true,

    // 超时时间
    testTimeout: 10000
}
