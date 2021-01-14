const cron = require('node-cron');
const fetch = require('node-fetch');
const csv = require('csvtojson');
const fs = require('fs');
const iconv = require('iconv-lite');
const reader = require('filereader');
const config = JSON.parse(fs.readFileSync("./config.json"));
let savedData = fs.existsSync('./data.json') ? JSON.parse(fs.readFileSync("./data.json")) : { num: 0 };
if (!fs.existsSync('./data.json')) {
    fs.writeFileSync('./data.json', JSON.stringify({ num: 0 }));
}

const job = () => {
    fetch(config.dataURI).then(async (data) => {
        const decode = iconv.decode(new Buffer.from(await data.arrayBuffer()), 'Shift_JIS');
        csv().fromString(decode).then(data => {
            const converted = data.slice(-1)[0];
            const num = converted['陽性患者属性'];
            if (Number(savedData.num) != Number(num)) {
                console.log(num);
                const diff = Number(num) - Number(savedData.num);
                fetch(config.postTo.uri, {
                    "headers": {
                        "content-type": "application/json",
                    },
                    "body": JSON.stringify({
                        "username": config.postTo.name,
                        "avatar_url": config.postTo.pic,
                        "content": `${new Date().toISOString()}に更新されました\n${config.pref}:\`\`\`diff\n${savedData.num}人 → ${num}人\n${diff > 0 ? "+" : ""}${diff}人\n\`\`\``
                    }),
                    "method": "POST",
                });
                savedData.num = num;
                fs.writeFileSync('./data.json', JSON.stringify(savedData));
            }
        });

    });
}

job();

cron.schedule("*/5 * * * *", () => {
    job();
})