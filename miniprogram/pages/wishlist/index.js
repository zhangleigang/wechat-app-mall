const CONFIG = require('../../config.js');

Page({
  data: {
    items: [],
    count: 0,
    totalPrice: '0.00'
  },

  onLoad() {
    this.fetchWishlist();
  },

  onPullDownRefresh() {
    this.fetchWishlist().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  ensureOpenid() {
    return new Promise((resolve) => {
      const openid = wx.getStorageSync('openid');
      if (openid) return resolve(openid);

      wx.login({
        success: (res) => {
          if (!res.code) return resolve('');
          wx.request({
            url: CONFIG.apiBaseUrl + '/auth/login',
            method: 'POST',
            data: { code: res.code },
            success: (loginRes) => {
              if (loginRes.data && loginRes.data.code === 0) {
                const oid = loginRes.data.data.openid;
                wx.setStorageSync('openid', oid);
                resolve(oid);
              } else {
                resolve('');
              }
            },
            fail: () => resolve('')
          });
        },
        fail: () => resolve('')
      });
    });
  },

  fetchWishlist() {
    return new Promise((resolve) => {
      this.ensureOpenid().then((openid) => {
        if (!openid) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          this.setData({ items: [], count: 0, totalPrice: '0.00' });
          return resolve();
        }

        wx.request({
          url: `${CONFIG.apiBaseUrl}/group-buy/wishlist`,
          data: { openid },
          success: (res) => {
            if (res.data.code === 0) {
              const data = res.data.data || {};
              const items = data.items || [];
              const total = Number(data.total_price || 0);
              this.setData({
                items,
                count: data.count || items.length,
                totalPrice: total.toFixed(2)
              });
            } else {
              wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
            }
          },
          complete: resolve
        });
      });
    });
  },

  goToJD(e) {
    const sku = e.currentTarget.dataset.sku;
    if (!sku) {
      return wx.showToast({ title: '无效的商品编号', icon: 'none' });
    }
    wx.navigateToMiniProgram({
      appId: 'wx91d27dbf599dff74',
      path: `/pages/item/detail/detail?sku=${sku}`,
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  }
});

