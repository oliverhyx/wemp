

const Base = require('./Base');
const path = require('path');


class Web extends Base {
	constructor() {
		super();
	}

	/**
	 * 设置基础信息
	 * @param {string} url - 回调地址
	 * @param {string} state - 状态值
	 * @param {boolean} forcePopup - 是否强制弹窗
	 * @returns {string} 返回授权链接
	 */
	async setBaseInfo(url, state = 'STATE', forcePopup = false) {
		return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appid}&redirect_uri=${encodeURIComponent(url)}&response_type=code&scope=snsapi_userinfo&state=${state}${forcePopup ? '&forcePopup=true' : ''}#wechat_redirect`;
	}

	/**
	 * 设置用户信息
	 * @param {string} url - 回调地址
	 * @param {string} state - 状态值
	 * @param {boolean} forcePopup - 是否强制弹窗
	 * @returns {string} 返回授权链接
	 */
	async setUserInfo(url, state = 'STATE', forcePopup = false) {
		return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appid}&redirect_uri=${encodeURIComponent(url)}&response_type=code&scope=snsapi_userinfo&state=${state}${forcePopup ? '&forcePopup=true' : ''}#wechat_redirect`;
	}


	/**
	 * 通过code换取网页授权access_token
	 * @param {string} code - 第一步获取的code参数
	 * @returns {Promise<Object>} 包含access_token、openid等信息的对象
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async getWebAccessToken(code) {
		if (!code) {
			throw new Error('code参数不能为空');
		}

		const res = await this.curl('https://api.weixin.qq.com/sns/oauth2/access_token', 'GET', {
			appid: this.appid,
			secret: this.secret,
			code: code,
			grant_type: 'authorization_code'
		});

		if (res.access_token) {
			res.expires_at = Date.now() + 7000 * 1000;
			this.saveTokenToFile(res, path.join(this.tokenDir, `${this.appid}_${res.openid}_access_token.json`));
		}

		return res;
	}

	/**
	 * 拉取用户信息(需scope为 snsapi_userinfo)
	 * @param {string} access_token - 网页授权接口调用凭证
	 * @param {string} openid - 用户的唯一标识
	 * @param {string} [lang='zh_CN'] - 返回国家地区语言版本，zh_CN 简体，zh_TW 繁体，en 英语
	 * @returns {Promise<Object>} 包含用户信息的对象
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async getUserInfo(openid, lang = 'zh_CN') {
		if (!openid) {
			throw new Error('openid参数不能为空');
		}
		const access_token = await this.getAccessToken();
		// const access_token = await this.getTokenFromFile(path.join(this.tokenDir, `${this.appid}_${openid}_access_token.json`));

		const res = await this.curl('https://api.weixin.qq.com/sns/userinfo', 'GET', {
			access_token,
			openid: openid,
			lang: lang
		});

		return res;
	}
}

module.exports = Web;