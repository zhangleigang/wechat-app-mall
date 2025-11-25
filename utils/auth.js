/**
 * 认证模块兼容层
 * 
 * 本文件已废弃，仅保留兼容层以避免现有代码引用错误
 * 新代码请直接使用 simpleAuth.js
 * 
 * @deprecated 请使用 simpleAuth.js 替代
 */

const SimpleAuth = require('./simpleAuth.js')

/**
 * 检测登录状态，返回 true / false
 * 兼容方法：转发到 simpleAuth.checkHasLogined()
 */
async function checkHasLogined() {
  console.log('[auth.js] 兼容层：转发到 simpleAuth.checkHasLogined()')
  return await SimpleAuth.checkHasLogined()
}

/**
 * 退出登录
 * 兼容方法：转发到 simpleAuth.logout()
 */
function loginOut() {
  console.log('[auth.js] 兼容层：转发到 simpleAuth.logout()')
  SimpleAuth.logout()
}

/**
 * 获取微信登录 code
 * 兼容方法：转发到 simpleAuth.getWxCode()
 */
async function wxaCode() {
  console.log('[auth.js] 兼容层：转发到 simpleAuth.getWxCode()')
  return await SimpleAuth.getWxCode()
}

/**
 * 检查并授权
 * 保留原有实现，因为这是微信小程序特定功能
 */
async function checkAndAuthorize(scope) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        if (!res.authSetting[scope]) {
          wx.authorize({
            scope: scope,
            success() {
              resolve() // 无返回参数
            },
            fail(e) {
              console.error(e)
              wx.showModal({
                title: '无权操作',
                content: '需要获得您的授权',
                showCancel: false,
                confirmText: '立即授权',
                confirmColor: '#e64340',
                success(res) {
                  wx.openSetting()
                },
                fail(e) {
                  console.error(e)
                  reject(e)
                },
              })
            }
          })
        } else {
          resolve() // 无返回参数
        }
      },
      fail(e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

// ============ 以下方法已废弃但保留兼容 ============

/**
 * @deprecated 已废弃，请使用 simpleAuth.silentLogin()
 * 兼容实现：转发到 simpleAuth.silentLogin()
 */
async function login(page) {
  console.warn('[auth.js] login() 方法已废弃，请使用 simpleAuth.silentLogin()，当前调用已转发')
  const result = await SimpleAuth.silentLogin()
  // 返回兼容格式
  return {
    code: result.success ? 0 : -1,
    data: result.data,
    msg: result.success ? 'success' : result.error
  }
}

/**
 * @deprecated 已废弃，请使用 simpleAuth.silentLogin()
 * 兼容实现：转发到 simpleAuth.silentLogin()
 */
async function authorize() {
  console.warn('[auth.js] authorize() 方法已废弃，请使用 simpleAuth.silentLogin()，当前调用已转发')
  const result = await SimpleAuth.silentLogin()
  // 返回兼容格式
  return {
    code: result.success ? 0 : -1,
    data: result.data,
    msg: result.success ? 'success' : result.error
  }
}

/**
 * @deprecated 已废弃，请使用 simpleAuth.silentLogin()
 * 兼容实现：转发到 simpleAuth.silentLogin()
 */
async function login20241025() {
  console.warn('[auth.js] login20241025() 方法已废弃，请使用 simpleAuth.silentLogin()，当前调用已转发')
  const result = await SimpleAuth.silentLogin()
  // 返回兼容格式
  return {
    code: result.success ? 0 : -1,
    data: result.data,
    msg: result.success ? 'success' : result.error
  }
}

/**
 * @deprecated 已废弃，apifm 相关功能不再支持
 * 兼容实现：静默忽略，不抛出错误
 */
async function bindSeller() {
  console.warn('[auth.js] bindSeller() 方法已废弃，apifm 相关功能不再支持，调用已忽略')
  // 不抛出错误，静默忽略，返回成功以保持兼容
  return Promise.resolve()
}

module.exports = {
  // 兼容方法（转发到 simpleAuth）
  checkHasLogined: checkHasLogined,
  loginOut: loginOut,
  wxaCode: wxaCode,
  checkAndAuthorize: checkAndAuthorize,

  // 已废弃方法（抛出错误提示）
  login: login,
  authorize: authorize,
  login20241025: login20241025,
  bindSeller: bindSeller
}