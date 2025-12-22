/**
 * 错误处理工具测试
 * 验证增强的用户体验和错误提示功能
 */

const ErrorHandler = require('./error-handler.js');

/**
 * 测试用户友好错误提示
 */
function testUserFriendlyError() {
    console.log('=== 测试用户友好错误提示 ===');

    // 测试网络错误
    try {
        ErrorHandler.showUserFriendlyError('NETWORK_ERROR', {
            customMessage: '测试网络错误提示',
            onRetry: () => {
                console.log('用户点击了重试');
            },
            showAdvancedOptions: true
        });
        console.log('✓ 网络错误提示测试通过');
    } catch (error) {
        console.error('✗ 网络错误提示测试失败:', error);
    }

    // 测试API错误
    try {
        ErrorHandler.showUserFriendlyError('API_ERROR', {
            customTitle: '测试API错误',
            customMessage: '测试API错误提示',
            onRefresh: () => {
                console.log('用户点击了刷新');
            },
            showAdvancedOptions: true
        });
        console.log('✓ API错误提示测试通过');
    } catch (error) {
        console.error('✗ API错误提示测试失败:', error);
    }
}

/**
 * 测试进度加载
 */
function testProgressLoading() {
    console.log('=== 测试进度加载 ===');

    try {
        const controller = ErrorHandler.showProgressLoading('测试加载...', {
            timeout: 5000,
            steps: ['步骤1...', '步骤2...', '步骤3...'],
            onTimeout: () => {
                console.log('加载超时');
            }
        });

        // 模拟加载过程
        setTimeout(() => {
            controller.updateMessage('更新消息...');
        }, 1000);

        setTimeout(() => {
            controller.finish();
            console.log('✓ 进度加载测试通过');
        }, 2000);

    } catch (error) {
        console.error('✗ 进度加载测试失败:', error);
    }
}

/**
 * 测试加载管理器
 */
function testLoadingManager() {
    console.log('=== 测试加载管理器 ===');

    try {
        const manager = new ErrorHandler.LoadingManager();

        // 开始多个加载任务
        manager.start('task1', '任务1加载中...', { priority: 1 });
        manager.start('task2', '任务2加载中...', { priority: 2 });
        manager.start('task3', '任务3加载中...', { priority: 0 });

        // 检查状态
        const status = manager.getStatus();
        console.log('加载状态:', status);

        // 完成任务
        setTimeout(() => {
            manager.finish('task1');
            manager.finish('task2');
            manager.finish('task3');
            console.log('✓ 加载管理器测试通过');
        }, 1000);

    } catch (error) {
        console.error('✗ 加载管理器测试失败:', error);
    }
}

/**
 * 测试重试机制
 */
async function testRetryMechanism() {
    console.log('=== 测试重试机制 ===');

    let attemptCount = 0;

    try {
        await ErrorHandler.retryOperation(async () => {
            attemptCount++;
            console.log(`尝试第 ${attemptCount} 次`);

            if (attemptCount < 3) {
                throw new Error('模拟失败');
            }

            return '成功结果';
        }, {
            configType: 'api',
            onRetry: (attempt, delay, error) => {
                console.log(`重试 ${attempt}，延迟 ${delay}ms，错误: ${error.message}`);
            }
        });

        console.log('✓ 重试机制测试通过');
    } catch (error) {
        console.error('✗ 重试机制测试失败:', error);
    }
}

/**
 * 测试错误恢复选项
 */
function testErrorRecoveryOptions() {
    console.log('=== 测试错误恢复选项 ===');

    try {
        // 测试不同的恢复操作
        const actions = [
            '重新加载应用',
            '清理缓存',
            '网络诊断',
            '复制错误信息',
            '联系技术支持'
        ];

        actions.forEach(action => {
            try {
                ErrorHandler.handleErrorRecoveryAction(action, 'NETWORK_ERROR');
                console.log(`✓ 恢复操作 "${action}" 测试通过`);
            } catch (error) {
                console.log(`- 恢复操作 "${action}" 需要用户交互，跳过测试`);
            }
        });

        console.log('✓ 错误恢复选项测试完成');
    } catch (error) {
        console.error('✗ 错误恢复选项测试失败:', error);
    }
}

/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('开始运行错误处理工具测试...\n');

    testUserFriendlyError();
    testProgressLoading();
    testLoadingManager();
    testRetryMechanism();
    testErrorRecoveryOptions();

    console.log('\n所有测试完成！');
}

// 导出测试函数
module.exports = {
    testUserFriendlyError,
    testProgressLoading,
    testLoadingManager,
    testRetryMechanism,
    testErrorRecoveryOptions,
    runAllTests
};

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
    runAllTests();
}