const CONFIG = require('../config.js')

function _headers() {
  const headers = {
    'Content-Type': 'application/json'
  }
  if (CONFIG.ai_api_key) {
    headers['Authorization'] = 'Bearer ' + CONFIG.ai_api_key
  }
  return headers
}

function chat({ scene, messages, sessionId }) {
  const base = CONFIG.ai_api_base
  const uid = wx.getStorageSync('uid')
  const token = wx.getStorageSync('token')
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}/chat`,
      method: 'POST',
      header: _headers(),
      data: {
        scene, // 'job' | 'resume' | 'mood'
        sessionId,
        userId: uid,
        token,
        messages
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && (res.data.answer || res.data.data)) {
          resolve(res.data)
        } else {
          reject(res.data || { msg: 'AI接口返回异常' })
        }
      },
      fail: (err) => reject(err)
    })
  })
}

function uploadResume(filePath) {
  const base = CONFIG.ai_api_base
  const uid = wx.getStorageSync('uid')
  const token = wx.getStorageSync('token')
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${base}/resume/upload`,
      filePath,
      name: 'file',
      formData: { userId: uid, token },
      header: CONFIG.ai_api_key ? { 'Authorization': 'Bearer ' + CONFIG.ai_api_key } : {},
      success: (res) => {
        let data = {}
        try {
          data = JSON.parse(res.data)
        } catch (e) {}
        if (res.statusCode === 200) {
          resolve(data)
        } else {
          reject(data)
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  chat,
  uploadResume
}