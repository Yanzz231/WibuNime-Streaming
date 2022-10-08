const fs = require('fs')
const axios = require('axios')
const anime = JSON.parse(fs.readFileSync('./database/anime.json'))
const newanime = JSON.parse(fs.readFileSync('./database/new.json'))
const report = JSON.parse(fs.readFileSync('./database/report.json'))
const genre = JSON.parse(fs.readFileSync('./database/genre.json'))
const crypto = require('crypto')

const getAnime = () => {
    return anime
}
const createSerial = (size) => {
    var textnya = ``
    for (let i = 0; i < anime.length; i++) {
        const get = crypto.randomBytes(size).toString('hex').slice(0, size)
        if (anime[i].eps.length === 0) textnya = crypto.randomBytes(size).toString('hex').slice(0, size)
        for (let a = 0; a < anime[i].eps.length; a++) {
            if (anime[i].eps[a].id === get) {
                textnya = crypto.randomBytes(size).toString('hex').slice(0, size)
            } else {
                textnya = get
            }
        }
    }
    return textnya
}
const chnagepp = (nameurl, thumb) => {
    const indexnya = anime.findIndex(i => i.nameurl === nameurl)
    if(indexnya === -1) return false
    anime[indexnya].thumb = thumb
    fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
}
const changestatus = (nameurl, status) => {
    const indexnya = anime.findIndex(i => i.nameurl === nameurl)
    if(indexnya === -1) return false
    anime[indexnya].status = status 
    fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
}
const checkID = (id) => {
    for (let i = 0; i < anime.length; i++) {
        for (let a = 0; a < anime[i].eps.length; a++) {
            if (anime[i].eps[a].id === id) {
                return anime[i].eps[a]
            }
        }
    }
}
const getNew = () => {
    return newanime
}
const getGenre = () => {
    return genre
}
const addReport = (issue, nama, email, detail) => {
    const detailss = report.findIndex(i => i.detail === detail)
    if (detailss !== -1) return false
    obj = {
        issue: issue,
        nama: nama,
        email: email,
        detail: detail
    }
    report.push(obj)
    fs.writeFileSync('./database/report.json', JSON.stringify(report, null, 2))
}
const AllGenre = (data) => {
    var datanya = []
    var datanya1 = []
    var datanya2 = []
    for (let i = 0; i < data.length; i++) {
        datanya.push({ genre: data[i].genre })
    }
    for (let i = 0; i < datanya.length; i++) {
        for (let a = 0; a < datanya[i].genre.length; a++) {
            datanya1.push(datanya[i].genre[a])
        }
    }
    for (let i = 0; i < datanya1.length; i++) {
        if (!datanya2.includes(datanya1[i])) {
            datanya2.push(datanya1[i])
        }
    }
    return datanya2
}
const loopGenreALL = (nameurl) => {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    var textnya = ``
    for (let i = 0; i < anime[indexDB].genre.length; i++) {
        textnya += `<a href="/genre/${anime[indexDB].genre[i]}/" rel="tag">${anime[indexDB].genre[i]}</a>${i + 1 === anime[indexDB].genre.length ? "" : ", "}`
    }
    return textnya
}
const checkRepost = () => {
    return report
}
const removeReport = (id) => {
    if (parseInt(id) > report.length) return false
    report.splice(parseInt(id) - 1, 1)
    fs.writeFileSync('./database/report.json', JSON.stringify(report, null, 2))
}
async function checkNameUrl(name) {
    const indexDB = anime.findIndex(i => i.nameurl === name)
    if (indexDB === -1) return false
    return anime[indexDB]
}
const checkNameUrls = (name) => {
    const indexDB = anime.findIndex(i => i.nameurl === name)
    if (indexDB === -1) return false
    return anime[indexDB]
}
const searchAnime = (data, anime) => {
    let dataAnime = [].concat.apply([], data.map(arr => arr));
    let filterSearch = dataAnime.filter(arr => arr.nama.toLowerCase().includes(anime))
    return filterSearch
}
const getDBEps = (nama, id) => {
    if (isNaN(id)) {
        const indexName = anime.findIndex(i => i.nameurl === nama)
        if (indexName === -1) return false
        const getEps = anime[indexName].eps.findIndex(i => i.eps === id)
        return anime[indexName].eps[getEps]
    } else {
        const indexName = anime.findIndex(i => i.nameurl === nama)
        if (indexName === -1) return false
        const getEps = anime[indexName].eps.findIndex(i => i.eps === parseInt(id))
        return anime[indexName].eps[getEps]
    }
}
async function translateAnime(nama) {
    return new Promise(async (resolve, reject) => {
        const translate = require("@vitalets/google-translate-api");
        const pe = await translate(nama, {
            to: "ja",
        }).then((res => {
            resolve(res.text)
        })).catch((err) => {
            console.error(err);
        });
    })
}
async function getBuffer(url, options) {
    return new Promise(async (resolve, reject) => {
        options ? options : {}
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        }).then(pe => {
            resolve(true)
        }).catch((err) => {
            resolve(false)
        })
    })
}
const dataEnd = (dataC) => {
    var angka = 0
    for (let a = 0; a < dataC.eps.length; a++) {
        if (isNaN(dataC.eps[a].eps)) {
            angka += 1
        }
    }
    return angka
}
async function addNewanime(nama, sinop, thumb, nameurl, [genre], time, type, rating, status) {
    var obj = {
        "nama": nama,
        "sinop": sinop,
        "thumb": thumb,
        "nameurl": nameurl,
        "genre": genre,
        "time": time,
        "type": type,
        "status": status,
        "rating": rating,
        "view": 0,
        "quolity": "HD",
        "eps": [],
        "ip": []
    }
    anime.push(obj)
    fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
}
const filternull = (namenya) => {
    const indexDB = anime.findIndex(i => i.nameurl === namenya)
    if (indexDB === -1) return false
    for (let i = 0; i < anime[indexDB].eps.length; i++) {
        if (anime[indexDB].eps[i].eps === null) {
            anime[indexDB].eps[i].eps = "OVA"
            fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
        }
    }
}
const addView = (nameurl, eps, ip) => {
    if (eps === undefined) {
        const indexDB = anime.findIndex(i => i.nameurl === nameurl)
        if (anime[indexDB].ip.includes(ip)) return false
        anime[indexDB].view += 1
        anime[indexDB].ip.push(ip)
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    } else if (eps === "OVA") {
        const indexDB = anime.findIndex(i => i.nameurl === nameurl)
        const epss = anime[indexDB].eps.findIndex(i => i.eps === eps)
        if (anime[indexDB].eps[epss] === [] || anime[indexDB].eps[epss] === undefined) return false
        if (anime[indexDB].eps[epss].ip.includes(ip)) return false
        anime[indexDB].eps[epss].ip.push(ip)
        anime[indexDB].view += 1
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    } else {
        const indexDB = anime.findIndex(i => i.nameurl === nameurl)
        const getEpsnya = anime[indexDB].eps.findIndex(i => i.eps === parseInt(eps))
        if (anime[indexDB].eps[getEpsnya].ip.includes(ip)) return false
        anime[indexDB].eps[getEpsnya].ip.push(ip)
        anime[indexDB].view += 1
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
}
async function addNewEps(namaurl, nama, type, download, host, stream, eps, time, id) {
    const animeGet = anime.findIndex(i => i.nameurl === namaurl)
    if (animeGet === -1) return false
    newanime.push({
        "nama": nama,
        "url": `/anime/${namaurl}`,
        "type": type,
        "time": time,
        "eps": eps,
    })
    fs.writeFileSync('./database/new.json', JSON.stringify(newanime, null, 2))
    anime[animeGet].eps.push({
        "view": 0,
        "ip": [],
        "time": time,
        "eps": eps,
        "id": id,
        "download": [
            {
                "url": download,
                "name": host
            }
        ],
        "stream": stream
    })
    fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
}
async function addDownlaod(nameurl, eps, download, host) {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    let status = true
    for (let i = 0; i < anime[indexDB].eps[parseInt(eps).download.length - 1]; i++) {
        if (anime[indexDB].eps[parseInt(eps) - 1].download[i].url === download) {
            status = false
        }
    }
    if (status === false) return false
    anime[indexDB].eps[parseInt(eps) - 1].download.push({
        url: download,
        name: host
    })
    fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
}
async function deleteEps(nameurl, eps) {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    const indexP = anime[indexDB].eps.findIndex(i => i.eps === parseInt(eps))
    if (indexP === -1) return false
    if (indexP !== false) {
        anime[indexDB].eps.splice(indexP, 1)
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    for (let i = 0; i < newanime.length; i++) {
        if (newanime[i].url.replace("/anime/", "") === nameurl) {
            if (newanime[i].eps === parseInt(eps)) {
                newanime.splice(i, 1)
                fs.writeFileSync('./database/new.json', JSON.stringify(newanime, null, 2))
            }
        }
    }
}
async function deleteAnime(nameurl) {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    anime.splice(indexDB, 1)
    fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    for (let i = 0; i < newanime.length; i++) {
        if (newanime[i].url.replace("/anime/", "") === nameurl) {
            console.log(newanime[i])
            newanime.splice(i, 1)
            fs.writeFileSync('./database/new.json', JSON.stringify(newanime, null, 2))
        }
    }
}
async function editAnime(nameurl, type, data) {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    if (type.toLowerCase() === "nama") {
        anime[indexDB].nama = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "sinop") {
        anime[indexDB].sinop = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "thumb") {
        anime[indexDB].thumb = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "genre") {
        anime[indexDB].genre = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "type") {
        anime[indexDB].type = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "rateing") {
        anime[indexDB].rateing = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "quolity") {
        anime[indexDB].quolity = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    else if (type.toLowerCase() === "status") {
        if (data.toLowerCase() === "true") {
            anime[indexDB].status = true
            fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
        } else if (data.toLowerCase() === "false") {
            anime[indexDB].status = false
            fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
        } else {
            anime[indexDB].status = false
            fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
        }
    }
}
async function editEps(nameurl, eps, type, data) {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    if (type.toLowerCase() === "download") {
        anime[indexDB].eps[parseInt(eps) - 1].download[parseInt(index)].url = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
    if (type.toLowerCase() === "stream") {
        anime[indexDB].eps[parseInt(eps) - 1].stream = data
        fs.writeFileSync('./database/anime.json', JSON.stringify(anime, null, 2))
    }
}
const checkThumb = (nameurl) => {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    return anime[indexDB].thumb
}
const checkData = (nameurl) => {
    const indexDB = anime.findIndex(i => i.nameurl === nameurl)
    if (indexDB === -1) return false
    return anime[indexDB]
}
const objGenre = (text) => {
    const hasilrpl = text.toLowerCase().replace(/ /g, '')
    return hasilrpl.trim().split(/,/).slice(0)
}
module.exports = {
    data: {
        addNewanime,
        addNewEps,
        deleteEps,
        deleteAnime,
        editEps,
        editAnime,
        addDownlaod
    }
}
module.exports.filternull = filternull
module.exports.getBuffer = getBuffer
module.exports.dataEnd = dataEnd
module.exports.checkID = checkID
module.exports.createSerial = createSerial
module.exports.AllGenre = AllGenre
module.exports.getAnime = getAnime
module.exports.getNew = getNew
module.exports.getGenre = getGenre
module.exports.translateAnime = translateAnime
module.exports.loopGenreALL = loopGenreALL
module.exports.checkData = checkData
module.exports.checkRepost = checkRepost
module.exports.addView = addView
module.exports.searchAnime = searchAnime
module.exports.objGenre = objGenre
module.exports.checkThumb = checkThumb
module.exports.checkNameUrl = checkNameUrl
module.exports.checkNameUrls = checkNameUrls
module.exports.getDBEps = getDBEps
module.exports.addNewanime = addNewanime
module.exports.addNewEps = addNewEps
module.exports.addReport = addReport
module.exports.removeReport = removeReport
module.exports.chnagepp = chnagepp
module.exports.changestatus = changestatus