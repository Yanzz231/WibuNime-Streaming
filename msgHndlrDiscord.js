module.exports = msgHandlerDiscord = async (message, client) => {
    try {
        // MODULE
        const fs = require("fs");
        // DATA
        const moment = require('moment')
        let prefix = "."
        body = message.content
        const { data } = require("./function/function");
        const { createSerial } = require("./function/function")
        const { objGenre } = require("./function/function")
        const { getAnime1, loopEpp1, upAnime1, getAnime2, loopEpp2, upAnime2 } = require("./function/otaku")
        const fetch = require('node-fetch')
        const { loopEps, upEps, getAnime, animelist, filterStream, fetchText, ExcStream, toGets, toNum, toNumss } = require("./function/scraper")
        const { getNew, getGenre, checkNameUrl, chnagepp, changestatus } = require("./function/function")
        const newanime = getNew()
        // const allanime = getAnime()
        const genre = getGenre()
        const ownerID = ["757857463079796737", "786145311503941652", "508963965691232256"]
        const isOwner = ownerID.includes(client.user.id)
        const commnad = body.trim().split(/ +/).shift().toLowerCase()
        const argsMc = body.split(' ')
        if (commnad === prefix + "help") {
            message.channel.send({
                embed: {
                    color: 'RED',
                    author: { name: 'HELP PANEL' },
                    footer: { text: 'Made By Yanz' },
                    fields: [
                        { name: `${client.emotes.music} Music`, value: '`Play`, `Loop`, `Queue`, `NowPlaying`, `Resume`, `Pause`, `Skip`. `Stop`, `Volume`' },
                        { name: `${client.emotes.obeng} Utility`, value: '`Ping`, `Say`' },
                        { name: `${client.emotes.king} Moderator`, value: '`purge`' }
                    ],
                    timestamp: new Date(),
                    thumbnail: { url: 'https://cdn.discordapp.com/avatars/757857463079796737/5d5f958a1f867d79a7b723d671a64aeb.webp' },
                    description: `Ini Adalah Command Command Yang Ada Di Yanz BOT`,
                },
            });
        }
        if (commnad === prefix + "eval") {
            if (isOwner) {
                try {
                    return message.channel.send(JSON.stringify(eval(argsMc[1]), null, '\t'));
                } catch (e) {
                    a = String(e)
                    message.channel.send(`Error banh`)
                    console.log(a)
                }
            }
        }
        if (commnad === prefix + "changepic") {
            var reg = body.slice(11)
            var tag = reg.split("|")[0]
            if (tag.length === undefined) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (tag.length < 1) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            tag = tag.replace(/ /g, '')
            var type = reg.split("|")[1];
            if (type.length === undefined) return message.channel.send(`${client.emotes.error} - Input type !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (type.length < 1) return message.channel.send(`${client.emotes.error} - Input type !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            type = type.replace(/ /g, '')
            chnagepp(tag, type)
        }
        if (commnad === prefix + "changestatus") {
            var reg = body.slice(14)
            var tag = reg.split("|")[0]
            if (tag.length === undefined) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (tag.length < 1) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            tag = tag.replace(/ /g, '')
            var type = reg.split("|")[1];
            if (type.length === undefined) return message.channel.send(`${client.emotes.error} - Input type !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (type.length < 1) return message.channel.send(`${client.emotes.error} - Input type !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            type = type.replace(/ /g, '')
            changestatus(tag, type)
        }
        if (commnad === prefix + "testimoni") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            var reg = body.slice(11)
            var tag = reg.split("|")[0]
            if (tag.length === undefined) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (tag.length < 1) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            tag = tag.replace(/ /g, '')
            var type = reg.split("|")[1];
            if (type.length === undefined) return message.channel.send(`${client.emotes.error} - Input type !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (type.length < 1) return message.channel.send(`${client.emotes.error} - Input type !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            type = type.replace(/ /g, '')
            var number = reg.split("|")[2];
            if (number.length === undefined) return message.channel.send(`${client.emotes.error} - Input Testimoni !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (number.length < 1) return message.channel.send(`${client.emotes.error} - Input Testimoni !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            number = number.replace(/ /g, '')
            var image = reg.split("|")[3];
            if (image.length === undefined) return message.channel.send(`${client.emotes.error} - Input Testimoni !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (image.length < 1) return message.channel.send(`${client.emotes.error} - Input Testimoni !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            image = image.replace(/ /g, '')
            const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(tag)
            message.channel.send(`<@${mentionedMember.user.id}>`)
            message.channel.send({
                embed: {
                    color: 0x0099ff,
                    title: `#Testimoni ${number}`,
                    fields: [
                        {
                            name: `Pembeli : ${mentionedMember.user.tag}`,
                            value: `Produk : ${type}`,
                        },
                    ],
                    image: {
                        url: `${image}`,
                    },
                    timestamp: new Date(),
                    footer: {
                        text: 'Terjamin Terpercaya'
                    },
                },
            });
        }
        if (commnad === prefix + "chatembed") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            var reg = body.slice(11)
            var desc = reg.split("|")[0]
            if (desc.length === undefined) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (desc.length < 1) return message.channel.send(`${client.emotes.error} - Input Tag !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            message.channel.send({
                embed: {
                    color: 0x0099ff,
                    author: {
                        name: 'YP Store | Market Digital',
                        icon_url: 'https://cdn.discordapp.com/avatars/757857463079796737/5d5f958a1f867d79a7b723d671a64aeb.webp',
                        url: 'https://wibunime.xyz',
                    },
                    description: `${desc}`,
                    timestamp: new Date(),
                },
            });
        }
        if (commnad === prefix + "ping") {
            message.channel.send(`${client.emotes.success} - Ping : **${client.ws.ping}ms** !`);
        }
        if (commnad === prefix + "say") {
            message.channel.send(`${body.slice(5)}`);
        }
        if (commnad === prefix + "purge") {
            if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send(`${client.emotes.error} - You Don't Have Permissions !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (!message.guild.me.hasPermission("MANAGE_MESSAGES")) return message.channel.send(`${client.emotes.error} - I Don't Have Permissions !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (argsMc[1].length < 1) return message.channel.send(`${client.emotes.error} - Please Supply A Valid Amount To Delete Messages !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (isNaN(argsMc[1]))
                return message.channel.send(`${client.emotes.error} - Please Supply A Valid Amount To Delete Messages !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })

            if (argsMc[1] > 100)
                return message.channel.send(`${client.emotes.error} - Please Supply A Number Less Than 100 !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })

            if (argsMc[1] < 1)
                return message.channel.send(`${client.emotes.error} - Please Supply A Number More Than 1 !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })

            message.channel.bulkDelete(argsMc[1])
                .then(messages => message.channel.send(`${client.emotes.success} - Deleted ${messages.size} / ${argsMc[1]} Messages !`).then(msg => msg.delete({ timeout: client.durasi.message }))).catch(() => null)
        }
        if (commnad === prefix + "otakugeteps") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            getAnime1(argsMc[1]).then(res => {
                if (checkNameUrl(res.judul) === false) return message.channel.send(`${client.emotes.error} - This Anime Doesn't Exist !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })
                loopEpp1(argsMc[1]).then(ress => {
                    if (ress === undefined) return message.channel.send(`${client.emotes.error} - This Anime Doesn't Have Episodes !`).then(msg => {
                        setTimeout(() => msg.delete(), client.durasi.message)
                    })
                    for (let i = 0; i < ress.length; i++) {
                        upAnime1(ress[i].link).then(async nek => {
                            var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
                            var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
                            console.log(`Anime : ${toGets(res.judul)}\nEps : ${toNumss(argsMc[1])}\nType : ${toNumss(argsMc[1]) === undefined || toNumss(argsMc[1]).length < 1 || toNumss(argsMc[1]).length === 0 ? "MOVIE" : "TV"}`)
                            data.addNewEps(toGets(res.judul), res.judul, res.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, parseInt(toNumss(argsMc[1])), moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                        })
                    }
                })
            })
        }
        if (commnad === prefix + "anoboy2") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (argsMc[1] === undefined) return message.channel.send(`${client.emotes.error} - Please Supply A Valid Anime Name !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            getAnime2(argsMc[1]).then(res => {
                if (checkNameUrl(res.judul) != false) return message.channel.send(`${client.emotes.error} - This Anime Already Available !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })
                data.addNewanime(res.judul, res.sinop, res.thumb, toGets(res.judul), ['Action', 'Adventure', 'Adventure', 'Drama', 'Fantasy', 'Shounen', 'Super Power'], moment(Date.now()).format('YYYY-MM-DD'), pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV", animeGET.rating, animeGET.status === "Ongoing" ? false : animeGET.status === "Ended" ? true : false)
                loopEpp2(argsMc[1]).then(ress => {
                    if (ress === undefined) return message.channel.send(`${client.emotes.error} - This Anime Doesn't Have Episodes !`).then(msg => {
                        setTimeout(() => msg.delete(), client.durasi.message)
                    })
                    for (let i = 0; i < ress.length; i++) {
                        upAnime2(ress[i].link).then(async nek => {
                            var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.download != undefined ? nek.download : nek.stream}`)
                            var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.download != undefined ? nek.download : nek.stream}`)
                            data.addNewanime(toGets(res.judul), res.sinop, res.thumb)
                            console.log(`Anime : ${toGets(res.judul)}\nEps : ${toNumss(argsMc[1])}\nType : ${toNumss(argsMc[1]) === undefined || toNumss(argsMc[1]).length < 1 || toNumss(argsMc[1]).length === 0 ? "MOVIE" : "TV"}`)
                        })
                    }
                })
            })
        }
        if (commnad === prefix + "anoboygetall") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            var textnya = body.slice(14)
            getAnime2(argsMc[1]).then(animeGET => {
                if (checkNameUrl(animeGET.judul) === false) return message.channel.send(`${client.emotes.error} - This Anime Already Exists !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })
                console.log(animeGET)
                loopEpp2(argsMc[1]).then(pe => { // judulnya eror ga
                    data.addNewanime(animeGET.judul, animeGET.sinop, animeGET.thumb, toGets(animeGET.judul), [objGenre(animeGET.genre)], moment(Date.now()).format('YYYY-MM-DD'), pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV", animeGET.rating, animeGET.status === "Ongoing" ? false : animeGET.status === "Ended" ? true : false)
                    if (pe.length < 1 || pe.length === 0 || pe === undefined) { // ga itu bnr itu buat check kalo vidio kgk ada dia check lgi 
                        for (let a = 0; a < pe.length; a++) { //itu function loopepp1 nya eror // buat detek movie lebih tptnya , yang bwh buat defult
                            upAnime2(argsMc[1]).then(async nek => {// ini nqpq argsmc di kasi?
                                if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
                                var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.download != '-' ? nek.download : nek.stream}`)
                                var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.download != '-' ? nek.download : nek.stream}`)
                                data.addNewEps(toGets(animeGET.judul), animeGET.judul, animeGET.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                            })
                        }
                        console.log(`Anime : ${toGets(animeGET.judul)}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
                    } else {
                        for (let a = 0; a < pe.length; a++) {
                            upAnime2(pe[a].link).then(async nek => {
                                if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
                                var short = await fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.download != '-' ? nek.download : nek.stream}`)
                                var short2 = await fetchText(`https://www.adtival.network/api?api=%20800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.download != '-' ? nek.download : nek.stream}`)
                                data.addNewEps(toGets(animeGET.judul), animeGET.judul, animeGET.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                            })
                        }
                        console.log(`Anime : ${toGets(animeGET.judul)}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
                    }
                })
            })
        }
        if (commnad === prefix + "otakugetall") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            var textnya = body.slice(15)
            getAnime1(argsMc[1]).then(animeGET => {
                if (checkNameUrl(animeGET.judul) === false) return message.channel.send(`${client.emotes.error} - This Anime Already Exists !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })
                loopEpp1(argsMc[1]).then(pe => {
                    data.addNewanime(animeGET.judul, animeGET.sinop, animeGET.thumb, toGets(animeGET.judul), [objGenre(animeGET.genre)], moment(Date.now()).format('YYYY-MM-DD'), pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV", animeGET.rating, animeGET.status === "Ongoing" ? false : animeGET.status === "Ended" ? true : false)
                    if (pe.length < 1 || pe.length === 0 || pe === undefined) {
                        for (let a = 0; a < pe.length; a++) { //itu function loopepp1 nya eror
                            upAnime1(argsMc[1]).then(async nek => {//
                                if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
                                var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
                                var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
                                data.addNewEps(toGets(animeGET.judul), animeGET.judul, animeGET.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                            })
                        }
                        console.log(`Anime : ${toGets(animeGET.judul)}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
                    } else {
                        for (let a = 0; a < pe.length; a++) {
                            upAnime1(pe[a].link).then(async nek => {
                                if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
                                var short = await fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
                                var short2 = await fetchText(`https://www.adtival.network/api?api=%20800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
                                data.addNewEps(toGets(animeGET.judul), animeGET.judul, animeGET.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                            })
                        }
                        console.log(`Anime : ${toGets(animeGET.judul)}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
                    }
                })
            })
        }
        if (commnad === prefix + "nanimexgeteps") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            getAnime(argsMc[1]).then(res => {
                if (checkNameUrl(res.judul) === false) return message.channel.send(`${client.emotes.error} - This Anime Doesn't Exist !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })
                upEps(argsMc[1]).then(async nek => {
                    if (nek.stream === undefined || toNum(argsMc[1]) === null) return console.log(`nih eror : ${argsMc[1]}`)
                    var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
                    var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
                    console.log(`Anime : ${toGets(res.judul)}\nEps : ${toNumss(argsMc[1])}\nType : ${toNumss(argsMc[1]) === undefined || toNumss(argsMc[1]).length < 1 || toNumss(argsMc[1]).length === 0 ? "MOVIE" : "TV"}`)
                    data.addNewEps(toGets(res.judul), res.judul, res.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, parseInt(toNumss(argsMc[1])), moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                })
            })
        }
        if (commnad === prefix + "deleteanime") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            data.deleteAnime(argsMc[1])
        }
        if (commnad === prefix + "deleteeps") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            var reg = body.slice(11)
            var desc = reg.split("|")[0]
            var desc2 = reg.split("|")[1]
            data.deleteEps(desc,desc2)
        }
        if (commnad === prefix + "nanimexgetall") {
            if (!isOwner) return message.channel.send(`${client.emotes.error} - You're are not Owner !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            var textnya = body.slice(15)
            getAnime(argsMc[1]).then(animeGET => {
                if (checkNameUrl(animeGET.judul) === false) return message.channel.send(`${client.emotes.error} - This Anime Already Exists !`).then(msg => {
                    setTimeout(() => msg.delete(), client.durasi.message)
                })
                loopEps(argsMc[1]).then(pe => {
                    data.addNewanime(animeGET.judul, animeGET.sinop, animeGET.thumb, toGets(animeGET.judul), [animeGET.genre], moment(Date.now()).format('YYYY-MM-DD'), pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV", animeGET.rating, animeGET.status === "Ongoing" ? false : animeGET.status === "Ended" ? true : false)
                    if (pe.length < 1 || pe.length === 0 || pe === undefined) {
                        for (let a = 0; a < pe.length; a++) {
                            upEps(argsMc[1]).then(async nek => {
                                if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
                                var short = fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
                                var short2 = fetchText(`https://www.adtival.network/api?api=800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
                                data.addNewEps(toGets(animeGET.judul), animeGET.judul, animeGET.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                            })
                        }
                        console.log(`Anime : ${toGets(animeGET.judul)}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
                    } else {
                        for (let a = 0; a < pe.length; a++) {
                            upEps(pe[a].link).then(async nek => {
                                if (nek.stream === undefined || pe[a].eps === null) return console.log(`nih eror : ${pe[a].link}`)
                                var short = await fetchText(`https://ouo.io/api/p2tFHOhU?s=${nek.stream}`)
                                var short2 = await fetchText(`https://www.adtival.network/api?api=%20800ee9cfdad2e43c872d88b8b83cdbfc66d42952&url=${nek.stream}`)
                                data.addNewEps(toGets(animeGET.judul), animeGET.judul, animeGET.type.toUpperCase(), short === 400 ? short2 === 400 ? null : short2.shortenedUrl : short, '', nek.stream, pe[a].eps, moment(Date.now()).format('YYYY-MM-DD'), createSerial(400))
                            })
                        }
                        console.log(`Anime : ${toGets(animeGET.judul)}\nEps : ${pe.length}\nType : ${pe === undefined || pe.length < 1 || pe.length === 0 ? "MOVIE" : "TV"}`)
                    }
                })
            })
        }
        if (commnad === prefix + "volume") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!argsMc[1] || isNaN(argsMc[1]) || argsMc[1] === 'Infinity') return message.channel.send(`${client.emotes.error} - Please enter a valid number !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (Math.round(parseInt(argsMc[1])) < 1 || Math.round(parseInt(argsMc[1])) > 100) return message.channel.send(`${client.emotes.error} - Please enter a valid number (between 1 and 100) !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            const success = client.player.setVolume(message, parseInt(argsMc[1]));

            if (success) message.channel.send(`${client.emotes.success} - Volume set to **${parseInt(argsMc[1])}%** !`);
        }
        if (commnad === prefix + "stop" || commnad === prefix + "leave") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            client.player.setRepeatMode(message, false);
            const success = client.player.stop(message);

            if (success) message.channel.send(`${client.emotes.success} - Music **stopped** into this server !`)
        }
        if (commnad === prefix + "skip") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            const success = client.player.skip(message);

            if (success) message.channel.send(`${client.emotes.success} - The current music has just been **skipped** !`)
        }
        if (commnad === prefix + "play") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            if (!argsMc[1]) return message.channel.send(`${client.emotes.error} - Please indicate the title of a song !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })
            client.player.play(message, argsMc[1], { firstResult: true });
        }
        if (commnad === prefix + "nowplaying") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            const track = client.player.nowPlaying(message);
            const filters = [];

            Object.keys(client.player.getQueue(message).filters).forEach((filterName) => client.player.getQueue(message).filters[filterName]) ? filters.push(filterName) : false;

            message.channel.send({
                embed: {
                    color: 'RED',
                    author: { name: track.title },
                    footer: { text: 'Made By Yanz & Pudidi' },
                    fields: [
                        { name: 'Channel', value: track.author, inline: true },
                        { name: 'Requested by', value: track.requestedBy.username, inline: true },
                        { name: 'From playlist', value: track.fromPlaylist ? 'Yes' : 'No', inline: true },

                        { name: 'Views', value: track.views, inline: true },
                        { name: 'Duration', value: track.duration, inline: true },
                        { name: 'Filters activated', value: filters.length + '/' + client.filters.length, inline: true },

                        { name: 'Volume', value: client.player.getQueue(message).volume, inline: true },
                        { name: 'Repeat mode', value: client.player.getQueue(message).repeatMode ? 'Yes' : 'No', inline: true },
                        { name: 'Currently paused', value: client.player.getQueue(message).paused ? 'Yes' : 'No', inline: true },

                        { name: 'Progress bar', value: client.player.createProgressBar(message, { timecodes: true }), inline: true }
                    ],
                    thumbnail: { url: track.thumbnail },
                    timestamp: new Date(),
                },
            });
        }
        if (commnad === prefix + "pause") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (client.player.getQueue(message).paused) return message.channel.send(`${client.emotes.error} - The music is already paused !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            const success = client.player.pause(message);

            if (success) message.channel.send(`${client.emotes.success} - Song ${client.player.getQueue(message).playing.title} paused !`);
        }
        if (commnad === prefix + "resume") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`);

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`);

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`);

            if (!client.player.getQueue(message).paused) return message.channel.send(`${client.emotes.error} - The music is already playing !`);

            const success = client.player.resume(message);

            if (success) message.channel.send(`${client.emotes.success} - Song ${client.player.getQueue(message).playing.title} resumed !`);
        }
        if (commnad === prefix + "queue") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`);

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`);
            const queue = client.player.getQueue(message);

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No songs currently playing !`);

            message.channel.send({
                embed: {
                    color: 'RED',
                    author: { name: `Server Queue - ${message.guild.name} ${client.player.getQueue(message).loopMode ? '( Loop )' : ''}` },
                    footer: { text: 'Made By Yanz' },
                    fields: [
                        { name: 'Now', value: `${queue.playing.title} | ${queue.playing.author}\n\n` },
                        {
                            name: 'Queue', value: queue.tracks.map((track, i) => {
                                return `**#${i + 1}** - ${track.title} | ${track.author} ( Requested by : ${track.requestedBy.username} )`
                            })
                        },
                    ],
                    thumbnail: { url: queue.playing.thumbnail },
                    timestamp: new Date(),
                },
            });
        }
        if (commnad === prefix + "loop") {
            if (!message.member.voice.channel) return message.channel.send(`${client.emotes.error} - You're not in a voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`${client.emotes.error} - You are not in the same voice channel !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (!client.player.getQueue(message)) return message.channel.send(`${client.emotes.error} - No music currently playing !`).then(msg => {
                setTimeout(() => msg.delete(), client.durasi.message)
            })

            if (argsMc[1] === 'queue') {
                if (client.player.getQueue(message).loopMode) {
                    client.player.setLoopMode(message, false);
                    return message.channel.send(`${client.emotes.success} - Repeat mode **disabled** !`);
                } else {
                    client.player.setLoopMode(message, true);
                    return message.channel.send(`${client.emotes.success} - Repeat mode **enabled** the whole queue will be repeated endlessly !`);
                };
            } else {
                if (client.player.getQueue(message).repeatMode) {
                    client.player.setRepeatMode(message, false);
                    return message.channel.send(`${client.emotes.success} - Repeat mode **disabled** !`);
                } else {
                    client.player.setRepeatMode(message, true);
                    return message.channel.send(`${client.emotes.success} - Repeat mode **enabled** the current music will be repeated endlessly !`);
                };
            };
        }
    } catch (err) {
        console.log(err)
    }
}