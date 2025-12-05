/**
 * 简历管理 API 测试脚本
 * 
 * 测试所有简历相关的后端API接口
 * 包括：上传、列表查询、详情查询、删除、AI问答
 * 
 * 使用方法：
 * 1. 确保服务器正在运行
 * 2. 配置测试环境变量（TEST_OPENID, TEST_API_URL）
 * 3. 运行: node test-resume-api.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 测试配置
const CONFIG = {
    API_URL: process.env.TEST_API_URL || 'http://localhost:3000',
    TEST_OPENID: process.env.TEST_OPENID || 'test_openid_12345',
    TEST_FILES_DIR: path.join(__dirname, 'test-files')
};

// 测试结果统计
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// 测试数据存储
let testResumeId = null;

/**
 * 打印测试结果
 */
function printResult(testName, passed, message = '') {
    stats.total++;
    if (passed) {
        stats.passed++;
        console.log(`✅ ${testName}`);
    } else {
        stats.failed++;
        console.log(`❌ ${testName}`);
        if (message) {
            console.log(`   错误: ${message}`);
            stats.errors.push({ test: testName, error: message });
        }
    }
}

/**
 * 创建测试文件
 */
function createTestFiles() {
    if (!fs.existsSync(CONFIG.TEST_FILES_DIR)) {
        fs.mkdirSync(CONFIG.TEST_FILES_DIR, { recursive: true });
    }

    // 创建测试 PDF 文件（模拟）
    const pdfPath = path.join(CONFIG.TEST_FILES_DIR, 'test-resume.pdf');
    if (!fs.existsSync(pdfPath)) {
        fs.writeFileSync(pdfPath, 'Mock PDF content for testing');
    }

    // 创建测试 Markdown 文件
    const mdPath = path.join(CONFIG.TEST_FILES_DIR, 'test-resume.md');
    if (!fs.existsSync(mdPath)) {
        const mdContent = `# 张三的简历

## 个人信息
- 姓名：张三
- 邮箱：zhangsan@example.com
- 电话：13800138000

## 工作经历
### 数据工程师 | ABC公司 | 2020-2023
- 负责大数据平台开发
- 使用 Spark、Flink 处理海量数据
- 优化数据处理性能，提升 30%

## 教育背景
- 计算机科学与技术 | 某大学 | 2016-2020

## 技能
- 编程语言：Python, Java, Scala
- 大数据技术：Hadoop, Spark, Flink, Kafka
- 数据库：MySQL, MongoDB, Redis
`;
        fs.writeFileSync(mdPath, mdContent);
    }

    // 创建大文件（超过10MB）
    const largePath = path.join(CONFIG.TEST_FILES_DIR, 'large-file.md');
    if (!fs.existsSync(largePath)) {
        const largeContent = 'A'.repeat(11 * 1024 * 1024); // 11MB
        fs.writeFileSync(largePath, largeContent);
    }

    // 创建不支持的文件格式
    const unsupportedPath = path.join(CONFIG.TEST_FILES_DIR, 'test.txt');
    if (!fs.existsSync(unsupportedPath)) {
        fs.writeFileSync(unsupportedPath, 'Unsupported file format');
    }
}

/**
 * 测试1: 上传简历 - 成功场景
 */
async function test1_uploadResume_success() {
    try {
        const formData = new FormData();
        const filePath = path.join(CONFIG.TEST_FILES_DIR, 'test-resume.md');
        formData.append('file', fs.createReadStream(filePath));
        formData.append('openid', CONFIG.TEST_OPENID);

        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/upload`,
            formData,
            {
                headers: formData.getHeaders()
            }
        );

        const passed = response.data.code === 0 && response.data.data.id;
        if (passed) {
            testResumeId = response.data.data.id;
        }
        printResult('测试1: 上传简历 - 成功场景', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试1: 上传简历 - 成功场景', false, error.message);
    }
}

/**
 * 测试2: 上传简历 - 文件格式错误
 */
async function test2_uploadResume_invalidFormat() {
    try {
        const formData = new FormData();
        const filePath = path.join(CONFIG.TEST_FILES_DIR, 'test.txt');
        formData.append('file', fs.createReadStream(filePath));
        formData.append('openid', CONFIG.TEST_OPENID);

        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/upload`,
            formData,
            {
                headers: formData.getHeaders(),
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('格式');
        printResult('测试2: 上传简历 - 文件格式错误', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试2: 上传简历 - 文件格式错误', false, error.message);
    }
}

/**
 * 测试3: 上传简历 - 文件过大
 */
async function test3_uploadResume_fileTooLarge() {
    try {
        const formData = new FormData();
        const filePath = path.join(CONFIG.TEST_FILES_DIR, 'large-file.md');
        formData.append('file', fs.createReadStream(filePath));
        formData.append('openid', CONFIG.TEST_OPENID);

        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/upload`,
            formData,
            {
                headers: formData.getHeaders(),
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('10MB');
        printResult('测试3: 上传简历 - 文件过大', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试3: 上传简历 - 文件过大', false, error.message);
    }
}

/**
 * 测试4: 上传简历 - 缺少OpenID
 */
async function test4_uploadResume_missingOpenid() {
    try {
        const formData = new FormData();
        const filePath = path.join(CONFIG.TEST_FILES_DIR, 'test-resume.md');
        formData.append('file', fs.createReadStream(filePath));

        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/upload`,
            formData,
            {
                headers: formData.getHeaders(),
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('OpenID');
        printResult('测试4: 上传简历 - 缺少OpenID', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试4: 上传简历 - 缺少OpenID', false, error.message);
    }
}

/**
 * 测试5: 获取简历列表 - 成功场景
 */
async function test5_getResumeList_success() {
    try {
        const response = await axios.get(
            `${CONFIG.API_URL}/api/resume/list`,
            {
                params: { openid: CONFIG.TEST_OPENID }
            }
        );

        const passed = response.data.code === 0 &&
            Array.isArray(response.data.data.resumes) &&
            response.data.data.total >= 0 &&
            response.data.data.limit === 3;
        printResult('测试5: 获取简历列表 - 成功场景', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试5: 获取简历列表 - 成功场景', false, error.message);
    }
}

/**
 * 测试6: 获取简历列表 - 缺少OpenID
 */
async function test6_getResumeList_missingOpenid() {
    try {
        const response = await axios.get(
            `${CONFIG.API_URL}/api/resume/list`,
            {
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0;
        printResult('测试6: 获取简历列表 - 缺少OpenID', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试6: 获取简历列表 - 缺少OpenID', false, error.message);
    }
}

/**
 * 测试7: 获取简历详情 - 成功场景
 */
async function test7_getResumeDetail_success() {
    if (!testResumeId) {
        printResult('测试7: 获取简历详情 - 成功场景', false, '没有可用的测试简历ID');
        return;
    }

    try {
        const response = await axios.get(
            `${CONFIG.API_URL}/api/resume/${testResumeId}`,
            {
                params: { openid: CONFIG.TEST_OPENID }
            }
        );

        const passed = response.data.code === 0 &&
            response.data.data.id === testResumeId &&
            response.data.data.parsedText;
        printResult('测试7: 获取简历详情 - 成功场景', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试7: 获取简历详情 - 成功场景', false, error.message);
    }
}

/**
 * 测试8: 获取简历详情 - 简历不存在
 */
async function test8_getResumeDetail_notFound() {
    try {
        const response = await axios.get(
            `${CONFIG.API_URL}/api/resume/999999`,
            {
                params: { openid: CONFIG.TEST_OPENID },
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('不存在');
        printResult('测试8: 获取简历详情 - 简历不存在', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试8: 获取简历详情 - 简历不存在', false, error.message);
    }
}

/**
 * 测试9: 获取简历详情 - 权限验证
 */
async function test9_getResumeDetail_unauthorized() {
    if (!testResumeId) {
        printResult('测试9: 获取简历详情 - 权限验证', false, '没有可用的测试简历ID');
        return;
    }

    try {
        const response = await axios.get(
            `${CONFIG.API_URL}/api/resume/${testResumeId}`,
            {
                params: { openid: 'wrong_openid' },
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('权限');
        printResult('测试9: 获取简历详情 - 权限验证', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试9: 获取简历详情 - 权限验证', false, error.message);
    }
}

/**
 * 测试10: AI问答 - 成功场景
 */
async function test10_chat_success() {
    if (!testResumeId) {
        printResult('测试10: AI问答 - 成功场景', false, '没有可用的测试简历ID');
        return;
    }

    try {
        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/chat`,
            {
                openid: CONFIG.TEST_OPENID,
                resumeId: testResumeId,
                question: '简历的主要亮点是什么？',
                conversationHistory: []
            }
        );

        const passed = response.data.code === 0 &&
            response.data.data.answer &&
            response.data.data.timestamp;
        printResult('测试10: AI问答 - 成功场景', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试10: AI问答 - 成功场景', false, error.message);
    }
}

/**
 * 测试11: AI问答 - 缺少问题
 */
async function test11_chat_missingQuestion() {
    if (!testResumeId) {
        printResult('测试11: AI问答 - 缺少问题', false, '没有可用的测试简历ID');
        return;
    }

    try {
        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/chat`,
            {
                openid: CONFIG.TEST_OPENID,
                resumeId: testResumeId,
                question: '',
                conversationHistory: []
            },
            {
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0;
        printResult('测试11: AI问答 - 缺少问题', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试11: AI问答 - 缺少问题', false, error.message);
    }
}

/**
 * 测试12: AI问答 - 权限验证
 */
async function test12_chat_unauthorized() {
    if (!testResumeId) {
        printResult('测试12: AI问答 - 权限验证', false, '没有可用的测试简历ID');
        return;
    }

    try {
        const response = await axios.post(
            `${CONFIG.API_URL}/api/resume/chat`,
            {
                openid: 'wrong_openid',
                resumeId: testResumeId,
                question: '简历的主要亮点是什么？',
                conversationHistory: []
            },
            {
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('权限');
        printResult('测试12: AI问答 - 权限验证', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试12: AI问答 - 权限验证', false, error.message);
    }
}

/**
 * 测试13: 删除简历 - 成功场景
 */
async function test13_deleteResume_success() {
    if (!testResumeId) {
        printResult('测试13: 删除简历 - 成功场景', false, '没有可用的测试简历ID');
        return;
    }

    try {
        const response = await axios.delete(
            `${CONFIG.API_URL}/api/resume/${testResumeId}`,
            {
                data: { openid: CONFIG.TEST_OPENID }
            }
        );

        const passed = response.data.code === 0;
        printResult('测试13: 删除简历 - 成功场景', passed, !passed ? JSON.stringify(response.data) : '');

        // 清空测试ID
        if (passed) {
            testResumeId = null;
        }
    } catch (error) {
        printResult('测试13: 删除简历 - 成功场景', false, error.message);
    }
}

/**
 * 测试14: 删除简历 - 简历不存在
 */
async function test14_deleteResume_notFound() {
    try {
        const response = await axios.delete(
            `${CONFIG.API_URL}/api/resume/999999`,
            {
                data: { openid: CONFIG.TEST_OPENID },
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('不存在');
        printResult('测试14: 删除简历 - 简历不存在', passed, !passed ? JSON.stringify(response.data) : '');
    } catch (error) {
        printResult('测试14: 删除简历 - 简历不存在', false, error.message);
    }
}

/**
 * 测试15: 删除简历 - 权限验证
 */
async function test15_deleteResume_unauthorized() {
    // 先上传一个新简历用于测试
    try {
        const formData = new FormData();
        const filePath = path.join(CONFIG.TEST_FILES_DIR, 'test-resume.md');
        formData.append('file', fs.createReadStream(filePath));
        formData.append('openid', CONFIG.TEST_OPENID);

        const uploadResponse = await axios.post(
            `${CONFIG.API_URL}/api/resume/upload`,
            formData,
            {
                headers: formData.getHeaders()
            }
        );

        if (uploadResponse.data.code !== 0) {
            printResult('测试15: 删除简历 - 权限验证', false, '无法创建测试简历');
            return;
        }

        const resumeId = uploadResponse.data.data.id;

        // 尝试用错误的openid删除
        const response = await axios.delete(
            `${CONFIG.API_URL}/api/resume/${resumeId}`,
            {
                data: { openid: 'wrong_openid' },
                validateStatus: () => true
            }
        );

        const passed = response.data.code !== 0 && response.data.message.includes('权限');
        printResult('测试15: 删除简历 - 权限验证', passed, !passed ? JSON.stringify(response.data) : '');

        // 清理：用正确的openid删除
        await axios.delete(
            `${CONFIG.API_URL}/api/resume/${resumeId}`,
            {
                data: { openid: CONFIG.TEST_OPENID }
            }
        );
    } catch (error) {
        printResult('测试15: 删除简历 - 权限验证', false, error.message);
    }
}

/**
 * 主测试函数
 */
async function runTests() {
    console.log('='.repeat(60));
    console.log('简历管理 API 测试');
    console.log('='.repeat(60));
    console.log(`API地址: ${CONFIG.API_URL}`);
    console.log(`测试OpenID: ${CONFIG.TEST_OPENID}`);
    console.log('='.repeat(60));
    console.log('');

    // 创建测试文件
    console.log('准备测试文件...');
    createTestFiles();
    console.log('');

    // 运行测试
    console.log('开始测试...');
    console.log('');

    // 上传测试
    await test1_uploadResume_success();
    await test2_uploadResume_invalidFormat();
    await test3_uploadResume_fileTooLarge();
    await test4_uploadResume_missingOpenid();

    // 列表查询测试
    await test5_getResumeList_success();
    await test6_getResumeList_missingOpenid();

    // 详情查询测试
    await test7_getResumeDetail_success();
    await test8_getResumeDetail_notFound();
    await test9_getResumeDetail_unauthorized();

    // AI问答测试
    await test10_chat_success();
    await test11_chat_missingQuestion();
    await test12_chat_unauthorized();

    // 删除测试
    await test13_deleteResume_success();
    await test14_deleteResume_notFound();
    await test15_deleteResume_unauthorized();

    // 打印测试结果
    console.log('');
    console.log('='.repeat(60));
    console.log('测试结果');
    console.log('='.repeat(60));
    console.log(`总计: ${stats.total}`);
    console.log(`通过: ${stats.passed}`);
    console.log(`失败: ${stats.failed}`);
    console.log(`成功率: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);

    if (stats.errors.length > 0) {
        console.log('');
        console.log('失败的测试:');
        stats.errors.forEach((err, index) => {
            console.log(`${index + 1}. ${err.test}`);
            console.log(`   ${err.error}`);
        });
    }

    console.log('='.repeat(60));

    // 返回退出码
    process.exit(stats.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
});
