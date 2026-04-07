const CONFIG = require('../../config.js');

Page({
  data: {
    activeCategory: '全部',
    categories: ['全部', '洗衣机', '沙发', '冰箱', '热水器', '餐桌餐椅', '床架床垫', '书桌工学椅', '其他'],
    products: [],
    
    // 弹窗控制
    showIntention: false,
    
    submitting: false,
    
    // 房号选择 (通用)
    showPicker: false,
    pickerTitle: '',
    pickerColumns: [],
    pickerType: '', // 'unit' | 'layout'
    
    selectedUnit: '',
    roomNumber: '',
    selectedLayout: '',
    
    // 意向登记当前操作商品
    currentProductId: null,
  },

  onLoad() {
    this.fetchProducts();
  },

  onShow() {
    // Check login state (OpenID)
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      // If not logged in, trigger login
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: CONFIG.apiBaseUrl + '/auth/login',
              method: 'POST',
              data: { code: res.code },
              success: (loginRes) => {
                if (loginRes.data && loginRes.data.code === 0) {
                  wx.setStorageSync('openid', loginRes.data.data.openid);
                }
              }
            });
          }
        }
      });
    }
  },

  onPullDownRefresh() {
    this.fetchProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: '熙府随心选 - 业主专属团购',
      path: '/pages/group-buy/index'
    };
  },

  // === 列表展示 ===
  fetchProducts() {
    return new Promise((resolve) => {
      wx.request({
        url: `${CONFIG.apiBaseUrl}/group-buy/products`,
        data: { category: this.data.activeCategory },
        success: (res) => {
          if (res.data.code === 0) {
            const products = res.data.data.map(p => ({
              ...p,
              created_at_format: this.formatTime(p.created_at)
            }));
            this.setData({ products });
          } else {
            wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
          }
        },
        complete: resolve
      });
    });
  },

  onCategoryChange(e) {
    this.setData({ activeCategory: e.detail.name });
    this.fetchProducts();
  },

  goWishlist() {
    wx.navigateTo({ url: '/pages/wishlist/index' });
  },

  goToJD(e) {
    const sku = e.currentTarget.dataset.sku;
    if (!sku) {
      return wx.showToast({ title: '无效的商品编号', icon: 'none' });
    }
    wx.navigateToMiniProgram({
      appId: 'wx91d27dbf599dff74',
      path: `/pages/item/detail/detail?sku=${sku}`,
      fail: (err) => {
        console.error('跳转京东小程序失败', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  copyIntentions(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === id);
    if (!product || !product.intentions || product.intentions.length === 0) return;

    const listStr = product.intentions.map(i => i.room_no).join(', ');
    wx.setClipboardData({
      data: listStr,
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success' });
      }
    });
  },

  // === 意向登记流程 ===
  showIntentionModal(e) {
    this.setData({
      showIntention: true,
      currentProductId: e.currentTarget.dataset.id,
      selectedUnit: '',
      roomNumber: '',
      selectedLayout: ''
    });
  },

  closeIntentionModal() {
    this.setData({ showIntention: false });
  },

  submitIntention() {
    if (!this.validateRoomInput()) return;

    const openid = wx.getStorageSync('openid');
    if (!openid) return wx.showToast({ title: '请先登录', icon: 'none' });

    const room_no = `${this.data.selectedUnit}-${this.data.roomNumber}-${this.data.selectedLayout}`;
    const productId = this.data.currentProductId;

    this.setData({ submitting: true });
    wx.request({
      url: `${CONFIG.apiBaseUrl}/group-buy/products/${productId}/intentions`,
      method: 'POST',
      data: { openid, room_no },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '登记成功', icon: 'success' });
          this.closeIntentionModal();
          this.fetchProducts();
        } else {
          wx.showToast({ title: res.data.msg || '登记失败', icon: 'none' });
        }
      },
      complete: () => {
        this.setData({ submitting: false });
      }
    });
  },

  // === 房号三段式输入逻辑 ===
  showUnitPicker() {
    this.setData({
      showPicker: true,
      pickerType: 'unit',
      pickerTitle: '选择栋/单元',
      pickerColumns: ['1', '2', '3', '4', '5', '6', '7', '8']
    });
  },

  showLayoutPicker() {
    this.setData({
      showPicker: true,
      pickerType: 'layout',
      pickerTitle: '选择户型',
      pickerColumns: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    });
  },

  closePicker() {
    this.setData({ showPicker: false });
  },

  onPickerConfirm(e) {
    const { value } = e.detail;
    if (this.data.pickerType === 'unit') {
      this.setData({ selectedUnit: value });
    } else {
      this.setData({ selectedLayout: value });
    }
    this.closePicker();
  },

  onRoomNumberChange(e) {
    this.setData({ roomNumber: e.detail.value });
  },

  validateRoomInput() {
    if (!this.data.selectedUnit) {
      wx.showToast({ title: '请选择栋/单元', icon: 'none' });
      return false;
    }
    if (!this.data.roomNumber) {
      wx.showToast({ title: '请填写房号', icon: 'none' });
      return false;
    }
    if (!this.data.selectedLayout) {
      wx.showToast({ title: '请选择户型', icon: 'none' });
      return false;
    }
    return true;
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
});
