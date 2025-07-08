const Base = require('./Base');

class User extends Base {
	constructor() {
		super();
	}

	/**
	 * 获取用户基本信息（包括UnionID机制）
	 * @param {string} openid - 普通用户的标识，对当前公众号唯一
	 * @param {string} [lang='zh_CN'] - 返回国家地区语言版本，zh_CN 简体，zh_TW 繁体，en 英语
	 * @returns {Promise<Object>} 包含用户基本信息的对象，包括订阅状态、语言、关注时间、UnionID等
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async getBasicUserInfo(openid, lang = 'zh_CN') {
		if (!openid) {
			throw new Error('openid参数不能为空');
		}

		const access_token = await this.getAccessToken();

		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/user/info', 'GET', {
			access_token,
			openid: openid,
			lang: lang
		});

		return res;
	}
}

module.exports = User;