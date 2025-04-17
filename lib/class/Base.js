//#region 导入依赖
const request = require("request");
const crypto = require("crypto");
const config = require('../config');
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
			const path = require('path');
			// 设置token存储路径
			this.tokenDir = path.resolve(process.cwd(), '.neuit');
			this.tokenFile = path.join(this.tokenDir, `${this.secret}_access_token.json`);
		}
	}

	//#region 公开方法
	/**
	 * 获取access_token
	 * @param {string} _url - 请求的URL
	 * @returns {Promise<string>} access_token
	 */
	async getAccessToken(_url) {
		// 如果是获取token的接口，直接返回空字符串，避免循环调用
		if (_url === 'https://api.weixin.qq.com/cgi-bin/token' || _url === 'https://api.weixin.qq.com/sns/oauth2/access_token') {
			return '';
		}

		if (this.cache_mode === 'file') {
			try {
				const token = await this.getTokenFromFile();
				if (token) {
					return token;
				}
			} catch (error) {
				console.error('读取access_token出错:', error);
			}
			// 如果到这里，说明文件不存在、token已过期或发生错误，需要重新获取
			const newToken = await this.fetchAccessToken();
			return newToken.access_token;
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
	async curl(_url, _method, _params) {

		const data = {
			..._params
		};
		const access_token = data.access_token || await this.getAccessToken(_url);
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
		if(_token_type === 'agent') {
			this.secret = config.getConfig('secret');
		} else if(_token_type === 'concat') {
			this.secret = config.getConfig('concat_secret');
		}
		console.log(`secret：${this.secret}`);
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
	async getTokenFromFile(tokenFile=this.tokenFile) {
		const fs = require('fs');
		if (fs.existsSync(tokenFile)) {
			const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
			// console.log(`缓存参数：${JSON.stringify(tokenData)}`);
			if (Date.now() < tokenData.expires_at) {
				return tokenData.access_token;
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