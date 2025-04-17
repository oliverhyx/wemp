

//#region import
const Base = require('./Base');
//#endregion

class SubscriptionMessage extends Base {
	constructor() {
		super();
	}

	/**
	 * 添加订阅消息模板
	 * @param {string} tid - 模板标题id
	 * @param {Array<number>} kidList - 模板关键词列表
	 * @param {string} sceneDesc - 服务场景描述，15个字以内
	 * @returns {Promise<Object>} 包含priTmplId的对象
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async addTemplate(tid, kidList, sceneDesc) {
		if (!tid) {
			throw new Error('tid参数不能为空');
		}
		
		if (!Array.isArray(kidList) || kidList.length < 2 || kidList.length > 5) {
			throw new Error('kidList必须是包含2-5个数字的数组');
		}
		
		if (!sceneDesc || sceneDesc.length > 15) {
			throw new Error('sceneDesc必须在15个字以内');
		}
		
		const params = {
			tid,
			kidList,
			sceneDesc
		};
		
		const res = await this.curl('https://api.weixin.qq.com/wxaapi/newtmpl/addtemplate', 'POST', params);
		
		return res;
	}

	/**
	 * 删除订阅消息模板
	 * @param {string} priTmplId - 要删除的模板id
	 * @returns {Promise<Object>} 包含errcode和errmsg的对象
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async deleteTemplate(priTmplId) {
		if (!priTmplId) {
			throw new Error('priTmplId参数不能为空');
		}
		
		const params = {
			priTmplId
		};
		
		const res = await this.curl('https://api.weixin.qq.com/wxaapi/newtmpl/deltemplate', 'POST', params);
		
		return res;
	}

	/**
	 * 获取公众号类目
	 * @returns {Promise<Object>} 包含类目列表的对象
	 */
	async getCategory() {
		const res = await this.curl('https://api.weixin.qq.com/wxaapi/newtmpl/getcategory', 'GET', {});
		return res;
	}

	/**
	 * 获取模板中的关键词
	 * @param {string} tid - 模板标题id
	 * @returns {Promise<Object>} 包含关键词列表的对象
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async getPubTemplateKeyWords(tid) {
		if (!tid) {
			throw new Error('tid参数不能为空');
		}
		
		const params = {
			tid
		};
		
		const res = await this.curl('https://api.weixin.qq.com/wxaapi/newtmpl/getpubtemplatekeywords', 'GET', params);
		
		return res;
	}

	/**
	 * 获取类目下的公共模板
	 * @param {string} ids - 类目id，多个用逗号隔开
	 * @param {number} start - 起始位置
	 * @param {number} limit - 返回记录条数，最大30
	 * @returns {Promise<Object>} 包含模板列表的对象
	 * @throws {Error} 当必填参数缺失或参数不合法时抛出错误
	 */
	async getPubTemplateTitleList(ids, start = 0, limit = 30) {
		if (!ids) {
			throw new Error('ids参数不能为空');
		}
		
		if (start < 0) {
			throw new Error('start必须大于等于0');
		}
		
		if (limit <= 0 || limit > 30) {
			throw new Error('limit必须在1-30之间');
		}
		
		const params = {
			ids,
			start,
			limit
		};
		
		const res = await this.curl('https://api.weixin.qq.com/wxaapi/newtmpl/getpubtemplatetitles', 'GET', params);
		
		return res;
	}

	/**
	 * 获取私有模板列表
	 * @returns {Promise<Object>} 包含私有模板列表的对象
	 */
	async getTemplateList() {
		const res = await this.curl('https://api.weixin.qq.com/wxaapi/newtmpl/gettemplate', 'GET', {});
		return res;
	}

	/**
	 * 发送订阅通知
	 * @param {string} touser - 接收者（用户）的 openid
	 * @param {string} template_id - 所需下发的订阅模板id
	 * @param {Object} data - 模板内容，格式形如 { "key1": { "value": any }, "key2": { "value": any } }
	 * @param {string} [page] - 跳转网页时填写
	 * @param {Object} [miniprogram] - 跳转小程序时填写，格式如{ "appid": "pagepath": { "value": any } }
	 * @returns {Promise<Object>} 包含errcode和errmsg的对象
	 * @throws {Error} 当必填参数缺失时抛出错误
	 */
	async send(touser, template_id, data, page, miniprogram) {
		if (!touser) {
			throw new Error('touser参数不能为空');
		}
		
		if (!template_id) {
			throw new Error('template_id参数不能为空');
		}
		
		if (!data || Object.keys(data).length === 0) {
			throw new Error('data参数不能为空');
		}
		
		const params = {
			touser,
			template_id,
			data
		};
		
		if (page) {
			params.page = page;
		}
		
		if (miniprogram) {
			params.miniprogram = miniprogram;
		}
		
		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/message/subscribe/bizsend', 'POST', params);
		
		return res;
	}
	

}

module.exports = SubscriptionMessage;