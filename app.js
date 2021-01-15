const cron = require('node-cron');
const fetch = require('node-fetch');
//const csv = require('csvtojson');
const fs = require('fs');
//const iconv = require('iconv-lite');
//const reader = require('filereader');
const config = JSON.parse(fs.readFileSync("./config.json"));
let savedData = fs.existsSync('./data.json') ? JSON.parse(fs.readFileSync("./data.json")) : { num: 0 };
if (!fs.existsSync('./data.json')) {
    fs.writeFileSync('./data.json', JSON.stringify({ num: 0 }));
}

const job = () => {
    fetch(config.dataURI).then(async (data) => {
        const converted = (await data.json()).numbers;
        console.log(converted);
        const num = converted.total;
        if (Number(savedData.num) != Number(num)) {
            console.log(num);
            const diff = Number(num) - Number(savedData.num);
            fetch(config.postTo.uri, {
                "headers": {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify({
                    "username": config.postTo.name,
                    "avatar_url": config.postTo.pic,
                    "content": `${new Date().toISOString()}に更新されました`,
                    "embeds": [
                        {
                            "title": "コロナ感染者数更新",
                            "description": config.pref + "のコロナ感染者数が更新されました",
                            "url": "https://hazard.yahoo.co.jp/article/covid19nagano",
                            "timestamp": new Date(),
                            "color": 16711680,
                            "footer": {
                                "text": "長野県　新型コロナ関連情報 - Yahoo! JAPAN"
                            },
                            "author": {
                                "name": "@Nagano_Corona",
                                "url": config.dataURI,
                                "icon_url": config.postTo.pic
                            },
                            "fields": [
                                {
                                    "name": "現在感染者数",
                                    "value": "`" + converted.current + "人`",
                                    "inline": true
                                },
                                {
                                    "name": "前日比",
                                    "value": `\`${diff > 0 ? "+" : ""} ` + converted.new + "人`",
                                    "inline": true
                                },
                                {
                                    "name": "累計感染者数",
                                    "value": "`" + converted.total + "人`",
                                    "inline": true
                                }
                            ]
                        }
                    ]
                }),
                "method": "POST",
            }).then(async(data) => {
                console.log("success");
                console.log(await data.text())
                savedData.num = num;
                fs.writeFileSync('./data.json', JSON.stringify(savedData));
            });
        }
    });

}

job();

cron.schedule("*/5 * * * *", () => {
    job();
})