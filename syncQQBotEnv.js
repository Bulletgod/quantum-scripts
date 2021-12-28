require('./env.js');
const got = require('got');
const {
    addEnvs, sendNotify
} = require('./quantum');

let QQBotAddress = process.env.QQBotAddress; //qqbot 地址 http://1.1.1.1:5010
let QQBotUserName = process.env.QQBotUserName; //qqbot 用户名
let QQBotPassWord = process.env.QQBotPassWord; //qqbot 密码

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    console.log("开始同步QQBot 环境变量数据。。。。。请骚后。。。。")
    if (!QQBotAddress || !QQBotUserName || !QQBotPassWord) {
        var message = "QQBot 地址，账号，密码环境变量缺一不可。\r请查看脚本配置环境变量"
        console.log(message)
        sendNotify(message, true)
        return false;
    }
    sendNotify("开始同步环境变量了，可能要点时间，骚等一下。", true)
    console.log("开始同步环境变量。" + new Date())

    var options = {
        url: QQBotAddress + '/api/login',
        form: {
            username: QQBotUserName, password: QQBotPassWord
        },
        method: 'post',
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
    };
    const body = await api(options).json();
    var token = "";
    if (body.Code == 200) {
        token = body.Data;
    } else {
        console.log(body.Message);
        return;
    }

    const jdCookies = await api({
        url: QQBotAddress + '/api/JDCookie?Available=true',
        headers: {
            Accept: 'text/plain',
            Authorization: "Bearer " + token
        },
    }).json();

    if (jdCookies.Code == 200) {
        var cks = jdCookies.Data;
        console.log("获取COOKIE完成，共计有效CK：" + cks.length + "个.");
        console.log("开始同步到量子助手。请稍后。。。。。");
        var envs = [];
        for (var i = 0; i < cks.length; i++) {
            var ck = cks[i];
            envs.push({
                Name: "JD_COOKIE",
                Enable: true,
                Value: `pt_key=${ck.PTKey};pt_pin=${ck.PTPin};`,
                Remark: ck.Remark,
                UserRemark: ck.nickname,
                Weight: ck.Priority,
                UserId: ck.QQ,
                EnvType: 2
            })
        }

        var data = await addEnvs(envs);
        if (data.Code != 200) {
            console.log("同步CK异常")
            return;
        }
        console.log("同步完成拉!");
    } else {
        console.log(jdCookies.Message);
    }
})();
