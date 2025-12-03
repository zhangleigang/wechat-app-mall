/**
 * 知识库首页 - API 版本
 * 从云端 API 加载知识库数据
 */

const CONFIG = require('../../config.js');
const knowledgeApi = require('../../utils/knowledge-api.js');
const { markdownToHtml } = require('../../utils/markdown.js');

// 降级方案：本地数据（已禁用以减小包体积）
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

            // 尝试降级到本地数据
            if (this.data.useApi && localKnowledge) {
                console.log('降级到本地数据');
                this.setData({ useApi: false });
                this.loadFromLocal();
                this.loadQuestions();
            } else {
                this.setData({
                    error: '加载失败，请检查网络连接',
                    loading: false
                });
            }
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

            console.log('从 API 加载成功:', {
                categories: categories.length,
                topics: result.list.length
            });
        } catch (error) {
            console.error('从 API 加载失败:', error);
            throw error;
        }
    },

    /**
     * 从本地加载数据
     */
    loadFromLocal() {
        if (!localKnowledge) {
            throw new Error('本地数据不可用');
        }

        this.setData({
            categories: localKnowledge.categories || [],
            topics: localKnowledge.topics || [],
            loading: false
        });

        console.log('从本地加载成功');
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
        filteredTopics.forEach(topic => {
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
        const { id } = e.currentTarget.dataset;
        const question = this.data.allQuestions.find(q => q.id === id);

        if (!question) return;

        wx.navigateTo({
            url: `/pages/knowledge/detail?id=${id}&question=${encodeURIComponent(question.question)}`
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
