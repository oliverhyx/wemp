

const Base = require('./Base');
const path = require('path');


class Menu extends Base {
	constructor() {
		super();
	}

	async create(menu) {
		const res = await this.curl('https://api.weixin.qq.com/cgi-bin/menu/create', 'POST', menu);
		return res;
	}

    async get_current_selfmenu_info() {
        const res = await this.curl('https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info', 'GET', {});
        return res;
    }

    async get() {
        const res = await this.curl('https://api.weixin.qq.com/cgi-bin/menu/get', 'GET', {});
        return res;
    }

    async delete() {
        const res = await this.curl('https://api.weixin.qq.com/cgi-bin/menu/delete', 'POST', {});
        return res;
    }
}

module.exports = Menu;