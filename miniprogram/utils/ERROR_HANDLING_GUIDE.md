# 增强错误处理和用户体验指南

## 概述

本指南介绍了知识库题目点击失败修复项目中实现的增强错误处理和用户体验功能。这些功能旨在提供更友好的错误提示、更多的恢复选项，以及更好的加载状态管理。

## 核心功能

### 1. 用户友好的错误提示

#### 特性
- **具体错误信息**：替换通用的"操作失败"为具体的错误原因
- **多种恢复选项**：提供重试、刷新、返回等多种选择
- **高级恢复选项**：包括网络诊断、清理缓存、联系技术支持等
- **错误分类处理**：根据错误类型显示不同的处理建议

#### 使用方法

```javascript
const ErrorHandler = require('../../utils/error-handler.js');

// 基本用法
ErrorHandler.showUserFriendlyError('NETWORK_ERROR', {
    customMessage: '网络连接失败，请检查网络设置',
    onRetry: () => {
        // 重试逻辑
    },
    showAdvancedOptions: true
});

// 高级用法
ErrorHandler.showUserFriendlyError('API_ERROR', {
    customTitle: '服务请求失败',
    customMessage: '服务暂时不可用，请稍后重试',
    onRetry: () => { /* 重试 */ },
    onRefresh: () => { /* 刷新页面 */ },
    onGoBack: () => { /* 返回上页 */ },
    showAdvancedOptions: true
});
```

### 2. 智能加载状态管理

#### 特性
- **进度提示**：显示加载步骤和进度
- **超时处理**：自动检测加载超时并提供处理选项
- **并发管理**：智能管理多个并发加载任务
- **加载队列**：支持优先级和队列管理

#### 使用方法

```javascript
// 基本加载提示
ErrorHandler.showLoading('加载中...', {
    timeout: 30000,
    onTimeout: () => {
        console.log('加载超时');
    }
});

// 进度加载
const controller = ErrorHandler.showProgressLoading('加载知识库...', {
    timeout: 25000,
    steps: ['连接服务器...', '获取数据...', '处理数据...'],
    onTimeout: () => {
        // 超时处理
    }
});

// 更新进度
controller.updateMessage('新的加载状态...');

// 完成加载
controller.finish();

// 错误处理
controller.error(new Error('加载失败'));
```

#### 加载管理器

```javascript
const manager = new ErrorHandler.LoadingManager();

// 开始加载任务
manager.start('task1', '任务1加载中...', {
    timeout: 15000,
    priority: 1,
    onTimeout: () => {
        // 超时处理
    }
});

// 更新消息
manager.updateMessage('task1', '新的加载消息...');

// 完成任务
manager.finish('task1');

// 获取状态
const status = manager.getStatus();
```

### 3. 重试机制

#### 特性
- **智能重试**：根据错误类型自动选择重试策略
- **指数退避**：支持指数退避算法
- **重试回调**：提供重试过程中的回调函数
- **最终失败处理**：所有重试失败后的处理机制

#### 使用方法

```javascript
await ErrorHandler.retryOperation(async () => {
    // 可能失败的操作
    return await someApiCall();
}, {
    configType: 'api', // 使用API重试配置
    onRetry: (attempt, delay, error) => {
        console.log(`第 ${attempt} 次重试，${delay}ms 后执行`);
    },
    onFinalFailure: (error) => {
        console.error('所有重试都失败:', error);
    }
});
```

### 4. 错误恢复选项

#### 可用选项
- **重新加载应用**：完全重启应用
- **清理缓存**：清理应用缓存数据
- **网络诊断**：检测网络连接状态
- **复制错误信息**：复制详细错误信息
- **联系技术支持**：显示技术支持联系方式
- **检查网络设置**：指导用户检查网络设置
- **切换网络**：提供网络切换建议
- **离线模式**：启用离线模式

#### 使用方法

```javascript
// 显示错误恢复选项
ErrorHandler.showErrorRecoveryOptions('NETWORK_ERROR');

// 处理特定恢复操作
ErrorHandler.handleErrorRecoveryAction('清理缓存', 'DATA_ERROR');
```

## 错误类型和配置

### 支持的错误类型

| 错误类型 | 描述 | 严重级别 | 可重试 |
|---------|------|----------|--------|
| NETWORK_ERROR | 网络连接错误 | HIGH | 是 |
| API_ERROR | API调用错误 | MEDIUM | 是 |
| DATA_ERROR | 数据加载错误 | MEDIUM | 是 |
| MEMBER_ERROR | 会员验证错误 | LOW | 否 |
| NAVIGATION_ERROR | 页面跳转错误 | HIGH | 是 |

### 重试配置

```javascript
const RetryConfig = {
    default: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        maxDelay: 10000
    },
    network: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        maxDelay: 8000
    },
    api: {
        maxRetries: 2,
        retryDelay: 1500,
        exponentialBackoff: true,
        maxDelay: 6000
    }
};
```

### 加载配置

```javascript
const LoadingConfig = {
    defaultTimeout: 30000,
    timeouts: {
        navigation: 10000,
        api: 15000,
        dataLoad: 20000,
        memberCheck: 10000,
        fileUpload: 60000
    },
    maxConcurrentLoading: 3
};
```

## 实际应用示例

### 知识库页面加载

```javascript
// 在 pages/knowledge/index.js 中
async loadFromApi() {
    const ErrorHandler = require('../../utils/error-handler.js');
    
    const loadingController = ErrorHandler.showProgressLoading('加载知识库...', {
        timeout: 25000,
        steps: ['连接服务器...', '获取分类...', '加载题目...'],
        onTimeout: () => {
            this.handleLoadTimeout();
        }
    });

    try {
        const categories = await knowledgeApi.getCategories();
        loadingController.updateMessage('获取题目数据...');
        
        const result = await knowledgeApi.getQuestions({
            page: 1,
            pageSize: 1000
        });

        loadingController.finish();
        
        // 更新页面数据
        this.setData({
            categories: categories || [],
            topics: result.list || [],
            loading: false,
            error: null
        });

        ErrorHandler.showSuccess('知识库加载完成');

    } catch (error) {
        loadingController.error(error);
        await this.handleApiLoadError(error);
        throw error;
    }
}
```

### 页面跳转错误处理

```javascript
// 在 pages/knowledge/index.js 中
handleNavigationFailure(error, question, retryCount) {
    const ErrorHandler = require('../../utils/error-handler.js');

    let errorType = 'NAVIGATION_ERROR';
    let customMessage = '页面跳转失败，请重试';

    if (error.message === 'ALL_NAVIGATION_METHODS_FAILED') {
        customMessage = '页面跳转遇到问题，可能是系统繁忙或数据异常';
    } else if (error.message === 'DATA_PREPARATION_FAILED') {
        errorType = 'DATA_ERROR';
        customMessage = '数据准备失败，请检查网络连接后重试';
    }

    ErrorHandler.showUserFriendlyError(errorType, {
        customTitle: '页面跳转失败',
        customMessage: `${customMessage}\n\n已尝试 ${retryCount + 1} 次`,
        onRetry: () => {
            this.navigateToDetail(question, null, 0);
        },
        onRefresh: () => {
            this.refreshPage();
        },
        onGoBack: () => {
            this.showNavigationAlternatives(question);
        },
        showAdvancedOptions: true
    });
}
```

### 会员状态验证

```javascript
// 在 pages/knowledge/detail.js 中
async retryMemberCheck() {
    const ErrorHandler = require('../../utils/error-handler.js');
    
    const loadingController = ErrorHandler.showProgressLoading('验证会员状态...', {
        timeout: 10000,
        steps: ['连接服务器...', '验证身份...', '检查权限...'],
        onTimeout: () => {
            this.handleMemberCheckTimeout();
        }
    });

    try {
        const memberStatus = await this.checkMemberStatusWithFallback();
        loadingController.finish();

        if (memberStatus.isValid) {
            this.displayFullAnswer();
            ErrorHandler.showSuccess('会员验证成功');
        } else {
            this.displayMemberPrompt(memberStatus.reason);
            this.handleMemberCheckFailure(memberStatus);
        }
    } catch (error) {
        console.error('重试会员检查失败:', error);
        this.handleMemberCheckError(error);
    }
}
```

## 最佳实践

### 1. 错误处理原则
- **用户友好**：始终显示用户能理解的错误信息
- **提供选择**：给用户多种恢复选项
- **记录日志**：详细记录错误信息用于调试
- **渐进降级**：提供多层次的降级方案

### 2. 加载状态管理
- **及时反馈**：立即显示加载状态
- **进度提示**：显示具体的加载步骤
- **超时处理**：设置合理的超时时间
- **并发控制**：避免过多并发加载

### 3. 重试策略
- **智能重试**：根据错误类型选择是否重试
- **指数退避**：避免频繁重试造成服务压力
- **最大限制**：设置合理的最大重试次数
- **用户控制**：让用户决定是否继续重试

### 4. 用户体验
- **一致性**：保持错误处理的一致性
- **可预测性**：用户能预期错误处理的结果
- **可恢复性**：提供明确的恢复路径
- **可理解性**：使用用户能理解的语言

## 测试和验证

### 运行测试

```javascript
// 在小程序开发者工具控制台中运行
const test = require('./utils/error-handler.test.js');
test.runAllTests();
```

### 手动测试场景

1. **网络错误测试**
   - 断开网络连接
   - 尝试加载知识库
   - 验证错误提示和恢复选项

2. **加载超时测试**
   - 模拟慢网络环境
   - 验证超时处理机制

3. **页面跳转测试**
   - 清理应用数据
   - 尝试跳转到详情页
   - 验证数据恢复机制

4. **会员验证测试**
   - 模拟会员验证失败
   - 验证降级处理

## 总结

增强的错误处理和用户体验功能显著改善了应用的可用性和用户满意度。通过提供具体的错误信息、多种恢复选项和智能的加载状态管理，用户能够更好地理解和处理遇到的问题，从而提升整体的使用体验。

这些功能的实现遵循了现代前端开发的最佳实践，包括渐进增强、优雅降级和用户中心设计原则。