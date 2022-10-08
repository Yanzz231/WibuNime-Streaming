const { exec } = require('child_process')
const {checkThumb} = require('./function')
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const fetch = require('node-fetch')
const request = require("request")

const isImage = (url) => {
	return new Promise(resolve => {
		axios.head(url)
		.then(async (res) => {	
        	if (res.status !== 200) resolve(false)
			resolve(!!res.headers['content-type'].toLowerCase().match(/image/))
		})
		.catch(async (e) => {
			resolve(false)
		})
	})
}

const filterThumb = (datas, page) => {
		let data = []
		for (let i = 0; i < datas.length; i++) {
		  if (datas[i].type === "TV" || datas[i].type === "BD") {
			data.push(datas[i])
		  }
		}
		let pageX = page === undefined ? 1 : page
		if (isNaN(page)) {
		  pageX = 1
		}
		if (data.length < 13) {
			  var textnya = []
			  for (let i = data.length - 1; i > -1; i--) {
				if (data[i].type === "TV" || data[i].type === "BD") {
					textnya.push(checkThumb(data[i].url.replace("/anime/", "")))
				}
			  }
			  return textnya
		} else {
		  // FILTER AKHIR
		  let satu = 12 * pageX
		  let dua = data.length - satu - 1
		  // FILTER AWAL
		  let awal1 = pageX - 1
		  let awal2 = 12 * awal1
		  let awal3 = data.length - awal2 - 1
		  var textnya = []
		  if (awal3 < 1) return false
		  if (awal3 < 12) {
			let filternya = pageX - 1
			let damnya = 12 * filternya
			for (let i = data.length - damnya - 1; i > -1; i--) {
				  if (data[i].type === "TV" || data[i].type === "BD") {
					  textnya.push(checkThumb(data[i].url.replace("/anime/", "")))
				  }
			}
			return textnya
		  } else {
			for (let i = awal3; i > dua; i--) {
				  if (data[i].type === "TV" || data[i].type === "BD") {
					  textnya.push(checkThumb(data[i].url.replace("/anime/", "")))
				  }
			}
			return textnya
		  }
		}
}

const fetchJson = (url) => new Promise(async (resolve, reject) => {
	axios.request(url, {
		method: "GET"
	}).then(respon => {
		resolve(respon.data)
	}).catch(e => {
		//console
		resolve(400)
	})
})
const fetchText = (url) => new Promise(async (resolve, reject) => {
	axios.request(url, {
		method: "GET"
	}).then(respon => {
		resolve(respon.data)
	}).catch(e => {
		//console
		resolve(400)
	})
})

async function upEps(url) {
	return new Promise((resolve, reject) => {
		axios.request(url, {
			method: "GET",
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-language": "en-US,en;q=0.9,id;q=0.8",
				"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
			}
		}).then(respon => {
			const $ = cheerio.load(respon.data)
			let hasil = []
			let streama = $('option.link_server').attr('value')
			let stream1 = $('option.link_server:nth-child(1)').attr('value')
			let stream2 = $('option.link_server:nth-child(2)').attr('value')
			let stream3 = $('option.link_server:nth-child(3)').attr('value')
			let stream4 = $('option.link_server:nth-child(4)').attr('value')
			let stream5 = $('option.link_server:nth-child(5)').attr('value')
			let stream6 = $('option.link_server:nth-child(6)').attr('value')
		//console.log(stream1, stream2, stream3, stream4, stream5, stream6)
			hasil.push({ stream: stream1 === undefined ? "google.com" : stream1 }, { stream: stream2 === undefined ? "google.com" : stream2 }, { stream: stream3 === undefined ? "google.com" : stream3 }, { stream: stream4 === undefined ? "google.com" : stream4 }, { stream: stream5 === undefined ? "google.com" : stream5 }, { stream: stream6 === undefined ? "google.com" : stream6 })
            // console.log(hasil)
            let hasil2 = hasil.filter(arr => arr.stream.includes('uservideo') || arr.stream.includes('naniplay'))
			let hasil3 = hasil2.filter(arr => arr.stream.includes('1080p'))	
			let hasil4 = hasil2.filter(arr => arr.stream.includes('480'))
			if(hasil3.length < 1){
				if(hasil4.length < 1){
			        resolve({ stream: streama})
			    }else{
				    resolve({ stream: hasil4[0].stream})
				}
			}else if(hasil4.length < 1){
				if(hasil3.length < 1){
			        resolve({ stream: streama})
			    }else{
				    resolve({ stream: hasil3[0].stream})
				}
			}else{
				resolve({ stream: streama})
				}
		})
	})
}
function findTextAndReturnRemainder(target, variable) {
	var chopFront = target.substring(target.search(variable) + variable.length, target.length);
	var result = chopFront.substring(0, chopFront.search(";"));
	return result;
}
async function ExcStream(url) {
	return new Promise((resolve, reject) => {
		axios.request(url, {
			method: "GET",
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-language": "en-US,en;q=0.9,id;q=0.8",
				"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
			}
		}).then(async (respon) => {
			const $ = cheerio.load(respon.data);
			var strimling = $('body > video > source').attr('src')
			if (strimling === undefined) {
				var findAndClean = findTextAndReturnRemainder(respon.data, "sources: ")
				var res = findAndClean.replace(")", "]").replace(/'/g, '"').replace('image: ', '"image": ').replace('"type":"video/mp4"}]', '"type":"video/mp4"').replace('captions:', '"captions":').replace('color:', '"color":').replace('fontSize:', '"fontSize":').replace('backgroundOpacity:', '"backgroundOpacity":').replace('},', '}')
				if (res.includes('html>')) {
					var findAndClean2 = findTextAndReturnRemainder(respon.data, '{"file":"')
					var res2 = '{"file":"' + findAndClean2.replace("')", "")//.replace(/'/g, '"').replace('image: ', '"image": ').replace('"type":"video/mp4"}]', '"type":"video/mp4"').replace('captions:', '"captions":').replace('color:', '"color":').replace('fontSize:', '"fontSize":').replace('backgroundOpacity:', '"backgroundOpacity":').replace('},', '}')
					var ress2 = JSON.parse(res2)
					resolve({ stream: ress2.file, thumb: undefined, short: ress2.file })
					return
				} else {
					var ress = JSON.parse(res)
					resolve({ stream: ress[0].file.replace(/\s+/g, ''), short: ress[0].file.replace(/\s+/g, ''), thumb: ress[0].thumb })
					return
				}
			} else {
				resolve({ stream: strimling.replace(/\s+/g, ''), short: strimling.replace(/\s+/g, ''), thumb: undefined })
			}
		}).catch((e) => {
			resolve({ status: false, mess: e })
		})
	})
}
async function filterStream(text) {
	if (text.includes("desustream.me")) {
		ExcStream(text).then(res => {
			return { stream: res.stream, down: res.short }
		})
	} else {
		return undefined
	}
}
async function getAnime(url) {
	return new Promise((resolve, reject) => {
		axios.request(url, {
			method: "GET",
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-language": "en-US,en;q=0.9,id;q=0.8",
				"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
			}
		}).then(respon => {
			const $ = cheerio.load(respon.data)
			let hasil = []
			let thumb = $('div.attachment-block.clearfix > a > img').attr('src')
			let sinop = $('div.attachment-pushed.plot > div.attachment-text').text().trim()
			let judul = $('div.box.box-primary > div.box-body > table > tbody > tr:nth-child(1) > td:nth-child(2) > a:nth-child(1)').text().trim()
			let status = $('div.box.box-primary > div.box-body > table > tbody > tr:nth-child(5) > td:nth-child(2) > a:nth-child(1)').text().trim()
			let rating = $('div.box.box-primary > div.box-body > table > tbody > tr:nth-child(3) > td:nth-child(2)').text().trim()
			let rilis = $('div.box.box-primary > div.box-body > table > tbody > tr:nth-child(1) > td:nth-child(2) > a:nth-child(2)').text().trim()
			let arrgen = []
			$('div.box.box-primary > div.box-body > table > tbody > tr:nth-child(9) > td:nth-child(2) > a').each(function (kn, tl) {
				let genre = $(tl).text().trim()
				arrgen.push(genre)
			})
			const result = {
				judul: judul,
				thumb: thumb,
				sinop: sinop,
				type: "TV",
				status: status,
				genre: arrgen,
				rilis: rilis,
				rating: rating,
			}
			hasil.push(result)
			resolve(hasil[0])
		})
	})
}
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
const toNumss = (text) => {
	let position = text.search("episode-");
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
const toGet = (text) => {
	return text.replace(/ /g, '-').toLowerCase()
}
const toGets = (text) => {
	if(text == undefined || text.length === 0) return console.log(false)
	return text.replace(/\s+/g, '-').replace(/,/g, '').replace(/\//g, '').replace(/\./g, '').replace(/:/g, '').replace(/!/g, '').toLowerCase()
}
async function loopEps(url) {
	return new Promise((resolve, reject) => {
		axios.request(url, {
			method: "GET",
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-language": "en-US,en;q=0.9,id;q=0.8",
				"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
			}
		}).then(respon => {
			const $ = cheerio.load(respon.data)
			let hasil = []
			$('.box-body.episode_list').each(function (an, jg) {
				$(jg).find('table > tbody > tr > td').each(function (BIT, CH) {
					let link = $(CH).find('a').attr('href')
					let title = $(CH).find('a').text().trim()
					const result = {
						eps: toNum(title),
						link: link,
						title: title
					}
					hasil.push(result)
				})
			})
			resolve(hasil)
		}).catch((e) => {
			resolve(e)
		})
	})
}
async function animelist() {
	return new Promise((resolve, reject) => {
		axios.request('http://nanimex.com/index', {
			method: "GET",
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-language": "en-US,en;q=0.9,id;q=0.8",
				"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
			}
		}).then(respon => {
			const $ = cheerio.load(respon.data, { xml: true })
			let hasil = []
			$('.box.box-default').each(function (an, jg) {
				$(jg).find('.box-body > .col-md-6').each(function (BIT, CH) {
					let url = $(CH).find('a').attr('href')
					let title = $(CH).find('a').text().trim()
					const result = {
						title: toGets(title),
						url: 'http://nanimex.com' + url
					}
					hasil.push(result)
				})
			})
			//console.log(hasil)
			resolve(hasil)
		}).catch((e) => {
			resolve("eror")
		})
	})
}
async function upAnime(url) {
	return new Promise((resolve, reject) => {
		axios.request(url, {
			method: "GET",
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-language": "en-US,en;q=0.9,id;q=0.8",
				"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
			}
		}).then(respon => {
			const $ = cheerio.load(respon.data)
			let hasil = []
			$('#embed_holder').each(function (an, jg) {
				$(jg).find('#pembed > .responsive-embed-stream').each(function (BIT, CH) {//ngeleg bet
					let stream = $(CH).find('iframe').attr('src')
					const result = {
						stream: stream
					}
					hasil.push(result)
				})
			})
			resolve(hasil)
		}).catch((e) => {
			resolve(response.status)
		})
	})
}
module.exports.toNumss = toNumss
module.exports.toNum = toNum
module.exports.filterThumb = filterThumb
module.exports.ExcStream = ExcStream
module.exports.fetchText = fetchText
module.exports.filterStream = filterStream
module.exports.animelist = animelist
module.exports.getAnime = getAnime
module.exports.upEps = upEps
module.exports.loopEps = loopEps
module.exports.toGets = toGets
module.exports.isImage = isImage
