const {
    Base,
    Web
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
testWeb();