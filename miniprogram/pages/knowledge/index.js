/**
 * 知识库首页 - API 版本
 * 从云端 API 加载知识库数据
 */

const CONFIG = require('../../config.js');
const knowledgeApi = require('../../utils/knowledge-api.js');
const { markdownToHtml } = require('../../utils/markdown.js');

// 降级方案：本地数据（已禁用以减小包体积）
// 如需使用本地数据，请取消下面的注释并设置 CONFIG.useLocalKnowledge = true
// let localKnowledge = null;
// if (CONFIG.useLocalKnowledge) {
//     localKnowledge = require('../../utils/knowledge.js');
// }

Page({
    data: {
        activeCategoryKey: 'hdfs',  // 默认显示 HDFS
        categories: [],
        topics: [],
        allQuestions: [],
        loading: true,
        error: null,
        useApi: !CONFIG.useLocalKnowledge
    },

    onLoad() {
        wx.setNavigationBarTitle({ title: '面试知识' });
        this.initKnowledge();
    },

    /**
     * 初始化知识库数据
     */
    async initKnowledge() {
        try {
            this.setData({ loading: true, error: null });

            if (this.data.useApi) {
                // 使用 API 加载
                await this.loadFromApi();
            } else {
                // 使用本地数据
                this.loadFromLocal();
            }

            this.loadQuestions();
        } catch (error) {
            console.error('初始化知识库失败:', error);

            // 本地数据降级已禁用（减小包体积）
            this.setData({
                error: '加载失败，请检查网络连接或 API 配置',
                loading: false
            });
        }
    },

    /**
     * 从 API 加载数据
     */
    async loadFromApi() {
        try {
            // 获取分类
            const categories = await knowledgeApi.getCategories();

            // 获取所有题目
            const result = await knowledgeApi.getQuestions({
                page: 1,
                pageSize: 1000  // 一次性加载所有题目
            });

            this.setData({
                categories: categories || [],
                topics: result.list || [],
                loading: false
            });
        } catch (error) {
            throw error;
        }
    },

    /**
     * 从本地加载数据（已禁用以减小包体积）
     */
    loadFromLocal() {
        throw new Error('本地数据已禁用，请使用 API 模式');
    },

    /**
     * 切换分类
     */
    switchCategory(e) {
        const key = e.currentTarget.dataset.key;
        if (!key || key === this.data.activeCategoryKey) return;

        this.setData({ activeCategoryKey: key });
        this.loadQuestions();
    },

    /**
     * 加载当前分类的题目
     */
    loadQuestions() {
        const active = this.data.activeCategoryKey;
        const topics = this.data.topics || [];

        // 筛选符合条件的主题
        const filteredTopics = topics.filter(t => t.categoryKey === active);

        // 将所有问题展平成一个列表
        const allQuestions = [];
        filteredTopics.forEach((topic) => {
            if (topic.faqs && topic.answers) {
                topic.faqs.forEach((question, index) => {
                    const answer = topic.answers[index] || '答案加载中...';
                    allQuestions.push({
                        id: `${topic.id}-${index}`,
                        question: question,
                        answer: answer,
                        answerHtml: markdownToHtml(answer),
                        expanded: false
                    });
                });
            }
        });

        this.setData({ allQuestions });
    },

    /**
     * 查看题目详情
     */
    viewDetail(e) {
        const { index } = e.currentTarget.dataset;
        const question = this.data.allQuestions[index];

        if (!question) {
            wx.showToast({
                title: '题目不存在',
                icon: 'none'
            });
            return;
        }

        // 将完整数据存储到全局变量，避免 URL 过长
        const app = getApp();
        app.globalData = app.globalData || {};

        // 添加分类信息
        const questionWithCategory = {
            ...question,
            category: this.data.activeCategoryKey,
            categoryName: this.getCategoryName(this.data.activeCategoryKey)
        };

        app.globalData.currentQuestion = questionWithCategory;

        wx.navigateTo({
            url: `/pages/knowledge/detail?id=${question.id}&category=${this.data.activeCategoryKey}`,
            fail: () => {
                wx.showToast({
                    title: '跳转失败',
                    icon: 'none'
                });
            }
        });
    },

    /**
     * 切换问题展开/收起
     */
    toggleQuestion(e) {
        const { id } = e.currentTarget.dataset;
        const questions = this.data.allQuestions.map(q => {
            if (q.id === id) {
                return { ...q, expanded: !q.expanded };
            }
            return q;
        });

        this.setData({ allQuestions: questions });
    },

    /**
     * 获取分类名称
     */
    getCategoryName(categoryKey) {
        const category = this.data.categories.find(c => c.key === categoryKey);
        return category ? category.name : categoryKey;
    },

    /**
     * 重新加载
     */
    async reload() {
        await this.initKnowledge();
    },

    /**
     * 下拉刷新
     */
    async onPullDownRefresh() {
        try {
            await this.initKnowledge();
            wx.showToast({
                title: '刷新成功',
                icon: 'success'
            });
        } catch (error) {
            wx.showToast({
                title: '刷新失败',
                icon: 'none'
            });
        } finally {
            wx.stopPullDownRefresh();
        }
    }
});
