// pages/favorites/index.js
const AUTH = require('../../utils/auth')

Page({
    data: {
        favorites: [],
        loading: false,
        isEmpty: false
    },

    onLoad() {
        // 页面加载
    },

    onShow() {
        this.checkLoginAndLoad()
    },

    // 检查登录并加载收藏
    async checkLoginAndLoad() {
        const isLogined = await AUTH.checkHasLogined()
        if (isLogined) {
            this.loadFavorites()
        } else {
            // 未登录，显示登录提示
            this.setData({
                isEmpty: true,
                favorites: []
            })
        }
    },

    // 加载收藏列表
    loadFavorites() {
        this.setData({ loading: true })

        try {
            // 从本地存储获取收藏的知识点
            const favorites = wx.getStorageSync('favorites') || []

            this.setData({
                favorites: favorites,
                isEmpty: favorites.length === 0,
                loading: false
            })
        } catch (error) {
            console.error('加载收藏失败:', error)
            this.setData({
                loading: false,
                isEmpty: true
            })
        }
    },

    // 查看收藏详情
    viewDetail(e) {
        const item = e.currentTarget.dataset.item

        // 将数据存储到全局变量
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.currentQuestion = item;

        wx.navigateTo({
            url: `/pages/knowledge/detail?id=${item.id}&category=${item.category}`,
            fail: () => {
                wx.showToast({
                    title: '跳转失败',
                    icon: 'none'
                })
            }
        })
    },

    // 取消收藏
    removeFavorite(e) {
        const index = e.currentTarget.dataset.index
        const item = this.data.favorites[index]

        wx.showModal({
            title: '取消收藏',
            content: `确定要取消收藏"${item.question}"吗？`,
            success: (res) => {
                if (res.confirm) {
                    let favorites = this.data.favorites
                    favorites.splice(index, 1)

                    // 更新本地存储
                    wx.setStorageSync('favorites', favorites)

                    // 更新页面
                    this.setData({
                        favorites: favorites,
                        isEmpty: favorites.length === 0
                    })

                    wx.showToast({
                        title: '已取消收藏',
                        icon: 'success'
                    })
                }
            }
        })
    },

    // 清空收藏
    clearAll() {
        if (this.data.favorites.length === 0) {
            return
        }

        wx.showModal({
            title: '清空收藏',
            content: '确定要清空所有收藏吗？此操作不可恢复',
            confirmColor: '#ff6b00',
            success: (res) => {
                if (res.confirm) {
                    wx.removeStorageSync('favorites')
                    this.setData({
                        favorites: [],
                        isEmpty: true
                    })
                    wx.showToast({
                        title: '已清空',
                        icon: 'success'
                    })
                }
            }
        })
    },

    // 去登录
    goLogin() {
        wx.navigateTo({
            url: '/pages/login/simple'
        })
    }
})
