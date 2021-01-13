const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync("./config.json"));
let savedData = fs.existsSync('./data.json') ? JSON.parse(fs.readFileSync("./data.json")) : { num: 0 };
if (!fs.existsSync('./data.json')) {
    fs.writeFileSync('./data.json', JSON.stringify({ num: 0 }));
}

const job = () => {
    fetch(config.dataURI).then(async (data) => {
        const cache = await data.json();
        const num = cache[0].area.find(el => el.name_jp == config.pref).npatients;
        console.log(num);
        if (Number(savedData.num) != Number(num)) {
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
}

job();

cron.schedule("*/5 * * * *", () => {
    job();
})