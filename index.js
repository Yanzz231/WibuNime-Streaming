const { data } = require("./function/function");
const { createSerial } = require("./function/function")
const moment = require('moment')
const { objGenre } = require("./function/function")
const fetch = require('node-fetch')
const fs = require("fs")
const { loopEps, upEps, getAnime, animelist, filterStream, fetchText, ExcStream, toGets } = require("./function/scraper")
// const kk = JSON.parse(fs.readFileSync('./tes.json'))
// const anime = JSON.parse(fs.readFileSync('./database/anime.json'))
// const k = kk.id

// LOOP DATA
// animelist().then(dam => {
//     console.log("Starting..")
//     if (dam[k] === undefined || dam[k].title === '' || dam[k].title.length < 1) return console.log(`Eror`)
//     getAnime(dam[k].url).then(res => {
//         loopEps(dam[k].url).then(pe => {
//             data.addNewanime(res.judul, res.sinop, res.thumb, dam[k].title, [res.genre], moment(Date.now()).format('YYYY-MM-DD'), pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV", res.rating, res.status === "Ongoing" ? false : res.status === "Ended" ? true : false)
//             if (pe.length < 1 || pe.length === 0 || pe === undefined) {
//                 for (let a = 0; a < pe.length; a++) {
//                     upEps(dam[k].url).then(async nek => {
//                         if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
//                         var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
//                         var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
//                         data.addNewEps(dam[k].title, res.judul, res.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
//                     })
//                 }
//                 console.log(`Urutan : ${k}\nAnime : ${dam[k].title}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
//             } else {
//                 for (let a = 0; a < pe.length; a++) {
//                     upEps(pe[a].link).then(async nek => {
//                         if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
//                         var short = await fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
//                         var short2 = await fetchText(`https://www.adtival.network/api?api=%20800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
//                         data.addNewEps(dam[k].title, res.judul, res.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
//                     })
//                 }
//                 console.log(`Urutan : ${k}\nAnime : ${dam[k].title}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
//             }
//         })

        
//     })
// })
// kk.id += 1
// fs.writeFileSync('./tes.json', JSON.stringify(kk, null, 2))
// DISCORD

const discord = require('discord.js');
const client = new discord.Client()
const { Player } = require('discord-player');

client.player = new Player(client);
client.config = require('./bot');
client.emotes = client.config.emojis;
client.durasi = client.config.durasi;
client.filters = client.config.filters;
client.commands = new discord.Collection();
client.on('message', async message => {
    if (message.author.bot || message.channel.type === 'dm') return;
    require('./msgHndlrDiscord')(message, client)
});
const player = fs.readdirSync('./player').filter(file => file.endsWith('.js'));
for (const file of player) {
    const event = require(`./player/${file}`);
    client.player.on(file.split(".")[0], event.bind(null, client));
};
client.login('NzU3ODU3NDYzMDc5Nzk2NzM3.X2mfww.KU-Z5SJ_Kys0Sp16mifA5jUmPyc');
// WEBSITE
const RestApi = require('./lib/classes')
const cron = require('node-cron')
const { remove, text } = require('cheerio/lib/api/manipulation')
const { parse } = require('path')
const res = require('express/lib/response')
const clients = new RestApi()
let settings = JSON.parse(require('fs').readFileSync('./src/settings.json'))

require('fs').writeFileSync('./src/settings.json', JSON.stringify(settings, null, 5))

clients.start();