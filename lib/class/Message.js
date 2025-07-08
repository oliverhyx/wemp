

const Base = require('./Base');


class Message extends Base {
	constructor() {
		super();
	}

	async send(data) {
		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/message/custom/send', 'POST', data);
		return res;
	}

}

module.exports = Message;