//#region 导入依赖
const request = require("request");
const crypto = require("crypto");
const config = require('../config');
const path = require('path');
const fs = require('fs');

//#endregion

/**
 * 企业微信API基础类
 * 处理access_token的获取和缓存等基础功能
 */
class Base {
	constructor() {
		this.appid = config.getConfig('appid');
		this.secret = config.getConfig('secret');
		this.cache_mode = config.getConfig('cache_mode') || 'file';
		if (this.cache_mode === 'file') {
			// 设置token存储路径
			this.tokenDir = path.resolve(process.cwd(), '.neuit');
			this.tokenFile = path.join(this.tokenDir, `${this.secret}_access_token.json`);
			this.stableTokenFile = path.join(this.tokenDir, `${this.secret}_stable_access_token.json`);
		}
	}

	//#region 公开方法

	verifySignature(signature, timestamp, nonce) {
		// 获取token
		const token = config.getConfig('mp_token');

		// 1. 将token、timestamp、nonce三个参数进行字典序排序
		const arr = [token, timestamp, nonce].sort();

		// 2. 将三个参数字符串拼接成一个字符串进行sha1加密
		const str = arr.join('');
		const sha1 = crypto.createHash('sha1');
		const hash = sha1.update(str).digest('hex');

		// 3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
		return hash === signature;
	}

	async getJssdkConfig(url) {
		const ticket = await this.getJsapiTicket();
		console.log(`ticket：${ticket}`);
		const timestamp = Date.now().toString().slice(0, 10); // 当前时间戳
		const nonceStr = Math.random().toString(36).substring(2, 15); // 随机字符串

		const string1 = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
		console.log(`string1：${string1}`);

		const signature = crypto.createHash('sha1').update(string1).digest('hex'); // 生成SHA1签名

		return {
			appId: this.appid,
			timestamp,
			nonceStr,
			signature
		}

	}

	async getJsapiTicket() {
		if (this.cache_mode === 'file') {
			try {
				const path = require('path');
				const ticketFile = path.join(this.tokenDir, `${this.secret}_jsapi_ticket.json`);

				// Try reading from file first
				if (fs.existsSync(ticketFile)) {
					const ticketData = JSON.parse(fs.readFileSync(ticketFile));
					if (ticketData.expires_time > Date.now()) {
						return ticketData.ticket;
					}
				}
			} catch (error) {
				console.error('读取jsapi_ticket出错:', error);
			}
		}

		// If file doesn't exist, expired, or error occurred, fetch new ticket
		const access_token = await this.getAccessToken();
		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/ticket/getticket', 'GET', {
			access_token,
			type: 'jsapi'
		});
		if (res.errcode) {
			throw new Error(`获取jsapi_ticket失败：${res.errmsg}`);
		}

		if (this.cache_mode === 'file') {
			// Save new ticket to file
			const ticketData = {
				ticket: res.ticket,
				expires_time: Date.now() + (res.expires_in - 200) * 1000
			};
			fs.writeFileSync(
				path.join(this.tokenDir, `${this.secret}_jsapi_ticket.json`),
				JSON.stringify(ticketData)
			);
		}

		return res.ticket;
	}
	/**
	 * 获取access_token
	 * @param {string} _url - 请求的URL
	 * @returns {Promise<string>} access_token
	 */
	async getAccessToken(_url, type = '') {
		// 如果是获取token的接口，直接返回空字符串，避免循环调用
		if (_url === 'https://api.weixin.qq.com/cgi-bin/token' || _url === 'https://api.weixin.qq.com/sns/oauth2/access_token' || _url === 'https://api.weixin.qq.com/cgi-bin/stable_token') {
			return '';
		}

		if (this.cache_mode === 'file') {
			try {
				const token = await this.getTokenFromFile(type === 'stable' ? this.stableTokenFile : this.tokenFile);

				if (token) {
					return token;
				}
			} catch (error) {
				console.error('读取access_token出错:', error);
			}
			// 如果到这里，说明文件不存在、token已过期或发生错误，需要重新获取
			if (type === 'stable') {
				const newToken = await this.fetchStableAccessToken();
				return newToken.access_token;
			} else {
				const newToken = await this.fetchAccessToken();
				return newToken.access_token;
			}
		}
		return '';
	}

	/**
	 * 发送HTTP请求
	 * @param {string} _url - 请求地址
	 * @param {string} _method - 请求方法
	 * @param {Object} _params - 请求参数
	 * @returns {Promise<Object>} 响应结果
	 */
	async curl(_url, _method, _params, type = '') {

		const data = {
			..._params
		};
		const access_token = data.access_token || await this.getAccessToken(_url, type);
		console.log(`access_token：${access_token}`);
		const params = this.removeControlProperties(data);
		// console.log(`请求参数：${JSON.stringify(params)}`)
		return new Promise((resolve, reject) => {
			const options = {
				url: _url,
				method: _method,
				json: true,
				headers: {
					'Content-Type': 'application/json',
					'Accept': '*/*' // 接受所有类型的响应
				}
			};

			const url = _url + '?access_token=' + access_token + '&debug=1';

			if (_method.toUpperCase() === 'GET') {
				// GET请求将参数添加到URL查询字符串
				const queryString = new URLSearchParams(params).toString();
				options.url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
			} else {
				// POST等其他方法将数据放在body中
				options.url = url;
				options.body = params;
			}

			request(options, (error, response, body) => {
				if (error) {
					reject(error);
				} else {
					resolve(body);
				}
			});
		});
	}
	//#endregion

	//#region 内部方法

	setSecret(_token_type) {
		if (_token_type === 'agent') {
			this.secret = config.getConfig('secret');
		} else if (_token_type === 'concat') {
			this.secret = config.getConfig('concat_secret');
		}
		if (this.cache_mode === 'file') {
			const path = require('path');
			// 设置token存储路径
			this.tokenDir = path.resolve(process.cwd(), '.neuit');
			this.tokenFile = path.join(this.tokenDir, `${this.secret}_access_token.json`);
		}
	}
	/**
	 * 从企业微信服务器获取新的access_token
	 * @returns {Promise<Object>} 包含access_token的响应对象
	 * @private
	 */
	async fetchAccessToken() {
		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/token', 'GET', {
			appid: this.appid,
			secret: this.secret,
			grant_type: 'client_credential'
		});
		console.log(`res：${JSON.stringify(res)}`);
		if (res.errcode) {
			throw new Error(`获取access_token失败：${res.errmsg}`);
		}
		if (this.cache_mode === 'file' && res.access_token) {
			await this.saveTokenToFile(res);
		}

		return res;
	}

	/**
	 * 从企业微信服务器获取稳定版access_token
	 * @param {boolean} [forceRefresh=false] - 是否强制刷新token
	 * @returns {Promise<Object>} 包含access_token的响应对象
	 * @private
	 */
	async fetchStableAccessToken(forceRefresh = false) {
		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/stable_token', 'POST', {
			grant_type: 'client_credential',
			appid: this.appid,
			secret: this.secret,
			force_refresh: forceRefresh
		});

		if (res.errcode) {
			throw new Error(`获取稳定版access_token失败：${res.errmsg}`);
		}
		console.log(`res：${JSON.stringify(res)}`);
		if (this.cache_mode === 'file' && res.access_token) {
			await this.saveTokenToFile(res);
		}

		return res;
	}

	/**
	 * 将token信息保存到文件中
	 * @param {Object} tokenData - 包含access_token的数据对象
	 * @private
	 */
	async saveTokenToFile(tokenData, tokenFile = this.tokenFile) {
		const fs = require('fs');
		const data = {
			...tokenData,
			expires_at: Date.now() + 7000 * 1000 // 设置过期时间为当前时间后2小时
		};

		// 确保存储目录存在
		if (!fs.existsSync(this.tokenDir)) {
			fs.mkdirSync(this.tokenDir, {
				recursive: true
			});
		}

		// 写入token文件
		fs.writeFileSync(tokenFile, JSON.stringify(data, null, 2), 'utf8');
	}

	/**
	 * 从文件中读取token信息
	 * @returns {Promise<string|null>} 有效的access_token或null
	 * @private
	 */
	async getTokenFromFile(tokenFile = this.tokenFile) {
		const fs = require('fs');
		if (fs.existsSync(tokenFile)) {
			try {
				const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
				// console.log(`缓存参数：${JSON.stringify(tokenData)}`);
				if (Date.now() < tokenData.expires_at) {
					return tokenData.access_token;
				} else {
					return null;
				}
			} catch (error) {
				console.error('读取access_token出错:', error);
				return null;
			}
		}
		return null;
	}

	/**
	 * 处理请求参数，移除空值属性
	 * @param {Object} obj - 原始参数对象
	 * @returns {Object} 处理后的参数对象
	 * @private
	 */
	removeControlProperties(obj) {
		const result = {};
		for (const key in obj) {
			// 过滤掉值为空字符串、null或undefined的属性
			if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
				result[key] = obj[key];
			}
		}
		return result;
	}
	//#endregion
}

module.exports = Base;