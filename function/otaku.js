const axios = require('axios')
const cheerio = require('cheerio');

const toNum = (text) => {
    let position = text.search("Episode");
    if (position === -1) {
        let positions = text.search("OVA")
        return "OVA"
    } else {
        let hasil = text.slice(position)
        let pnum = hasil.replace(/^\D+/g, '');
        let num = pnum.match(/\d+/)
        return parseInt(num)
    }
}


async function getAnime1(url){
    try {
        const response = await axios.get(url)
        const $ = cheerio.load(response.data)
        let hasil = []
        let judul = $('.fotoanime > .infozin > div > p:nth-child(1) > span').text().trim().replace('Judul: ', '')
        let thumb = $('.fotoanime > img').attr('src')
        let sinop = $('.sinopc').text().trim()
        let status = $('.fotoanime > .infozin > div > p:nth-child(6) > span').text().trim().replace('Status: ', '')
        let genre = $('.fotoanime > .infozin > div > p:nth-child(11) > span').text().trim().replace('Genre: ', '')
        let rilis = $('.fotoanime > .infozin > div > p:nth-child(9) > span').text().trim().replace('Tanggal Rilis: ', '')
        let rating = $('.fotoanime > .infozin > div > p:nth-child(3) > span').text().trim().replace('Skor: ', '')
        const obj = {
            judul: judul,
            thumb: thumb,
            sinop: sinop,
            type: "TV",
            status: status,
            genre: genre,
            rilis: rilis,
            rating: rating.length < 1 || isNaN(rating) ? '-' : rating
        }
        hasil.push(obj)
        return hasil[0]
    } catch (err) {
        console.log(err)
        return false
    }
}
async function loopEpp1(url){
    try {
        const res = await axios.get(url)
        const $ = cheerio.load(res.data)
        let hasil = []
        $('.episodelist').each(function (an, jg) {
            $(jg).find('ul > li > span').each(function (BIT, CH) {
                let link = $(CH).find('a').attr('href')
                let title = $(CH).find('a').text().trim()
                if (link == undefined || link.includes('/batch/')) return
                const result = {
                    eps: toNum(title),
                    link: link,
                    title: title
                }
                hasil.push(result)
            })
        })
        return hasil
    } catch (err) {
        console.log(err)
        return false
    }
}

async function upAnime1(url){
    try{
        const res = await axios.get(url)
        const $ = cheerio.load(res.data)
        let hasil = []
        let stream = $('#embed_holder > .player-embed > .responsive-embed-stream > iframe').attr('src')
        const result = {
            stream: stream
        }
        hasil.push(result)
        return result
    } catch (err) {
        console.log(err)
        return false
    }
}

async function getAnime2(url){
    try {
        const response = await axios.get(url)
        const res = await axios.get(`https://anoboy.online/episode/${url.replace('https://anoboy.online/anime/', '')}-episode-001`)
        console.log(`https://anoboy.online/episode/${url.replace('https://anoboy.online/anime/', '')}-episode-001`)
        const $ = cheerio.load(response.data)
        const $2 = cheerio.load(res.data)
        let hasil = []
        let judul = $('.bigcontent > .infox > h1').text().trim()
        let sinop = $('.bixbox.synp > .entry-content').text().trim()
        let status = $2('.single-info.bixbox > .info-content > .spe > span > a').text().trim()
        let rating = $2('.single-info.bixbox > .infox > .rating > strong').text().trim().replace('Rating ', '')
        let thumb = $('.bigcontent > .thumbook > .thumb > img').attr('src')
        const obj = {
            judul: judul,
            thumb: thumb,
            sinop: sinop,
            type: "TV",
            status: status == 'Ended' ? true : false,
            genre: "action",
            rilis: '-',
            rating: rating.length < 1 || isNaN(rating) ? '-' : rating
        }
        hasil.push(obj)
        return hasil[0]
    } catch (err) {
        console.log(err)
        return false
    }
}

async function loopEpp2(url){
    try {
        const res = await axios.get(url)
        const $ = cheerio.load(res.data)
        let hasil = []
        $('.eplister').each(function (an, jg) {
            $(jg).find('ul > li').each(function (BIT, CH) {
                let link = $(CH).find('a').attr('href')
                let title = $(CH).find('a > div.epl-title').text().trim()
                let num = $(CH).find('a > div.epl-num').text().trim()
                if (link == undefined || link.includes('batch')) return
                const result = {
                    eps: num,
                    link: link,
                    title: title
                }
                hasil.push(result)
            })
        })
        return hasil
    } catch (err) {
        console.log(err)
        return false
    }
}

async function upAnime2(url){
    try{
        const res = await axios.get(url)
        const $ = cheerio.load(res.data)
        let hasil = []
        let stream = $('#embed_holder #pembed > iframe').attr('src')
        const result = {
            stream: stream,
            download: stream.includes('uservideo') ? stream.replace('?embed=true', '') : '-'
        }
        hasil.push(result)
        return result
    } catch (err) {
        console.log(err)
        return false
    }
}
// loopEpp2("https://anoboy.online/anime/one-piece").then(data => {
//     console.log(data)
// })
// upAnime2('https://anoboy.online/episode/one-piece-episode-819').then(data => {
//     console.log(data)
// })

module.exports.getAnime1 = getAnime1
module.exports.upAnime1 = upAnime1
module.exports.loopEpp1 = loopEpp1
module.exports.getAnime2 = getAnime2
module.exports.upAnime2 = upAnime2
module.exports.loopEpp2 = loopEpp2