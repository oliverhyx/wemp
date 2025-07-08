const {
    Base,
    Web,
    Menu,
    Message
} = require('../lib/main')

// 初始化对象
const base = new Base();


async function testBase() {
    // 获取access_token
    const access_token = await base.getAccessToken();
    console.log(access_token);
}


// testBase();


async function testWeb() {
    const web = new Web();
    // const res = await web.getWebAccessToken('081JXOFa1x8ToJ0CYkGa1wLJvx1JXOFP');
    // console.log(res);

    const res = await web.getUserInfo('oBP7_6jU45PW2Up6Gu0mx9yKp4ro');
    console.log(res);
}
// testWeb();


async function testMenu() {
    const access_token = await base.getAccessToken();
    const menu = new Menu();
    // const res = await menu.get_current_selfmenu_info();
    // console.log(JSON.stringify(res));

    // const button = {
    //     "button": [{
    //         "type": "view",
    //         "name": "焕己健康",
    //         "url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx8e27fb5064dd6f68&redirect_uri=https%3A%2F%2Fhealth.nimihealth.cn&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"
    //     }]
    // }

    const res = await menu.create({
        "button": [
          {
            "type": "view",
            "name": "焕己健康",
            "url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx8e27fb5064dd6f68&redirect_uri=https%3A%2F%2Fhealth.nimihealth.cn&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"
          }
        ]
      });
    console.log(JSON.stringify(res));

    // const res = await menu.get();
    // console.log(JSON.stringify(res));
}
// testMenu();

async function testMessage() {
    const message = new Message();
    const res = await message.send({
        "touser": "oBP7_6jU45PW2Up6Gu0mx9yKp4ro",
        "msgtype": "text",
        "text": { "content": "点击链接继续答题：https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx8e27fb5064dd6f68&redirect_uri=https%3A%2F%2Fhealth.nimihealth.cn%2Fmobile-test%2Fmp%3Fagentid%3D556eff32-e66c-4713-838e-95d48642694f%26type%3D0&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect" }
    });
    console.log(JSON.stringify(res));
}
testMessage();