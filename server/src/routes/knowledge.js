/**
 * 知识库路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 加载知识库数据
let knowledgeData = null;

function loadKnowledgeData() {
    if (!knowledgeData) {
        const dataPath = path.join(__dirname, '../data/knowledge.json');
        knowledgeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log('✅ 知识库数据已加载');
    }
    return knowledgeData;
}

/**
 * 获取分类列表
 * GET /api/knowledge/categories
 */
router.get('/categories', (req, res) => {
    try {
        const data = loadKnowledgeData();

        // 统计每个分类的题目数量
        const categoryCounts = {};
        data.questions.forEach(q => {
            const key = q.categoryKey;
            categoryCounts[key] = (categoryCounts[key] || 0) + 1;
        });

        const categories = data.categories.map(cat => ({
            key: cat.key,
            name: cat.name,
            icon: cat.icon,
            count: categoryCounts[cat.key] || 0
        }));

        res.json({
            code: 0,
            data: categories
        });
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.json({ code: -1, msg: '获取失败' });
    }
});

/**
 * 获取题目列表
 * GET /api/knowledge/questions?category=hdfs&page=1&pageSize=20&keyword=搜索词
 */
router.get('/questions', (req, res) => {
    try {
        const data = loadKnowledgeData();
        const { category, page = 1, pageSize = 20, keyword } = req.query;

        let questions = data.questions || [];

        // 按分类筛选
        if (category) {
            questions = questions.filter(q => q.categoryKey === category);
        }

        // 添加分类名称
        questions = questions.map(q => {
            const cat = data.categories.find(c => c.key === q.categoryKey);
            return {
                ...q,
                category: q.categoryKey,
                categoryName: cat ? cat.name : q.categoryKey
            };
        });

        // 关键词搜索
        if (keyword) {
            const kw = keyword.toLowerCase();
            questions = questions.filter(q => {
                // 搜索标题、摘要、标签、FAQ问题
                const searchText = [
                    q.title,
                    q.summary,
                    ...(q.tags || []),
                    ...(q.faqs || [])
                ].join(' ').toLowerCase();
                return searchText.includes(kw);
            });
        }

        // 分页
        const total = questions.length;
        const start = (page - 1) * pageSize;
        const end = start + parseInt(pageSize);
        const list = questions.slice(start, end);

        res.json({
            code: 0,
            data: {
                total,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                list
            }
        });
    } catch (error) {
        console.error('获取题目列表失败:', error);
        res.json({ code: -1, msg: '获取失败' });
    }
});

/**
 * 获取题目详情
 * GET /api/knowledge/questions/:id
 */
router.get('/questions/:id', (req, res) => {
    try {
        const data = loadKnowledgeData();
        const { id } = req.params;

        // 查找题目
        const question = data.questions.find(q => q.id === id);

        if (!question) {
            return res.json({ code: -1, msg: '题目不存在' });
        }

        // 添加分类信息
        const cat = data.categories.find(c => c.key === question.categoryKey);
        const result = {
            ...question,
            category: question.categoryKey,
            categoryName: cat ? cat.name : question.categoryKey
        };

        res.json({
            code: 0,
            data: result
        });
    } catch (error) {
        console.error('获取题目详情失败:', error);
        res.json({ code: -1, msg: '获取失败' });
    }
});

/**
 * 获取完整数据（管理员用）
 * GET /api/knowledge/full
 */
router.get('/full', (req, res) => {
    try {
        const data = loadKnowledgeData();
        res.json({
            code: 0,
            data: data
        });
    } catch (error) {
        console.error('获取完整数据失败:', error);
        res.json({ code: -1, msg: '获取失败' });
    }
});

/**
 * 获取数据版本
 * GET /api/knowledge/version
 */
router.get('/version', (req, res) => {
    try {
        const data = loadKnowledgeData();
        res.json({
            code: 0,
            data: {
                version: data.version || '1.0.0',
                updateTime: data.updateTime || new Date().toISOString(),
                totalCategories: data.categories.length,
                totalQuestions: (data.questions || []).length
            }
        });
    } catch (error) {
        console.error('获取版本信息失败:', error);
        res.json({ code: -1, msg: '获取失败' });
    }
});

module.exports = router;
