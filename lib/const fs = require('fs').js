const fs = require('fs')
const { default: Axios } = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const path = require("path");
const favicon = require('serve-favicon')
const moment = require('moment')
const qs = require('querystring')
const chalk = require("chalk")
const ws = require('ws')
const multer = require('multer')
const nodemailer = require('nodemailer');

// FUNCTION
const { checkNameUrl, getDBEps, addNewEps, addNewanime, checkNameUrls, checkThumb, objGenre, searchAnime, addView, addReport, removeReport } = require("../function/function")
const { reports } = require("../function/function")
const { data } = require("../function/function");
const res = require('express/lib/response');
const app = express()
const wsServer = new ws.Server({ noServer: true });

let mailTransporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: "strimwibunime@gmail.com",
		pass: "####@##(&$&&(dsajkadmin##$$#"
	}
})

class RestApi {
	constructor() {
		this.settingsPath = './src/settings.json'
		this.port = (JSON.parse(fs.readFileSync(this.settingsPath))).PORT
		this.newanime = JSON.parse(fs.readFileSync('./database/new.json'))
		this.allanime = JSON.parse(fs.readFileSync('./database/anime.json'))
		this.genre = JSON.parse(fs.readFileSync('./database/genre.json'))
		this.passwordAdmin = JSON.parse(fs.readFileSync('./src/password.json'))
		this.passwordPage = JSON.parse(fs.readFileSync('./src/passwordPage.json'))
		this.domain = "WibuNime"
		this.url = "https://wibunime.online"
	}

	start() {
		wsServer.on('connection', (socket, req) => {
			console.log('Connected', req.url)
		})
		app.use(express.json())
		app.use(express.urlencoded({
			extended: true
		}))
		app.use(express.static(__dirname + '/page'));
		// GENRE
		app.param('genre', function (req, res, next, genre) {
			const modified = genre
			req.genre = modified;
			next();
		});
		app.param('pageg', function (req, res, next, pageg) {
			const modified = pageg
			req.pageg = modified;
			next();
		});
		app.get('/genre/:genre/:pageg', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const getData = this.genreGet(this.allanime, req.genre)
			if (getData === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const getHtml = this.genreMove(getData, parseInt(req.pageg))
			if (isNaN(req.pageg)) {
				res.redirect(`/genre/${req.genre}`)
			}
			if (parseInt(req.pageg) > getHtml.page) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const getDataBar = this.getPageBarGenre(req.pageg, getHtml.page, req.genre)
			res.send(this.genreHtml(getHtml, getDataBar, req.genre.toUpperCase()))
		})
		app.get('/genre/:genre', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const getData = this.genreGet(this.allanime, req.genre)
			if (getData === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const getHtml = this.genreMove(getData)
			const getDataBar = this.getPageBarGenre(1, getHtml.page, req.genre)
			res.send(this.genreHtml(getHtml, getDataBar, "Genres"))
		})
		app.get('/genre/', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const genreALL = this.genreList(this.genre)
			res.send(this.genrePage(genreALL))
		})
		// ONGOING PAGE
		app.param('pageo', function (req, res, next, pageo) {
			const modified = pageo
			req.pageg = modified;
			next();
		});
		app.get('/ongoing/:pageo', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const getData = this.ongoingMove(this.allanime)
			if (getData === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const getHtml = this.genreMove(getData, parseInt(req.pageg))
			if (isNaN(req.pageg)) {
				res.redirect(`/genre/${req.genre}`)
			}
			if (parseInt(req.pageg) > getHtml.page) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const getDataBar = this.getPageBarOngoing(req.pageg, getHtml.page)
			res.send(this.genreHtml(getHtml, getDataBar, "Anime OnGoing"))
		})
		app.get('/ongoing/', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const getData = this.ongoingMove(this.allanime)
			if (getData === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const getHtml = this.genreMove(getData)
			const getDataBar = this.getPageBarOngoing(1, getHtml.page)
			res.send(this.genreHtml(getHtml, getDataBar, "Anime OnGoing"))
		})
		// REPORT
		app.get('/report', async (req, res) => {
			res.send(this.reportPage())
		})
		app.post('/report', async (req, res) => {
			const { issue, name, email, detail } = req.body
			if (issue === undefined || name === undefined || email === undefined || detail === undefined) {
				return this.backToHome(res, req, this.createMess('error', 'Error', 'Masukan Data'))
			} else if (issue.length < 1 || name.length < 1 || email.length < 1 || detail.length < 1) {
				return this.backToHome(res, req, this.createMess('error', 'Error!', 'Masukan Data'))
			} else {				
				repo(issue, name, email, detail)
				this.backToHome(res, req, this.createMess('success', 'Report Success', 'Berhasil mengirim laporan'))
			}
		})
		// SEARCH
		app.param('pages', function (req, res, next, pages) {
			const modified = pages
			req.pages = modified;
			next();
		});
		app.post('/search', async (req, res) => {
			const { s } = req.body
			var query = s
			if (query < 1) {
				res.sendFile(path.join(__dirname, 'page/404.html'))
			} else if (query == undefined) {
				res.sendFile(path.join(__dirname, 'page/404.html'))
			} else {
				const q = query.toLowerCase()
				const filterSearch = searchAnime(this.allanime, q)
				if (filterSearch === undefined) return res.sendFile(path.join(__dirname, 'page/404.html'))
				if (filterSearch.length < 1) return res.send({ status: 400, message: "anime tidak ditemukan." })
				const getHtml = this.genreMove(filterSearch)
				const getDataBar = this.getPageBarGenre(1, getHtml.page, q)
				res.send(this.genreHtml(getHtml, getDataBar, `Search Result Of "${q}"`))
			}
		})
		// SEARCH
		app.param('pages', function (req, res, next, pages) {
			const modified = pages
			req.pages = modified;
			next();
		});
		app.post('/search', async (req, res) => {
			const { s } = req.body
			var query = s
			if (query.length < 1) {
				res.sendFile(path.join(__dirname, 'page/404.html'))
			} else if (query == undefined) {
				res.sendFile(path.join(__dirname, 'page/404.html'))
			} else {
				const q = query.toLowerCase()
				const filterSearch = searchAnime(this.allanime, q)
				if (filterSearch === undefined) return res.sendFile(path.join(__dirname, 'page/404.html'))
				if (filterSearch.length < 1) return res.send({ status: 400, message: "anime tidak ditemukan." })
				const getHtml = this.genreMove(filterSearch)
				const getDataBar = this.getPageBarGenre(1, getHtml.page, q)
				res.send(this.genreHtml(getHtml, getDataBar, `Search Result Of "${q}"`))
			}
		})
		app.get('/search/:pages', async (req, res) => {
			const query = req.query.query
			if (query < 1) {
				res.sendFile(path.join(__dirname, 'page/404.html'))
			} else if (query == undefined) {
				res.sendFile(path.join(__dirname, 'page/404.html'))
			} else {
				const q = query.toLowerCase()
				const filterSearch = searchAnime(this.allanime, q)
				if (filterSearch === undefined) return res.sendFile(path.join(__dirname, 'page/404.html'))
				if (filterSearch.length < 1) return res.sendFile(path.join(__dirname, 'page/404.html'))
				const getHtml = this.genreMove(filterSearch)
				if (parseInt(req.pages) > getHtml.page) return res.sendFile(path.join(__dirname, 'page/404.html'))
				const getDataBar = this.getPageBarGenre(parseInt(req.pages), getHtml.page, q)
				res.send(this.genreHtml(getHtml, getDataBar, `Search Result Of "${q}"`))
			}
		})
		// SEARCH LIVE
		app.get('/searchanime', async (req, res) => {
			const query = req.query.query
			if (query < 1) {
				res.send({ status: 400, message: "minimal query nya adalah 1" })
			} else if (query == undefined) {
				res.send({ status: 400, message: "masukan parameter query" })
			} else {
				const q = query.toLowerCase()
				const filterSearch = searchAnime(this.allanime, query)
				if (filterSearch === undefined) return res.send({ status: 400, message: "anime tidak ditemukan" })
				let result = []
				if (filterSearch.length < 1) return res.send({ status: 400, message: "anime tidak ditemukan" })
				for (let i = 0; i < filterSearch.length; i++) {
					var genre = ''
					for (let i = 0; i < filterSearch[i].genre.length; i++) {
						genre += `${filterSearch[i].genre[i]} `
					}
					var obj = { name: filterSearch[i].nama, sinop: filterSearch[i].sinop, genre: genre, url: `/anime/${filterSearch[i].nameurl}`, thumb: filterSearch[i].thumb }
					result.push(obj)
				}
				res.send({ status: 200, query: q, result })
			}
		})
		// ANIME-LIST
		app.get('/anime-list/', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const FilterAZ = this.getAZ(this.allanime, "TV")
			const htmlAZ = this.GetHtmlList(FilterAZ)
			res.send(this.animeList(htmlAZ))
		})
		// MOVIE-LIST
		app.get('/movie-list/', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const FilterAZ = this.getAZ(this.allanime, "MOVIE")
			const htmlAZ = this.GetHtmlList(FilterAZ)
			res.send(this.animeList(htmlAZ))
		})
		// PAGE PERPAGE
		app.param('page', function (req, res, next, page) {
			const modified = page
			req.page = modified;
			next();
		});
		app.get('/page/:page', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			this.addLogs(ip, `page ${req.page}`)
			const animenew = this.NewrilisPage(this.newanime, req.page)
			const movienew = this.moviePage(this.newanime)
			if (animenew === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const allanime = this.topviewAnime(this.allanime)
			const getBar = this.getPageBar(req.page, animenew.page)
			if (isNaN(req.page)) {
				res.redirect(`/page/1`)
			}
			res.send(this.htmlPage(animenew, allanime, getBar, movienew))
		})
		app.get('/page', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			this.addLogs(ip, `page 1`)
			const animenew = this.NewrilisPage(this.newanime, req.page)
			const movienew = this.moviePage(this.newanime)
			if (animenew === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const allanime = this.topviewAnime(this.allanime)
			const getBar = this.getPageBar(1, animenew.page)
			res.redirect(`/page/1`)
			res.send(this.htmlPage(animenew, allanime, getBar, movienew))
		})
		// DETAIL && WATCH ANIME
		app.param('anime', function (req, res, next, anime) {
			const modified = anime.toLowerCase()
			req.anime = modified;
			next();
		});
		app.param('eps', function (req, res, next, eps) {
			const modifiedd = eps
			req.eps = modifiedd;
			next();
		});
		app.get('/kntl', async (req, res) => {
			return res.redirect(`/`)
		})
		app.get('/admin', async (req, res) => {
			var action = req.query.action
			var acnum = req.query.acnum
			var passwd = req.query.pass
			if (action === undefined || acnum === undefined || passwd === undefined) return res.sendFile(path.join(__dirname, 'page/404.html'))
			if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
			if (action === 'add') {
				if (parseInt(acnum) === 1) {
					var on_going = this.onGoingFilter(this.allanime)
					var db = this.allanime
					res.send(this.adminPage(this.admin(db, on_going, parseInt(acnum), action)))
				} else if (parseInt(acnum) === 2) {
					var animek = req.query.anime
					if (animek === undefined) return res.send({ status: 404, message: "masukan parameter animek" })
					if (!checkNameUrls(anime)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
					var dbanimek = checkNameUrls(animek)
					var on_going = this.onGoingFilter(this.allanime)
					var db = this.allanime
					res.send(this.adminPage(this.admin(db, on_going, parseInt(acnum), action, dbanimek)))
				}
			} else if (action === 'edit') {
				if (parseInt(acnum) === 1) {
					var on_going = this.onGoingFilter(this.allanime)
					var db = this.allanime
					res.send(this.adminPage(this.admin(db, on_going, parseInt(acnum), action)))
				} else if (parseInt(acnum) === 2) {
					var animek = req.query.anime
					if (animek === undefined) return res.send({ status: 404, message: "masukan parameter animek" })
					if (!checkNameUrls(anime)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
					var dbanimek = checkNameUrls(animek)
					var on_going = this.onGoingFilter(this.allanime)
					var db = this.allanime
					res.send(this.adminPage(this.admin(db, on_going, parseInt(acnum), action, dbanimek)))
				}
			} else if (action === 'delete') {
				if (parseInt(acnum) === 1) {
					var on_going = this.onGoingFilter(this.allanime)
					var db = this.allanime
					res.send(this.adminPage(this.admin(db, on_going, parseInt(acnum), action)))
				} else if (parseInt(acnum) === 2) {
					var db = this.allanime
					res.send(this.adminPage(this.admin(db, '', parseInt(acnum), action, '')))
				}
			}
		})
		app.post('/admin', async (req, res) => {
			var act = req.query.action
			var acnum = req.query.acnum
			var passwd = req.query.pass
			if (act === 'add') {
				if (act === undefined || acnum === undefined || passwd === undefined) return res.send({ status: 404, message: `masukan parameter ${act === undefined ? 'action' : acnum === undefined ? 'acnum' : typemov === undefined ? 'typemov' : passwd === undefined ? 'pass' : ''}` })
				if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
					return this.backToHome(res, req, this.createMess('error', 'Error', `Hanya ada 2 Action Number, 1 = anime dan 2 = episode`))
				} else if (parseInt(acnum) === 1) {
					var { anime, sinop, thumb, nameurl, genre, typeanime, date, studio, password } = req.body
					if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
					if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
					if (typeanime != "movie" && typeanime != "tv") return this.backToHome(res, req, this.createMess('error', 'Anime Type Salah!', 'Anime Type hanya ada 2, movie dan tv'))
					if (checkNameUrls(nameurl)) return this.backToHome(res, req, this.createMess('error', 'Error', 'NameUrl Anime sudah ada!'))
					data.addNewanime(anime, sinop, thumb, nameurl, objGenre(genre), date, typeanime, studio)
					this.backToHome(res, req, this.createMess('success', 'Success', `Berhasil menambahkan Anime ${anime}.`))
				} else if (parseInt(acnum) === 2) {
					if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
					if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
					if (!checkNameUrls(anime)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
					if (typeanime != "movie" && typeanime != "tv") return this.backToHome(res, req, this.createMess('error', 'Anime Type Salah!', 'Anime Type hanya ada 2, movie dan tv'))
					data.addNewEps(namaurl, anime, typeanime, download, host, stream, eps, Date.now())
					this.backToHome(res, req, this.createMess('success', 'Success', `Berhasil menambahkan episode ${eps} di anime ${anime}.`))
				} else {
					return this.backToHome(res, req, this.createMess('error', 'Error', `Hanya ada 2 Action Number, 1 = anime dan 2 = episode`))
				}
			} else if (act === 'edit') {
				if (act === undefined || parseInt(acnum) === undefined || typemov === undefined || passwd === undefined) return res.send({ status: 404, message: `masukan parameter ${act === undefined ? 'action' : acnum === undefined ? 'acnum' : typemov === undefined ? 'typemov' : passwd === undefined ? 'pass' : ''}` })
				if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
					return this.backToHome(res, req, this.createMess('error', 'Error', `Hanya ada 2 Action Number, 1 = anime dan 2 = episode`))
				} else if (parseInt(acnum) === 1) {
					var { nameurl, typedata, newdata, password } = req.body
					if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
					if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
					if (!checkNameUrls(nameurl)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
					if (nameurl === undefined || typedata === undefined || newdata === undefined) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Masukan Data Barunya'))
					data.editAnime(nameurl, typedata, newdata)
					this.backToHome(res, req, this.createMess('success', 'Success', `Berhasil mengedit anime ${anime}.`))
				} else if (parseInt(acnum) === 2) {
					var { nameurl, typdata, eps, newdata, password } = req.body
					if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
					if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
					if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
					if (!checkNameUrls(anime)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
					if (nameurl === undefined || typedata === undefined || eps === undefined || newdata === undefined) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', `Masukin Data Baru`))
					data.editEps(nameurl, parseInt(eps), typedata, newdata)
					this.backToHome(res, req, this.createMess('success', 'Success', `Berhasil mengedit anime ${anime} episode ${eps}`))
				} else {
					this.backToHome(res, req, this.createMess('error', 'Anime Type Salah!', 'Anime Type hanya ada 2, movie dan tv'))
				}
			} else if (act.toLowerCase() === 'delete') {
				if (act === undefined || acnum === undefined || passwd === undefined) return res.send({ status: 404, message: `masukan parameter ${act === undefined ? 'action' : acnum === undefined ? 'acnum' : passwd === undefined ? 'pass' : ''}` })
				var { anime, password } = req.body
				if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
					return this.backToHome(res, req, this.createMess('error', 'Error', `Hanya ada 2 Action Number, 1 = anime dan 2 = episode`))
				} else {
					if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
						if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password yang kamu masukan salah!'))
					} else if (parseInt(acnum) === 1) {
						//ANIME						
						if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
						if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
						if (!checkNameUrls(anime)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
						data.deleteAnime(anime)
						this.backToHome(res, req, this.createMess('success', 'Success', `Berhasil menghapus anime ${anime}.`))
					} else if (parseInt(acnum) === 2) {
						//EPS
						var { eps } = req.body
						if (!this.passwordPage.includes(passwd)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Url) yang kamu masukan salah!'))
						if (!this.passwordAdmin.includes(password)) return this.backToHome(res, req, this.createMess('error', 'Access Denied!', 'Password (Page) yang kamu masukan salah!'))
						if (!checkNameUrls(anime)) return this.backToHome(res, req, this.createMess('error', 'Error', 'Anime Tidak ditemukan!'))
						if (!getDBEps(eps)) return this.backToHome(res, req, this.createMess('error', 'Error', `Episode ${eps} di Anime ${anime} Tidak ditemukan!`))
						data.deleteEps(anime, parseInt(eps))
						this.backToHome(res, req, this.createMess('success', 'Success', `Berhasil menghapus episode ${eps} di anime ${anime}.`))
					} else {
						this.backToHome(res, req, this.createMess('error', 'Anime Type Salah!', 'Anime Type hanya ada 2, movie dan tv'))
					}
				}
			} else {
				this.backToHome(res, req, this.createMess('error', 'Error!', 'Action hanya ada 3, add, edit, dan delete'))
			}
		})
		app.get('/anime/:anime', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const checkName = await checkNameUrl(req.anime.toLowerCase())
			const filterView = this.filterALLview(checkName)
			if (checkName === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			addView(checkName.nameurl, undefined, ip)
			res.send(this.detailPage(checkName, this.loopingEps(checkName), this.loopingGenre(checkName), filterView))
		})
		app.get('/anime/:anime/:eps', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			const checkName = await checkNameUrl(req.anime.toLowerCase())
			const filterEps = isNaN(req.eps) ? 1 : req.eps
			if (isNaN(req.eps) || filterEps > checkName.eps.length) {
				const checkName = await checkNameUrl(req.anime)
				return res.redirect(`/anime/${req.anime}`)
			} else {
				if (checkName === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
				addView(checkName.nameurl, parseInt(req.eps), ip)
				const LoopEps = this.loopingEpsWatch(checkName)
				const LoopDown = await this.loopingDownload(checkName, parseInt(req.eps))
				const animdb = await getDBEps(req.anime, parseInt(req.eps))
				const watchdata = this.WatchAnime(animdb.stream, checkName, req.eps, LoopEps, LoopDown, this.loopingGenre(checkName))
				//console.log(watchdata)
				res.send(this.watchPage(watchdata))
			}
		});
		// DASHBOARD && INDEX
		app.get('/dashboard', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			this.addLogs(ip, "dashboard")
			const animenew = this.NewrilisPage(this.newanime, 1)
			const movienew = this.moviePage(this.newanime)
			if (animenew === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const allanime = this.topviewAnime(this.allanime)
			const getBar = this.getPageBar(1, animenew.page)
			res.send(this.htmlPage(animenew, allanime, getBar, movienew))
		})
		app.get('/', async (req, res) => {
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
			ip = ip.replace(/\:|f|\:\:1/g, '')
			this.addLogs(ip, "dashboard")
			const animenew = this.NewrilisPage(this.newanime, 1)
			const movienew = this.moviePage(this.newanime)
			if (animenew === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
			const allanime = this.topviewAnime(this.allanime)
			const getBar = this.getPageBar(1, animenew.page)
			res.send(this.htmlPage(animenew, allanime, getBar, movienew))
		})

		// app.get('*', function(req,res){
		// 	res.status(404).sendFile(path.join(__dirname, 'page/404.html'));
		// });
		app.use(function (req, res, next) {
			res.status(404);
			res.sendFile(path.join(__dirname, 'page/404.html'))
		});


		// Listening to start server
		const server = app.listen(this.port, () => console.log(`Started at port ${this.port}`))
		server.on('upgrade', (request, socket, head) => {
			wsServer.handleUpgrade(request, socket, head, socket => {
				wsServer.emit('connection', socket, request);
			});
		});
	}

	//TEST PAGE
	// gw benerin genre page dlu
	testPage = () => `<html>
<head>
	<link href="//cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css" rel="stylesheet">
<script src="//cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js"></script>
	<script>
function sumitdek(){
Swal.fire({
   title: 'Do you want to save the changes?',
   showDenyButton: true,
   showCancelButton: true,
   confirmButtonText: 'Save',
   denyButtonText: 'Dont save',
}).then((result) => {
   /* Read more about isConfirmed, isDenied below */
   if (result.isConfirmed) {
      Swal.fire('Saved!', '', 'success')
	  document.getElementById("anj").submit();
   } else if (result.isDenied) {
      Swal.fire('Changes are not saved', '', 'info')
	  //document.getElementById("anj").submit();
   }
});
}
</script>
</head>
<body>
<form id="anj" method="POST" action="/kntl">
<div>
<input type="text" name="dek"/>
</div>
<button id="btn_ajh" oneclick="sumitdek">submit</button>
</form>
</body>
</html>`
	//PAGE
	detailPage = (checkName, alleps, allgenre, view) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head profile="http://gmpg.org/xfn/11">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>${checkName.nama}</title>
<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700,300' rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/wp-content/themes/wibunime/style.css" type="text/css" media="screen" />

<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
<link rel="icon" href="/wp-content/uploads/2016/12/01.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="/wp-content/themes/wibunime/js/jquery.qtip.css" />
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/imagesloaded.pkg.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/light.js"></script>
<!-- matiin load

-->
<script type='text/javascript'>
//<![CDATA[
$(document).ready(function(){
   $("#shadow").css("height", $(document).height()).hide();
   $(".lightSwitcher").click(function(){
      $("#shadow").toggle();
         if ($("#shadow").is(":hidden"))
            $(this).html("Lights Off").removeClass("turnedOff");
         else
            $(this).html("Lights On").addClass("turnedOff");
         });
            
  });
//]]>
</script>
<script type="text/javascript">
	function hidediv(id) {
		document.getElementById(id).style.display = 'none';
	}
</script>

	<!-- This site is optimized with the Yoast SEO plugin v17.5 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="description" content="${checkName.nameurl} Subtitle Indonesia, Nonton Download ${checkName.nameurl} Subtitle Indonesia, Streaming Online Anime Subtitle Indonesia - ${this.domain}" />
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	<link rel="canonical" href="${this.url}/anime/${checkName.nameurl}" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content="${checkName.nama} Subtitle Indonesia - ${this.domain}" />
	<meta property="og:description" content="${checkName.nameurl} Subtitle Indonesia, Nonton Download ${checkName.nameurl} Subtitle Indonesia, Streaming Online Anime Subtitle Indonesia - ${this.domain}" />
	<meta property="og:url" content="https://${this.domain}/anime/${checkName.nama}" />
	<meta property="og:site_name" content="${this.domain}" />
	<meta property="article:modified_time" content="2018-10-28T12:28:59+00:00" />
	<meta property="og:image" content="/wp-content/uploads/2016/03/73245.jpg" />
	<meta property="og:image:width" content="193" />
	<meta property="og:image:height" content="300" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:label1" content="Est. reading time" />
	<meta name="twitter:data1" content="2 minutes" />
	<!-- / Yoast SEO plugin. -->


<link rel='dns-prefetch' href='//s.w.org' />
		<script type="text/javascript">
			window._wpemojiSettings = {"baseUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/72x72\/","ext":".png","svgUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/svg\/","svgExt":".svg","source":{"concatemoji":"\/wp-includes\/js\/wp-emoji-release.min.js"}};
			/*! This file is auto-generated */
			!function(e,a,t){var n,r,o,i=a.createElement("canvas"),p=i.getContext&&i.getContext("2d");function s(e,t){var a=String.fromCharCode;p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,e),0,0);e=i.toDataURL();return p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,t),0,0),e===i.toDataURL()}function c(e){var t=a.createElement("script");t.src=e,t.defer=t.type="text/javascript",a.getElementsByTagName("head")[0].appendChild(t)}for(o=Array("flag","emoji"),t.supports={everything:!0,everythingExceptFlag:!0},r=0;r<o.length;r++)t.supports[o[r]]=function(e){if(!p||!p.fillText)return!1;switch(p.textBaseline="top",p.font="600 32px Arial",e){case"flag":return s([127987,65039,8205,9895,65039],[127987,65039,8203,9895,65039])?!1:!s([55356,56826,55356,56819],[55356,56826,8203,55356,56819])&&!s([55356,57332,56128,56423,56128,56418,56128,56421,56128,56430,56128,56423,56128,56447],[55356,57332,8203,56128,56423,8203,56128,56418,8203,56128,56421,8203,56128,56430,8203,56128,56423,8203,56128,56447]);case"emoji":return!s([55357,56424,55356,57342,8205,55358,56605,8205,55357,56424,55356,57340],[55357,56424,55356,57342,8203,55358,56605,8203,55357,56424,55356,57340])}return!1}(o[r]),t.supports.everything=t.supports.everything&&t.supports[o[r]],"flag"!==o[r]&&(t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&t.supports[o[r]]);t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&!t.supports.flag,t.DOMReady=!1,t.readyCallback=function(){t.DOMReady=!0},t.supports.everything||(n=function(){t.readyCallback()},a.addEventListener?(a.addEventListener("DOMContentLoaded",n,!1),e.addEventListener("load",n,!1)):(e.attachEvent("onload",n),a.attachEvent("onreadystatechange",function(){"complete"===a.readyState&&t.readyCallback()})),(n=t.source||{}).concatemoji?c(n.concatemoji):n.wpemoji&&n.twemoji&&(c(n.twemoji),c(n.wpemoji)))}(window,document,window._wpemojiSettings);
		</script>
		<style type="text/css">
img.wp-smiley,
img.emoji {
	display: inline !important;
	border: none !important;
	box-shadow: none !important;
	height: 1em !important;
	width: 1em !important;
	margin: 0 .07em !important;
	vertical-align: -0.1em !important;
	background: none !important;
	padding: 0 !important;
}
</style>
	<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='wprc-style-css'  href='/wp-content/plugins/report-content/static/css/styles.css' type='text/css' media='all' />
<link rel='stylesheet' id='dashicons-css'  href='/wp-includes/css/dashicons.min.css' type='text/css' media='all' />
<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js'></script>
<script type='text/javascript' src='/wp-content/plugins/report-content/static/js/scripts.js'></script>
<meta name="generator" content="WordPress 5.4.8" />
		<style>body {
    background: url(/wp-content/uploads/2018/08/warna.png) no-repeat fixed #0a0a0a;
    background-size: 105%;
    background-position:top center;
    color:#d6d6d6;
}
#sct_banner_top img, #sct_banner img {max-width: 728px;height: 90px;}
#sct_logo img {max-width: 220px;height: auto;}
#myElement {width: 100%;height: 100%;position: absolute !important;margin: 0 !important;top: 0;left: 0;}
.jw-preview, .jw-captions, .jw-title, .jw-overlays, .jw-controls {z-index: 105;}
.videoads iframe {position: relative !important;}
.report{position:relative;float:right;margin-right:5px}
.wprc-container{margin:6px 0 0!important}
button.wprc-switch{padding: 4px 7px; background:#003a59!important;min-width:auto!important;color:#cfcfcf!important;border:1px solid #003a59!important}
.wprc-container .wprc-content{background:#1b1b1b!important;border-top:4px solid #3c3b36!important;box-shadow:0 0 5px #000!important}
@media only screen and ( max-width: 750px ) {
.report{position:relative;float:none;margin-right:0;height:25px}
.wprc-container{margin:6px 0 0!important;width:100%!important}
button.wprc-switch{width:100%!important}
}
#sct_page{background-color:rgba(0,0,0,0.8);padding:15px;border:1px solid #323232;margin:0 0 10px;overflow:hidden;border-radius: 10px;}</style>
<style>
.ctn_side ul {padding-left: 15px;line-height: 18px;}
</style>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-77285272-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-77285272-1');
</script>

<!--  ad tags Size: 320x50 ZoneId:1127811 -->
<!--  -->

<!--  -->



<style>
span.jwcontrols {
    z-index: 105 !important;
}
</style>

</head>

<body data-rsssl=1>
<div id='shadow'></div>
	
<div id="sct_top"><div class="wrap"> <span id="sct_welcome" class="fl">Selamat datang di ${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</span> <span id="sct_recommended" class="fr"><div class="textwidget"><span style="color: #0077b6"><strong>Browse:</strong></span>&nbsp;<strong> <a href="/anime-list/#%23">#</a> <a href="/anime-list/#A">A</a> <a href="/anime-list/#B">B</a> <a href="/anime-list/#C">C</a> <a href="/anime-list/#D">D</a> <a href="/anime-list/#E">E</a> <a href="/anime-list/#F">F</a> <a href="/anime-list/#G">G</a> <a href="/anime-list/#H">H</a> <a href="/anime-list/#I">I</a> <a href="/anime-list/#J">J</a> <a href="/anime-list/#K">K</a> <a href="/anime-list/#L">L</a> <a href="/anime-list/#M">M</a> <a href="/anime-list/#N">N</a> <a href="/anime-list/#O">O</a> <a href="/anime-list/#P">P</a> <a href="/anime-list/#Q">Q</a> <a href="/anime-list/#R">R</a> <a href="/anime-list/#S">S</a> <a href="/anime-list/#T">T</a> <a href="/anime-list/#U">U</a> <a href="/anime-list/#V">V</a> <a href="/anime-list/#W">W</a> <a href="/anime-list/#X">X</a> <a href="/anime-list/#Y">Y</a> <a href="/anime-list/#Z">Z</a></strong></div> </span></div></div>
<div id="sct_head">
<div class="wrap">
<a href="/" id="sct_logo" class="fl"><img src="/wp-content/themes/wibunime/img/logo.png" alt="Logo" title="${this.domain}"></a>
<div id="sct_banner_top" class="fr"><a href="https://cutt.ly/animepastijp" target="_blank" rel="nofollow"><img class="alignnone size-full wp-image-141557" src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="" width="728" height="90" /></a> </div></div>
</div>
<div id="sct_menu_area">
<div class="wrap">
<div class="mainx">
<div id="sct_menu">
<ul id="deskmenu" class="menu"><li id="menu-item-16" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li id="menu-item-15" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-18" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
<div class="search-block">
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
</div>
</div>
</div>
</div>

<div id="ninemobile">
<div class="mainx">
<!-- ads lie -->
<a href="https://cutt.ly/animepastijp" target="_blank" rel="nofollow"><img src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="${this.domain}" title="${this.domain}" width="100%"/></a>
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
<label for="show-menu" class="show-menu"><span class="dashicons dashicons-menu"></span></label>
<input type="checkbox" id="show-menu" role="button">
<ul id="mobmenu" class="menu"><li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
</div>

<div class="wrap mobilewrap">
<!-- iklan nya lie atas -->
	
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<div class="global_info">
<span>News</span>
Sedang Proses Re-upload Anime-Anime lama... Jika tidak bisa di Streaming... Harap Bersabar... Ini ujian...</div>
<div id="sct_page">


<div id="sct_content" class="fl">
<h1 style="border-bottom: 0;">Nonton ${checkName.nama} Subtitle Indonesia</h1>
<div class="nodeinfo">
 <img width="193" height="300" src=${checkName.thumb} class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="" /> <h2>Sinopsis ${checkName.nama}</h2>
 <div class="wprc-container yellow">
	<button type="button" onclick="window.location.href='/report'" class="wprc-switch">Report Content</button>
</div>
	<p>${checkName.sinop}<br />
<div class='clear'></div>
<div class="anm_ifo">
<ul>
<li><b>Type</b>: ${checkName.type}</li>
<li><b>Episodes</b>: ${checkName.eps.length}</li>
<li><b>Studio</b>: ${checkName.studio}</li>
<li><b>Genre</b>: ${allgenre}</li>
<li><b>Status</b>: ${checkName.status === false ? "On Going" : "Complite"}</li>
<li><b>Rilis</b>: ${checkName.time}</li>
<li><b>View</b>: ${view}</li>
</ul>
</div>
<div style="max-height:32px;overflow:auto;clear:both;font-size:10px;font-family:Arial;width:auto;line-height:16px;border-top:2px solid #171717;border-bottom:2px solid #171717;padding:5px 5px;">
</div>
<br/>
<h2>${checkName.nama} Episodes List</h2>
<ul class="eps_lst">
<li class="hdr"><span class="c1">Episode #</span> <span class="c2">Episode Title</span> <span class="c3">Date Added</span> <span class="c4" style="background: #181818 !important;">Watch</span></li>
${alleps}
</ul>

<div id="disqus_thread"></div>
</div>
</div>

<div id="sct_sidebar" class="fr">
	<div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div> 
		</div><div class="ctn_side">			<div class="textwidget"></div>
		</div><div class="ctn_side">			<div class="textwidget"><iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FAnimeIndoStream%2F&tabs&width=300&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId=1540873672891974" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
</div>
		</div><div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div>
</div></div>

</div>

<div id="footer">
<div class="wrap">
<div class="ftr_wgt">
<div class="anm_wdt">
<h3>${this.domain}</h3>			<div class="textwidget"><p><strong>${this.domain}</strong> adalah website yang menyediakan konten streaming video anime subtittle indonesia dengan koleksi 1000+ judul dari berbagai genre dan tersedia fitur yang mempermudah dalam pencarian anime sesuai keinginan anda. <a href="/anime-list">Anime list</a>, <a href="${this.url}/popular-series">Populer anime</a>, <a href="/genre">Genre</a>.</p>
</div>
		</div>
<div class="anm_wdt">
<h3>Navigasi</h3><div class="menu-footer-menu-container"><ul id="menu-footer-menu" class="menu"><li id="menu-item-616" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-616"><a href="/">Home</a></li>
<li id="menu-item-39" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-39"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-40" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-40"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-41" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41"><a href="/ongoing">Anime Ongoing</a></li>
</ul></div></div>
</div>
<div class="credit">
<b>${this.domain}</b> - <b>Nonton Streaming Download Anime Subtitle Indonesia</b> Copyright © 2016 - Powered by <b><a href="" target="_blank">WordPress</a></b> & <b><a href="http://enduser.id/" target="_blank" rel="nofollow">Enduser</a></b> - <b><a href="http://hentaiplus.co/" target="_blank">Streaming Hentai</a></b><br><span>Copyrights and trademarks for the anime, and other promotional materials are held by their respective owners and their use is allowed under the fair use clause of the Copyright Law.</span>
	
</div>
</div>
</div>
<script data-cfasync="false" async type="text/javascript" src="//kiltyyoginis.com/rl3g5o25RWa1PGntH/44701"></script>
</body>
<script type='text/javascript' src='/wp-includes/js/wp-embed.min.js'></script>
<script type='text/javascript' src='/wp-content/themes/wibunime/js/search.js'></script>
</html>
<!-- Dynamic page generated in 0.696 seconds. -->
<!-- Cached page generated by WP-Super-Cache on 2021-12-09 16:10:37 -->

<!-- Compression = gzip -->`

	genrePage = (allgenre) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head profile="http://gmpg.org/xfn/11">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>Genres - ${this.domain}</title>
<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700,300' rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/wp-content/themes/wibunime/style.css" type="text/css" media="screen" />

<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
<link rel="icon" href="/wp-content/uploads/2016/12/01.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="/wp-content/themes/wibunime/js/jquery.qtip.css" />
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/imagesloaded.pkg.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/light.js"></script>
<!-- matiin load

-->
<script type='text/javascript'>
//<![CDATA[
$(document).ready(function(){
   $("#shadow").css("height", $(document).height()).hide();
   $(".lightSwitcher").click(function(){
      $("#shadow").toggle();
         if ($("#shadow").is(":hidden"))
            $(this).html("Lights Off").removeClass("turnedOff");
         else
            $(this).html("Lights On").addClass("turnedOff");
         });
            
  });
//]]>
</script>
<script type="text/javascript">
	function hidediv(id) {
		document.getElementById(id).style.display = 'none';
	}
</script>

	<!-- This site is optimized with the Yoast SEO plugin v17.5 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	<link rel="canonical" href="/genre" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content="Genres - ${this.domain}" />
	<meta property="og:description" content="Report Content Issue: * Copyright Infringement Spam Invalid Contents Broken Links Your Name: * Your Email: * Details: * Submit Report" />
	<meta property="og:url" content="${this.url}/genres" />
	<meta property="og:site_name" content="${this.domain}" />
	<meta name="twitter:card" content="summary_large_image" />
	<!-- / Yoast SEO plugin. -->


<link rel='dns-prefetch' href='//s.w.org' />
		<script type="text/javascript">
			window._wpemojiSettings = {"baseUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/72x72\/","ext":".png","svgUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/svg\/","svgExt":".svg","source":{"concatemoji":"\/wp-includes\/js\/wp-emoji-release.min.js"}};
			/*! This file is auto-generated */
			!function(e,a,t){var n,r,o,i=a.createElement("canvas"),p=i.getContext&&i.getContext("2d");function s(e,t){var a=String.fromCharCode;p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,e),0,0);e=i.toDataURL();return p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,t),0,0),e===i.toDataURL()}function c(e){var t=a.createElement("script");t.src=e,t.defer=t.type="text/javascript",a.getElementsByTagName("head")[0].appendChild(t)}for(o=Array("flag","emoji"),t.supports={everything:!0,everythingExceptFlag:!0},r=0;r<o.length;r++)t.supports[o[r]]=function(e){if(!p||!p.fillText)return!1;switch(p.textBaseline="top",p.font="600 32px Arial",e){case"flag":return s([127987,65039,8205,9895,65039],[127987,65039,8203,9895,65039])?!1:!s([55356,56826,55356,56819],[55356,56826,8203,55356,56819])&&!s([55356,57332,56128,56423,56128,56418,56128,56421,56128,56430,56128,56423,56128,56447],[55356,57332,8203,56128,56423,8203,56128,56418,8203,56128,56421,8203,56128,56430,8203,56128,56423,8203,56128,56447]);case"emoji":return!s([55357,56424,55356,57342,8205,55358,56605,8205,55357,56424,55356,57340],[55357,56424,55356,57342,8203,55358,56605,8203,55357,56424,55356,57340])}return!1}(o[r]),t.supports.everything=t.supports.everything&&t.supports[o[r]],"flag"!==o[r]&&(t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&t.supports[o[r]]);t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&!t.supports.flag,t.DOMReady=!1,t.readyCallback=function(){t.DOMReady=!0},t.supports.everything||(n=function(){t.readyCallback()},a.addEventListener?(a.addEventListener("DOMContentLoaded",n,!1),e.addEventListener("load",n,!1)):(e.attachEvent("onload",n),a.attachEvent("onreadystatechange",function(){"complete"===a.readyState&&t.readyCallback()})),(n=t.source||{}).concatemoji?c(n.concatemoji):n.wpemoji&&n.twemoji&&(c(n.twemoji),c(n.wpemoji)))}(window,document,window._wpemojiSettings);
		</script>
		<style type="text/css">
img.wp-smiley,
img.emoji {
	display: inline !important;
	border: none !important;
	box-shadow: none !important;
	height: 1em !important;
	width: 1em !important;
	margin: 0 .07em !important;
	vertical-align: -0.1em !important;
	background: none !important;
	padding: 0 !important;
}
</style>
	<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='wprc-style-css'  href='/wp-content/plugins/report-content/static/css/styles.css' type='text/css' media='all' />
<link rel='stylesheet' id='dashicons-css'  href='/wp-includes/css/dashicons.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='popup-maker-site-css'  href='/wp-content/plugins/popup-maker/assets/css/pum-site.min.css' type='text/css' media='all' />
<style id='popup-maker-site-inline-css' type='text/css'>
/* Popup Google Fonts */
@import url('//fonts.googleapis.com/css?family=Montserrat:100');

/* Popup Theme 141978: Default Theme */
.pum-theme-141978, .pum-theme-default-theme { background-color: rgba( 10, 10, 10, 0.00 ) } 
.pum-theme-141978 .pum-container, .pum-theme-default-theme .pum-container { padding: 1px; border-radius: 4px; border: 1px none #000000; box-shadow: 0px 0px 2px 0px rgba( 2, 2, 2, 0.00 ); background-color: rgba( 10, 10, 10, 1.00 ) } 
.pum-theme-141978 .pum-title, .pum-theme-default-theme .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141978 .pum-content, .pum-theme-default-theme .pum-content { color: #8c8c8c; font-family: inherit; font-weight: 400 } 
.pum-theme-141978 .pum-content + .pum-close, .pum-theme-default-theme .pum-content + .pum-close { position: absolute; height: 34px; width: 69px; left: auto; right: 0px; bottom: auto; top: 0px; padding: 0px; color: #ffffff; font-family: inherit; font-weight: 400; font-size: 12px; line-height: 36px; border: 1px none #ffffff; border-radius: 0px; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 10, 0, 130, 1.00 ) } 

/* Popup Theme 141983: Framed Border */
.pum-theme-141983, .pum-theme-framed-border { background-color: rgba( 255, 255, 255, 0.50 ) } 
.pum-theme-141983 .pum-container, .pum-theme-framed-border .pum-container { padding: 18px; border-radius: 0px; border: 20px outset #dd3333; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.97 ) inset; background-color: rgba( 255, 251, 239, 1.00 ) } 
.pum-theme-141983 .pum-title, .pum-theme-framed-border .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141983 .pum-content, .pum-theme-framed-border .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141983 .pum-content + .pum-close, .pum-theme-framed-border .pum-content + .pum-close { position: absolute; height: 20px; width: 20px; left: auto; right: -20px; bottom: auto; top: -20px; padding: 0px; color: #ffffff; font-family: Tahoma; font-weight: 700; font-size: 16px; line-height: 18px; border: 1px none #ffffff; border-radius: 0px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 0, 0, 0, 0.55 ) } 

/* Popup Theme 141984: Floating Bar - Soft Blue */
.pum-theme-141984, .pum-theme-floating-bar { background-color: rgba( 255, 255, 255, 0.00 ) } 
.pum-theme-141984 .pum-container, .pum-theme-floating-bar .pum-container { padding: 8px; border-radius: 0px; border: 1px none #000000; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.23 ); background-color: rgba( 238, 246, 252, 1.00 ) } 
.pum-theme-141984 .pum-title, .pum-theme-floating-bar .pum-title { color: #505050; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141984 .pum-content, .pum-theme-floating-bar .pum-content { color: #505050; font-family: inherit; font-weight: 400 } 
.pum-theme-141984 .pum-content + .pum-close, .pum-theme-floating-bar .pum-content + .pum-close { position: absolute; height: 18px; width: 18px; left: auto; right: 5px; bottom: auto; top: 50%; padding: 0px; color: #505050; font-family: Sans-Serif; font-weight: 700; font-size: 15px; line-height: 18px; border: 1px solid #505050; border-radius: 15px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.00 ); background-color: rgba( 255, 255, 255, 0.00 ); transform: translate(0, -50%) } 

/* Popup Theme 141985: Content Only - For use with page builders or block editor */
.pum-theme-141985, .pum-theme-content-only { background-color: rgba( 0, 0, 0, 0.70 ) } 
.pum-theme-141985 .pum-container, .pum-theme-content-only .pum-container { padding: 0px; border-radius: 0px; border: 1px none #000000; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ) } 
.pum-theme-141985 .pum-title, .pum-theme-content-only .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141985 .pum-content, .pum-theme-content-only .pum-content { color: #8c8c8c; font-family: inherit; font-weight: 400 } 
.pum-theme-141985 .pum-content + .pum-close, .pum-theme-content-only .pum-content + .pum-close { position: absolute; height: 18px; width: 18px; left: auto; right: 7px; bottom: auto; top: 7px; padding: 0px; color: #000000; font-family: inherit; font-weight: 700; font-size: 20px; line-height: 20px; border: 1px none #ffffff; border-radius: 15px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.00 ); background-color: rgba( 255, 255, 255, 0.00 ) } 

/* Popup Theme 141979: Light Box */
.pum-theme-141979, .pum-theme-lightbox { background-color: rgba( 0, 0, 0, 0.60 ) } 
.pum-theme-141979 .pum-container, .pum-theme-lightbox .pum-container { padding: 18px; border-radius: 3px; border: 8px solid #000000; box-shadow: 0px 0px 30px 0px rgba( 2, 2, 2, 1.00 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141979 .pum-title, .pum-theme-lightbox .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141979 .pum-content, .pum-theme-lightbox .pum-content { color: #000000; font-family: inherit; font-weight: 100 } 
.pum-theme-141979 .pum-content + .pum-close, .pum-theme-lightbox .pum-content + .pum-close { position: absolute; height: 26px; width: 26px; left: auto; right: -13px; bottom: auto; top: -13px; padding: 0px; color: #ffffff; font-family: Arial; font-weight: 100; font-size: 24px; line-height: 24px; border: 2px solid #ffffff; border-radius: 26px; box-shadow: 0px 0px 15px 1px rgba( 2, 2, 2, 0.75 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 0, 0, 0, 1.00 ) } 

/* Popup Theme 141980: Enterprise Blue */
.pum-theme-141980, .pum-theme-enterprise-blue { background-color: rgba( 0, 0, 0, 0.70 ) } 
.pum-theme-141980 .pum-container, .pum-theme-enterprise-blue .pum-container { padding: 28px; border-radius: 5px; border: 1px none #000000; box-shadow: 0px 10px 25px 4px rgba( 2, 2, 2, 0.50 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141980 .pum-title, .pum-theme-enterprise-blue .pum-title { color: #315b7c; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 34px; line-height: 36px } 
.pum-theme-141980 .pum-content, .pum-theme-enterprise-blue .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141980 .pum-content + .pum-close, .pum-theme-enterprise-blue .pum-content + .pum-close { position: absolute; height: 28px; width: 28px; left: auto; right: 8px; bottom: auto; top: 8px; padding: 4px; color: #ffffff; font-family: Times New Roman; font-weight: 100; font-size: 20px; line-height: 20px; border: 1px none #ffffff; border-radius: 42px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 49, 91, 124, 1.00 ) } 

/* Popup Theme 141981: Hello Box */
.pum-theme-141981, .pum-theme-hello-box { background-color: rgba( 0, 0, 0, 0.75 ) } 
.pum-theme-141981 .pum-container, .pum-theme-hello-box .pum-container { padding: 30px; border-radius: 80px; border: 14px solid #81d742; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141981 .pum-title, .pum-theme-hello-box .pum-title { color: #2d2d2d; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: Montserrat; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141981 .pum-content, .pum-theme-hello-box .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141981 .pum-content + .pum-close, .pum-theme-hello-box .pum-content + .pum-close { position: absolute; height: auto; width: auto; left: auto; right: -30px; bottom: auto; top: -30px; padding: 0px; color: #2d2d2d; font-family: Times New Roman; font-weight: 100; font-size: 32px; line-height: 28px; border: 1px none #ffffff; border-radius: 28px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 255, 255, 255, 1.00 ) } 

/* Popup Theme 141982: Cutting Edge */
.pum-theme-141982, .pum-theme-cutting-edge { background-color: rgba( 0, 0, 0, 0.50 ) } 
.pum-theme-141982 .pum-container, .pum-theme-cutting-edge .pum-container { padding: 18px; border-radius: 0px; border: 1px none #000000; box-shadow: 0px 10px 25px 0px rgba( 2, 2, 2, 0.50 ); background-color: rgba( 30, 115, 190, 1.00 ) } 
.pum-theme-141982 .pum-title, .pum-theme-cutting-edge .pum-title { color: #ffffff; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: Sans-Serif; font-weight: 100; font-size: 26px; line-height: 28px } 
.pum-theme-141982 .pum-content, .pum-theme-cutting-edge .pum-content { color: #ffffff; font-family: inherit; font-weight: 100 } 
.pum-theme-141982 .pum-content + .pum-close, .pum-theme-cutting-edge .pum-content + .pum-close { position: absolute; height: 24px; width: 24px; left: auto; right: 0px; bottom: auto; top: 0px; padding: 0px; color: #1e73be; font-family: Times New Roman; font-weight: 100; font-size: 32px; line-height: 24px; border: 1px none #ffffff; border-radius: 0px; box-shadow: -1px 1px 1px 0px rgba( 2, 2, 2, 0.10 ); text-shadow: -1px 1px 1px rgba( 0, 0, 0, 0.10 ); background-color: rgba( 238, 238, 34, 1.00 ) } 

#pum-141987 {z-index: 1999999999}
#pum-141986 {z-index: 1999999999}

</style>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js'></script>
<script type='text/javascript'>
/* <![CDATA[ */
/* ]]> */
</script>
<script type='text/javascript' src='/wp-content/plugins/report-content/static/js/scripts.js'></script>
<meta name="generator" content="WordPress 5.4.8" />
		<style>body {
    background: url(/wp-content/uploads/2018/08/warna.png) no-repeat fixed #0a0a0a;
    background-size: 105%;
    background-position:top center;
    color:#d6d6d6;
}
#sct_banner_top img, #sct_banner img {max-width: 728px;height: 90px;}
#sct_logo img {max-width: 220px;height: auto;}
#myElement {width: 100%;height: 100%;position: absolute !important;margin: 0 !important;top: 0;left: 0;}
.jw-preview, .jw-captions, .jw-title, .jw-overlays, .jw-controls {z-index: 105;}
.videoads iframe {position: relative !important;}
.report{position:relative;float:right;margin-right:5px}
.wprc-container{margin:6px 0 0!important}
button.wprc-switch{padding: 4px 7px; background:#003a59!important;min-width:auto!important;color:#cfcfcf!important;border:1px solid #003a59!important}
.wprc-container .wprc-content{background:#1b1b1b!important;border-top:4px solid #3c3b36!important;box-shadow:0 0 5px #000!important}
@media only screen and ( max-width: 750px ) {
.report{position:relative;float:none;margin-right:0;height:25px}
.wprc-container{margin:6px 0 0!important;width:100%!important}
button.wprc-switch{width:100%!important}
}
#sct_page{background-color:rgba(0,0,0,0.8);padding:15px;border:1px solid #323232;margin:0 0 10px;overflow:hidden;border-radius: 10px;}</style>
<style>
.ctn_side ul {padding-left: 15px;line-height: 18px;}
</style>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-77285272-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-77285272-1');
</script>

<!--  ad tags Size: 320x50 ZoneId:1127811 -->
<!--  -->



<style>
span.jwcontrols {
    z-index: 105 !important;
}
</style>

</head>

<body data-rsssl=1>
<div id='shadow'></div>
	
<div id="sct_top"><div class="wrap"> <span id="sct_welcome" class="fl">Selamat datang di ${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</span> <span id="sct_recommended" class="fr"><div class="textwidget"><span style="color: #0077b6"><strong>Browse:</strong></span>&nbsp;<strong> <a href="/anime-list/#%23">#</a> <a href="/anime-list/#A">A</a> <a href="/anime-list/#B">B</a> <a href="/anime-list/#C">C</a> <a href="/anime-list/#D">D</a> <a href="/anime-list/#E">E</a> <a href="/anime-list/#F">F</a> <a href="/anime-list/#G">G</a> <a href="/anime-list/#H">H</a> <a href="/anime-list/#I">I</a> <a href="/anime-list/#J">J</a> <a href="/anime-list/#K">K</a> <a href="/anime-list/#L">L</a> <a href="/anime-list/#M">M</a> <a href="/anime-list/#N">N</a> <a href="/anime-list/#O">O</a> <a href="/anime-list/#P">P</a> <a href="/anime-list/#Q">Q</a> <a href="/anime-list/#R">R</a> <a href="/anime-list/#S">S</a> <a href="/anime-list/#T">T</a> <a href="/anime-list/#U">U</a> <a href="/anime-list/#V">V</a> <a href="/anime-list/#W">W</a> <a href="/anime-list/#X">X</a> <a href="/anime-list/#Y">Y</a> <a href="/anime-list/#Z">Z</a></strong></div> </span></div></div>
<div id="sct_head">
<div class="wrap">
<a href="/" id="sct_logo" class="fl"><img src="/wp-content/themes/wibunime/img/logo.png" alt="Logo" title="${this.domain}"></a>
<div id="sct_banner_top" class="fr"><a href="https://cutt.ly/nontonanime" target="_blank" rel="nofollow"><img class="alignnone size-full wp-image-141557" src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="" width="728" height="90" /></a> </div></div>
</div>
<div id="sct_menu_area">
<div class="wrap">
<div class="mainx">
<div id="sct_menu">
<ul id="deskmenu" class="menu"><li id="menu-item-16" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li id="menu-item-15" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-18" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-17 current_page_item menu-item-18"><a href="/genre" aria-current="page">Genres</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
<div class="search-block">
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
</div>
</div>
</div>
</div>

<div id="ninemobile">
<div class="mainx">
<!-- ads lie -->
<a href="https://cutt.ly/nontonanime" target="_blank" rel="nofollow"><img src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="${this.domain}" title="${this.domain}" width="100%"/></a>
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
<label for="show-menu" class="show-menu"><span class="dashicons dashicons-menu"></span></label>
<input type="checkbox" id="show-menu" role="button">
<ul id="mobmenu" class="menu"><li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-17 current_page_item menu-item-18"><a href="/genre" aria-current="page">Genres</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
</div>

<div class="wrap mobilewrap">
<!-- iklan nya lie atas -->
	
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<div class="global_info">
<span>News</span>
Sedang Proses Re-upload Anime-Anime lama... Jika tidak bisa di Streaming... Harap Bersabar... Ini ujian...</div>
<div id="sct_page">



<div id="sct_content" class="fl">
<h1>Genres</h1>
<ul class="gen">
${allgenre}</ul>
</div>

<div id="sct_sidebar" class="fr">
	<div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div><div class="ctn_side">			<div class="textwidget"></div>
		</div><div class="ctn_side">			<div class="textwidget"><iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FAnimeIndoStream%2F&tabs&width=300&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId=1540873672891974" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
</div>
		</div><div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div>
</div></div>

</div>

<div id="footer">
<div class="wrap">
<div class="ftr_wgt">
<div class="anm_wdt">
<h3>${this.domain}</h3>			<div class="textwidget"><p><strong>${this.domain}</strong> adalah website yang menyediakan konten streaming video anime subtittle indonesia dengan koleksi 1000+ judul dari berbagai genre dan tersedia fitur yang mempermudah dalam pencarian anime sesuai keinginan anda. <a href="/anime-list">Anime list</a>, <a href="${this.url}/popular-series">Populer anime</a>, <a href="/genre">Genre</a>.</p>
</div>
		</div>
<div class="anm_wdt">
<h3>Navigasi</h3><div class="menu-footer-menu-container"><ul id="menu-footer-menu" class="menu"><li id="menu-item-616" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-616"><a href="/">Home</a></li>
<li id="menu-item-39" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-39"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-40" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-40"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-41" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-41" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41"><a href="/report">Report</a></li>
</ul></div></div>
</div>
<div class="credit">
<b>${this.domain}</b> - <b>Nonton Streaming Download Anime Subtitle Indonesia</b> Copyright © 2016 - Powered by <b><a href="" target="_blank">WordPress</a></b> & <b><a href="http://enduser.id/" target="_blank" rel="nofollow">Enduser</a></b> - <b><a href="http://hentaiplus.co/" target="_blank">Streaming Hentai</a></b><br><span>Copyrights and trademarks for the anime, and other promotional materials are held by their respective owners and their use is allowed under the fair use clause of the Copyright Law.</span>
	
</div>
</div>
</div>
<script data-cfasync="false" async type="text/javascript" src="//kiltyyoginis.com/rl3g5o25RWa1PGntH/44701"></script>
</body>
<div id="pum-141987" class="pum pum-overlay pum-theme-141978 pum-theme-default-theme popmake-overlay auto_open click_open" data-popmake="{&quot;id&quot;:141987,&quot;slug&quot;:&quot;1&quot;,&quot;theme_id&quot;:141978,&quot;cookies&quot;:[],&quot;triggers&quot;:[{&quot;type&quot;:&quot;auto_open&quot;,&quot;settings&quot;:{&quot;cookie_name&quot;:&quot;&quot;,&quot;delay&quot;:&quot;500&quot;}},{&quot;type&quot;:&quot;click_open&quot;,&quot;settings&quot;:{&quot;extra_selectors&quot;:&quot;&quot;,&quot;cookie_name&quot;:null}}],&quot;mobile_disabled&quot;:null,&quot;tablet_disabled&quot;:null,&quot;meta&quot;:{&quot;display&quot;:{&quot;stackable&quot;:false,&quot;overlay_disabled&quot;:false,&quot;scrollable_content&quot;:false,&quot;disable_reposition&quot;:false,&quot;size&quot;:&quot;auto&quot;,&quot;responsive_min_width&quot;:&quot;100%&quot;,&quot;responsive_min_width_unit&quot;:false,&quot;responsive_max_width&quot;:&quot;100%&quot;,&quot;responsive_max_width_unit&quot;:false,&quot;custom_width&quot;:&quot;640px&quot;,&quot;custom_width_unit&quot;:false,&quot;custom_height&quot;:&quot;640px&quot;,&quot;custom_height_unit&quot;:false,&quot;custom_height_auto&quot;:false,&quot;location&quot;:&quot;center&quot;,&quot;position_from_trigger&quot;:false,&quot;position_top&quot;:&quot;100&quot;,&quot;position_left&quot;:&quot;0&quot;,&quot;position_bottom&quot;:&quot;0&quot;,&quot;position_right&quot;:&quot;0&quot;,&quot;position_fixed&quot;:false,&quot;animation_type&quot;:&quot;fade&quot;,&quot;animation_speed&quot;:&quot;350&quot;,&quot;animation_origin&quot;:&quot;center top&quot;,&quot;overlay_zindex&quot;:false,&quot;zindex&quot;:&quot;1999999999&quot;},&quot;close&quot;:{&quot;text&quot;:&quot;Close&quot;,&quot;button_delay&quot;:&quot;0&quot;,&quot;overlay_click&quot;:false,&quot;esc_press&quot;:false,&quot;f4_press&quot;:false},&quot;click_open&quot;:[]}}" role="dialog" aria-hidden="true" >

	<div id="popmake-141987" class="pum-container popmake theme-141978">

				

				

		

				<div class="pum-content popmake-content" tabindex="0">
			<p><a href="https://bit.ly/animeidn" target="_blank" rel="noopener noreferrer"><img class="size-full aligncenter" src="/wp-content/uploads/01.webp" alt="KW88_01" width="100%" /></a></p>
		</div>


				

				            <button type="button" class="pum-close popmake-close" aria-label="Close">
			Close            </button>
		
	</div>

</div>
<script type='text/javascript' src='/wp-includes/js/jquery/ui/core.min.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/ui/position.min.js'></script>
<script type='text/javascript' src='/wp-content/plugins/popup-maker/assets/js/site.min.js'></script>
<script type='text/javascript' src='/wp-includes/js/wp-embed.min.js'></script>
<script type='text/javascript' src='/wp-content/themes/wibunime/js/search.js'></script>
</html></div>
<!-- Dynamic page generated in 0.229 seconds. -->
<!-- Cached page generated by WP-Super-Cache on 2021-12-14 14:00:04 -->

<!-- Compression = gzip -->`

	reportPage = () => `<html>
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<meta name="robots" content="archive, follow, imageindex, index, odp, snippet, translate">
<meta property="og:site_name" name="og:site_name" content="REPORT">
<meta property="og:title" name="og:title" content="REPORT">
<meta property="og:url" name="og:url" content="REPORT">
<meta property="og:image" name="og:image" content="icon/android-icon-192x192.png">
<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
<title></title>
<script src="http://code.jquery.com/jquery-2.2.1.min.js"></script>
<link href="https://fonts.googleapis.com/css?family=Poppins:200,300,400,600,700,800" rel="stylesheet"/>
<link href="//cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css" rel="stylesheet">
<script src="//cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js"></script>
<link href="/auth/css/login.css" rel="stylesheet" type="text/css"/>
<script>
function getUrl(){
	return window.location.href
}
</script>
</head>
<body>        

<div class="d-flex flex-column flex-root">
<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
    <div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
        <div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
				<form method="POST" action="/report" class="form w-100" id="kt_sign_up_form" name="form_report">
					<div class="mb-10 text-center">
						<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - ADD NEW ANIME</h1>
					</div>
					<div class="d-flex align-items-center mb-10">
						<div class="border-bottom border-gray-300 mw-50 w-100"></div>
    				</div>
					<div class="fv-row mb-7">
						<label class="form-label fw-bolder text-dark fs-6">Issue</label>
						<select id="issue" name="issue" class="form-control form-control-lg">
							<option value="copyright_infringement">Copyright Infringement</option>
							<option value="spam">Spam</option>
							<option value="invalid_contents">Invalid Contents</option>
							<option value="broken_links">Broken Links</option>
						</select>                                                      
					</div>
					<div class="fv-row mb-7">
						<label class="form-label fw-bolder text-dark fs-6">Your Name</label>
						<input class="form-control form-control-lg" type="text" placeholder="Your Name" name="name" autocomplete="off" required/>
					</div>
					<div class="fv-row mb-7">
						<label class="form-label fw-bolder text-dark fs-6">Your Email</label>
						<input class="form-control form-control-lg" type="email" placeholder="Your Email" name="email" autocomplete="off" required/>
					</div>
					<div class="fv-row mb-7">
						<label class="form-label fw-bolder text-dark fs-6">Detail</label>
						<input class="form-control form-control-lg" type="text" placeholder="Detail" name="detail" autocomplete="off" required/>
					</div>
					<br>
					<br>
					<div class="text-center">
						<button type="submit" class="btn btn-lg btn-primary">Save</button>
						<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
<script src="/auth/js/login.js"></script>
</body>
</html>`

	adminPage = (isi, message) => `<html>
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<meta name="description" content="A REST APIs website that provides a wide variety of features for developers.">
<meta name="robots" content="archive, follow, imageindex, index, odp, snippet, translate">
<meta name="author" content="h4ck3rs404">
<meta property="og:site_name" name="og:site_name" content="STREAM">
<meta property="og:title" name="og:title" content="STREAM">
<meta property="og:url" name="og:url" content="STREAM">
<meta property="og:image" name="og:image" content="icon/android-icon-192x192.png">
<meta property="og:description" name="og:description" content="A REST APIs website that provides a wide variety of features for developers.">
<link rel="apple-touch-icon" sizes="57x57" href="/static/icon/apple-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="/static/icon/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="/static/icon/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="/static/icon/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/static/icon/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/static/icon/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/static/icon/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/static/icon/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/static/icon/apple-icon-180x180.png">
<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="192x192" href="/static/icon/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="/static/icon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/static/icon/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="/static/icon/favicon-16x16.png">
<title>Edit User </title>
<script src="http://code.jquery.com/jquery-2.2.1.min.js"></script>
<link href="https://fonts.googleapis.com/css?family=Poppins:200,300,400,600,700,800" rel="stylesheet"/>
<link href="//cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css" rel="stylesheet">
<script src="//cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js"></script>
<link href="/auth/css/login.css" rel="stylesheet" type="text/css"/>
</head>
<body>
<script>
function chgAction(action, actn, type, pass){        
	if(action.toLowerCase() == "add" || action.toLowerCase() == "edit"){
		document.form_admin.action = "/admin?action=add&acnum="+actn+"&typemov="+type+"&pass="+pass
	}else if(action.toLowerCase() == "delete"){
		document.form_admin.action = "/admin?action=delete&acnum="+actn+"&pass="+pass
	}
}
setInterval(() => {
	var queryString = window.location.search;
	var urlParams = new URLSearchParams(queryString);
	var action = urlParams.get('action')
	var type = urlParams.get('acnum')
	if(action.toLowerCase() == "add" || action.toLowerCase() == "edit"){
		chgAction(action === undefined || action === null ? 'add' : action, type === undefined || type === null || isNaN(type) ? '1' : type, document.getElementById("typeanime").value, document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value)
	}else{
		chgAction('delete', type === undefined || type === null || isNaN(type) ? '1' : type, '', document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value)
	}
}, 10)
</script>          
${message === undefined ? '' : message}
		${isi}
</div>
</div>
</div>
</div>
<script src="/auth/js/login.js"></script>
</body>
</html>`

	watchPage = (bcddek) => `${bcddek}`

	htmlPage = (animenew, allanime, page, movie, message) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head profile="http://gmpg.org/xfn/11">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</title>
<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700,300' rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/wp-content/themes/wibunime/style.css" type="text/css" media="screen" />

<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
<link rel="icon" href="/wp-content/uploads/2016/12/01.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="/wp-content/themes/wibunime/js/jquery.qtip.css" />
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.min.js"></script>
<script type="text/javascript" src="/wp-content/script.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/imagesloaded.pkg.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/light.js"></script>
<link href="//cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css" rel="stylesheet">
<script src="//cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js"></script>
<!-- matiin load

-->
<script type='text/javascript'>
//<![CDATA[
$(document).ready(function(){
   $("#shadow").css("height", $(document).height()).hide();
   $(".lightSwitcher").click(function(){
      $("#shadow").toggle();
         if ($("#shadow").is(":hidden"))
            $(this).html("Lights Off").removeClass("turnedOff");
         else
            $(this).html("Lights On").addClass("turnedOff");
         });
            
  });
//]]>
</script>
<script type="text/javascript">
	function hidediv(id) {
		document.getElementById(id).style.display = 'none';
	}
</script>

	<!-- This site is optimized with the Yoast SEO plugin v17.5 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="description" content="Nonton Streaming Anime Subtitle Indonesia Download Anime Sub Indo Online, ${this.domain}" />
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	<link rel="canonical" href="/" />
	<link rel="next" href="${this.url}/page/2" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="${this.domain}" />
	<meta property="og:description" content="Nonton Streaming Anime Subtitle Indonesia Download Anime Sub Indo Online, ${this.domain}" />
	<meta property="og:url" content="${this.url}" />
	<meta property="og:site_name" content="${this.domain}" />
	<meta name="twitter:card" content="summary_large_image" />
	<!-- / Yoast SEO plugin. -->


<link rel='dns-prefetch' href='//s.w.org' />
		<script type="text/javascript">
			window._wpemojiSettings = {"baseUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/72x72\/","ext":".png","svgUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/svg\/","svgExt":".svg","source":{"concatemoji":"\/wp-includes\/js\/wp-emoji-release.min.js"}};
			/*! This file is auto-generated */
			!function(e,a,t){var n,r,o,i=a.createElement("canvas"),p=i.getContext&&i.getContext("2d");function s(e,t){var a=String.fromCharCode;p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,e),0,0);e=i.toDataURL();return p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,t),0,0),e===i.toDataURL()}function c(e){var t=a.createElement("script");t.src=e,t.defer=t.type="text/javascript",a.getElementsByTagName("head")[0].appendChild(t)}for(o=Array("flag","emoji"),t.supports={everything:!0,everythingExceptFlag:!0},r=0;r<o.length;r++)t.supports[o[r]]=function(e){if(!p||!p.fillText)return!1;switch(p.textBaseline="top",p.font="600 32px Arial",e){case"flag":return s([127987,65039,8205,9895,65039],[127987,65039,8203,9895,65039])?!1:!s([55356,56826,55356,56819],[55356,56826,8203,55356,56819])&&!s([55356,57332,56128,56423,56128,56418,56128,56421,56128,56430,56128,56423,56128,56447],[55356,57332,8203,56128,56423,8203,56128,56418,8203,56128,56421,8203,56128,56430,8203,56128,56423,8203,56128,56447]);case"emoji":return!s([55357,56424,55356,57342,8205,55358,56605,8205,55357,56424,55356,57340],[55357,56424,55356,57342,8203,55358,56605,8203,55357,56424,55356,57340])}return!1}(o[r]),t.supports.everything=t.supports.everything&&t.supports[o[r]],"flag"!==o[r]&&(t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&t.supports[o[r]]);t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&!t.supports.flag,t.DOMReady=!1,t.readyCallback=function(){t.DOMReady=!0},t.supports.everything||(n=function(){t.readyCallback()},a.addEventListener?(a.addEventListener("DOMContentLoaded",n,!1),e.addEventListener("load",n,!1)):(e.attachEvent("onload",n),a.attachEvent("onreadystatechange",function(){"complete"===a.readyState&&t.readyCallback()})),(n=t.source||{}).concatemoji?c(n.concatemoji):n.wpemoji&&n.twemoji&&(c(n.twemoji),c(n.wpemoji)))}(window,document,window._wpemojiSettings);
		</script>
		<style type="text/css">
img.wp-smiley,
img.emoji {
	display: inline !important;
	border: none !important;
	box-shadow: none !important;
	height: 1em !important;
	width: 1em !important;
	margin: 0 .07em !important;
	vertical-align: -0.1em !important;
	background: none !important;
	padding: 0 !important;
}
</style>
	<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='wprc-style-css'  href='/wp-content/plugins/report-content/static/css/styles.css' type='text/css' media='all' />
<link rel='stylesheet' id='dashicons-css'  href='/wp-includes/css/dashicons.min.css' type='text/css' media='all' />
<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js'></script>
<script type='text/javascript' src='/wp-content/plugins/report-content/static/js/scripts.js'></script>
<meta name="generator" content="WordPress 5.4.8" />
		<style>body {
    background: url(/wp-content/uploads/2018/08/warna.png) no-repeat fixed #0a0a0a;
    background-size: 105%;
    background-position:top center;
    color:#d6d6d6;
}
#sct_banner_top img, #sct_banner img {max-width: 728px;height: 90px;}
#sct_logo img {max-width: 220px;height: auto;}
#myElement {width: 100%;height: 100%;position: absolute !important;margin: 0 !important;top: 0;left: 0;}
.jw-preview, .jw-captions, .jw-title, .jw-overlays, .jw-controls {z-index: 105;}
.videoads iframe {position: relative !important;}
.report{position:relative;float:right;margin-right:5px}
.wprc-container{margin:6px 0 0!important}
button.wprc-switch{padding: 4px 7px; background:#003a59!important;min-width:auto!important;color:#cfcfcf!important;border:1px solid #003a59!important}
.wprc-container .wprc-content{background:#1b1b1b!important;border-top:4px solid #3c3b36!important;box-shadow:0 0 5px #000!important}
@media only screen and ( max-width: 750px ) {
.report{position:relative;float:none;margin-right:0;height:25px}
.wprc-container{margin:6px 0 0!important;width:100%!important}
button.wprc-switch{width:100%!important}
}
#sct_page{background-color:rgba(0,0,0,0.8);padding:15px;border:1px solid #323232;margin:0 0 10px;overflow:hidden;border-radius: 10px;}</style>
<style>
.ctn_side ul {padding-left: 15px;line-height: 18px;}
</style>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-77285272-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-77285272-1');
</script>

<!--  ad tags Size: 320x50 ZoneId:1127811 -->
<!--  -->



<style>
span.jwcontrols {
    z-index: 105 !important;
}
</style>

</head>

<body data-rsssl=1>
${message === undefined ? '' : message}
<div id='shadow'></div>
<style>.head1,.node h2{display:none;}</style>
<div class="head1"><h1>${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</h1></div>

		
<div id="sct_top"><div class="wrap"> <span id="sct_welcome" class="fl">Selamat datang di ${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</span> <span id="sct_recommended" class="fr"><div class="textwidget"><span style="color: #0077b6"><strong>Browse:</strong></span>&nbsp;<strong> <a href="/anime-list/#%23">#</a> <a href="/anime-list/#A">A</a> <a href="/anime-list/#B">B</a> <a href="/anime-list/#C">C</a> <a href="/anime-list/#D">D</a> <a href="/anime-list/#E">E</a> <a href="/anime-list/#F">F</a> <a href="/anime-list/#G">G</a> <a href="/anime-list/#H">H</a> <a href="/anime-list/#I">I</a> <a href="/anime-list/#J">J</a> <a href="/anime-list/#K">K</a> <a href="/anime-list/#L">L</a> <a href="/anime-list/#M">M</a> <a href="/anime-list/#N">N</a> <a href="/anime-list/#O">O</a> <a href="/anime-list/#P">P</a> <a href="/anime-list/#Q">Q</a> <a href="/anime-list/#R">R</a> <a href="/anime-list/#S">S</a> <a href="/anime-list/#T">T</a> <a href="/anime-list/#U">U</a> <a href="/anime-list/#V">V</a> <a href="/anime-list/#W">W</a> <a href="/anime-list/#X">X</a> <a href="/anime-list/#Y">Y</a> <a href="/anime-list/#Z">Z</a></strong></div> </span></div></div>
<div id="sct_head">
<div class="wrap">
<a href="/" id="sct_logo" class="fl"><img src="/wp-content/themes/wibunime/img/logo.png" alt="Logo" title="${this.domain}"></a>
<div id="sct_banner_top" class="fr"><a href="https://cutt.ly/animepastijp" target="_blank" rel="nofollow"><img class="alignnone size-full wp-image-141557" src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="" width="728" height="90" /></a> </div></div>
</div>
<div id="sct_menu_area">
<div class="wrap">
<div class="mainx">
<div id="sct_menu">
<ul id="deskmenu" class="menu"><li id="menu-item-16" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-16"><a href="/" aria-current="page"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li id="menu-item-15" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-18" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
<div class="search-block">
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
</div>
</div>
</div>
</div>

<div id="ninemobile">
<div class="mainx">
<!-- ads lie -->
<a href="https://cutt.ly/animepastijp" target="_blank" rel="nofollow"><img src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="${this.domain}" title="${this.domain}" width="100%"/></a>
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
<label for="show-menu" class="show-menu"><span class="dashicons dashicons-menu"></span></label>
<input type="checkbox" id="show-menu" role="button">
<ul id="mobmenu" class="menu"><li class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-16"><a href="/" aria-current="page"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
</div>

<div class="wrap mobilewrap">
<!-- iklan nya lie atas -->
	
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<div class="global_info">
<span>News</span>
Sedang Proses Re-upload Anime-Anime lama... Jika tidak bisa di Streaming... Harap Bersabar... Ini ujian...</div>
<div id="sct_page">



<div class="hotup">
<h3>Terpopuler</h3>
<div class="nd">
${allanime}
</div>

</div>


<div id="sct_content" class="fl mobilewrap">
	<!-- iklan judi homepage -->
<h3>Episode Terbaru</h3>
<div class="nd">
${animenew.html}
<div class="pagination">
${page}
</div>
<!-- Ads banner mobile -->
<h3>Movie Terbaru</h3>
<div class="nd">
${movie}
</div>
</div>
<div id="sct_sidebar" class="fr">
	<div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div><div class="ctn_side">			<div class="textwidget"></div>
		</div><div class="ctn_side">			<div class="textwidget"><iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FAnimeIndoStream%2F&tabs&width=300&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId=1540873672891974" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
</div>
		</div><div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div>
</ul></div>		
</div></div>

</div>

<div id="footer">
<div class="wrap">
<div class="ftr_wgt">
<div class="anm_wdt">
<h3>${this.domain}</h3>			<div class="textwidget"><p><strong>${this.domain}</strong> adalah website yang menyediakan konten streaming video anime subtittle indonesia dengan koleksi 1000+ judul dari berbagai genre dan tersedia fitur yang mempermudah dalam pencarian anime sesuai keinginan anda. <a href="/anime-list">Anime list</a>, <a href="${this.url}/popular-series">Populer anime</a>, <a href="/genre">Genre</a>.</p>
</div>
		</div>
<div class="anm_wdt">
<h3>Navigasi</h3><div class="menu-footer-menu-container"><ul id="menu-footer-menu" class="menu"><li id="menu-item-616" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-616"><a href="/" aria-current="page">Home</a></li>
<li id="menu-item-39" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-39"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-40" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-40"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-41" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41"><a href="/ongoing">Anime Ongoing</a></li>
</ul></div></div>
</div>
<div class="credit">
<b>${this.domain}</b> - <b>Nonton Streaming Download Anime Subtitle Indonesia</b> Copyright © 2016 - Powered by <b><a href="" target="_blank">WordPress</a></b> & <b><a href="http://enduser.id/" target="_blank" rel="nofollow">Enduser</a></b> - <b><a href="http://hentaiplus.co/" target="_blank">Streaming Hentai</a></b><br><span>Copyrights and trademarks for the anime, and other promotional materials are held by their respective owners and their use is allowed under the fair use clause of the Copyright Law.</span>
	
</div>
</div>
</div>
<script data-cfasync="false" async type="text/javascript" src="//kiltyyoginis.com/rl3g5o25RWa1PGntH/44701"></script>
</body>
<script type='text/javascript'>
/* <![CDATA[ */
var countVars = {"disqusShortname":"${this.domain}.online"};
/* ]]> */
</script>
<script type='text/javascript' src='/wp-content/plugins/disqus-comment-system/public/js/comment_count.js'></script>
<script type='text/javascript' src='/wp-includes/js/wp-embed.min.js'></script>
<script type='text/javascript' src='/wp-content/themes/wibunime/js/search.js'></script>
</html>
<!-- Dynamic page generated in 2.285 seconds. -->
<!-- Cached page generated by WP-Super-Cache on 2021-12-11 09:06:25 -->

<!-- Compression = gzip -->`


	addLogs = (ip, page) => {
		console.log(chalk.green(`[${ip}] `) + chalk.red("Open ") + chalk.blue("Page ") + chalk.yellow(`${page[0].toUpperCase()}${page.slice(1)}`))
	}
	//FUNCTION WATCH
	loopingEps = (data) => {
		var textnya = ``
		for (let i = 0; i < data.eps.length; i++) {
			textnya += `<li><a href="/anime/${data.nameurl}/${i}" title="${data.nameurl} Episode ${i}"><span>${data.nameurl}</span> Episode ${i}</a></li>`
		}
		return textnya
	}

	loopingDownload = async (data, eps) => {
		var textnya = ``
		const dbeps = await getDBEps(data.nameurl, parseInt(eps))
		for (let i = 0; i < dbeps.download.length; i++) {
			textnya += `<a href="` + dbeps.download[i].url + `" target="_blank">${dbeps.download[i].name}</a>`
		}
		return textnya
	}

	WatchAnime = (urlvid, data, eps, loopeps, loopdow, genre) => {
		var textnya = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head profile="http://gmpg.org/xfn/11">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>${data.nameurl} Episode ${eps} Subtitle Indonesia - </title>
<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700,300' rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/wp-content/themes/wibunime/style.css" type="text/css" media="screen" />
<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
<link rel="icon" href="/wp-content/uploads/2016/12/01.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="/wp-content/themes/wibunime/js/jquery.qtip.css" />
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/imagesloaded.pkg.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/light.js"></script>
<!-- matiin load

-->
<script type='text/javascript'>
//<![CDATA[
$(document).ready(function(){
   $("#shadow").css("height", $(document).height()).hide();
   $(".lightSwitcher").click(function(){
      $("#shadow").toggle();
         if ($("#shadow").is(":hidden"))
            $(this).html("Lights Off").removeClass("turnedOff");
         else
            $(this).html("Lights On").addClass("turnedOff");
         });
            
  });
//]]>
</script>
<script type="text/javascript">
	function hidediv(id) {
		document.getElementById(id).style.display = 'none';
	}
</script>

	<!-- This site is optimized with the Yoast SEO plugin v17.5 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="description" content="${data.nameurl} Episode ${eps} Subtitle Indonesia, Nonton Download ${data.nama} Episode ${eps} Subtitle Indonesia, Streaming Online Anime Subtitle Indonesia - ${this.domain}" />
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

	<link rel="canonical" href="${this.url}/anime/${data.nameurl}/${eps}"/> 
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content="${data.nameurl} Episode ${eps} Subtitle Indonesia - ${this.domain}" />
	<meta property="og:description" content="${data.nameurl} Episode ${eps} Subtitle Indonesia, Nonton Download ${data.nameurl} Episode ${eps} Subtitle Indonesia, Streaming Online Anime Subtitle Indonesia - ${this.domain}" />
	<meta property="og:url" content=${data.nameurl} />
	<meta property="og:site_name" content="${this.domain}" />
	<meta property="article:published_time" content="2021-12-05T03:20:05+00:00" />
	<meta property="og:image" content="/wp-content/uploads/2020/11/One-Piece.jpg" />
	<meta property="og:image:width" content="225" />
	<meta property="og:image:height" content="350" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:label1" content="Written by" />
	<meta name="twitter:data1" content="apin" />
	<meta name="twitter:label2" content="Est. reading time" />
	<meta name="twitter:data2" content="1 minute" />
	<!-- / Yoast SEO plugin. -->


<link rel='dns-prefetch' href='//s.w.org' />
		<script type="text/javascript">
			window._wpemojiSettings = {"baseUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/72x72\/","ext":".png","svgUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/svg\/","svgExt":".svg","source":{"concatemoji":"wp-includes\/js\/wp-emoji-release.min.js"}};
			/*! This file is auto-generated */
			!function(e,a,t){var n,r,o,i=a.createElement("canvas"),p=i.getContext&&i.getContext("2d");function s(e,t){var a=String.fromCharCode;p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,e),0,0);e=i.toDataURL();return p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,t),0,0),e===i.toDataURL()}function c(e){var t=a.createElement("script");t.src=e,t.defer=t.type="text/javascript",a.getElementsByTagName("head")[0].appendChild(t)}for(o=Array("flag","emoji"),t.supports={everything:!0,everythingExceptFlag:!0},r=0;r<o.length;r++)t.supports[o[r]]=function(e){if(!p||!p.fillText)return!1;switch(p.textBaseline="top",p.font="600 32px Arial",e){case"flag":return s([127987,65039,8205,9895,65039],[127987,65039,8203,9895,65039])?!1:!s([55356,56826,55356,56819],[55356,56826,8203,55356,56819])&&!s([55356,57332,56128,56423,56128,56418,56128,56421,56128,56430,56128,56423,56128,56447],[55356,57332,8203,56128,56423,8203,56128,56418,8203,56128,56421,8203,56128,56430,8203,56128,56423,8203,56128,56447]);case"emoji":return!s([55357,56424,55356,57342,8205,55358,56605,8205,55357,56424,55356,57340],[55357,56424,55356,57342,8203,55358,56605,8203,55357,56424,55356,57340])}return!1}(o[r]),t.supports.everything=t.supports.everything&&t.supports[o[r]],"flag"!==o[r]&&(t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&t.supports[o[r]]);t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&!t.supports.flag,t.DOMReady=!1,t.readyCallback=function(){t.DOMReady=!0},t.supports.everything||(n=function(){t.readyCallback()},a.addEventListener?(a.addEventListener("DOMContentLoaded",n,!1),e.addEventListener("load",n,!1)):(e.attachEvent("onload",n),a.attachEvent("onreadystatechange",function(){"complete"===a.readyState&&t.readyCallback()})),(n=t.source||{}).concatemoji?c(n.concatemoji):n.wpemoji&&n.twemoji&&(c(n.twemoji),c(n.wpemoji)))}(window,document,window._wpemojiSettings);
		</script>
		<style type="text/css">
img.wp-smiley,
img.emoji {
	display: inline !important;
	border: none !important;
	box-shadow: none !important;
	height: 1em !important;
	width: 1em !important;
	margin: 0 .07em !important;
	vertical-align: -0.1em !important;
	background: none !important;
	padding: 0 !important;
}
</style>
	<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='wprc-style-css'  href='/wp-content/plugins/report-content/static/css/styles.css' type='text/css' media='all' />
<link rel='stylesheet' id='dashicons-css'  href='/wp-includes/css/dashicons.min.css' type='text/css' media='all' />
<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js'></script>
<script type='text/javascript' src='/wp-content/plugins/report-content/static/js/scripts.js'></script>
<meta name="generator" content="WordPress 5.4.8" />
		<style>body {
    background: url(/wp-content/uploads/2018/08/warna.png) no-repeat fixed #0a0a0a;
    background-size: 105%;
    background-position:top center;
    color:#d6d6d6;
}
#sct_banner_top img, #sct_banner img {max-width: 728px;height: 90px;}
#sct_logo img {max-width: 220px;height: auto;}
#myElement {width: 100%;height: 100%;position: absolute !important;margin: 0 !important;top: 0;left: 0;}
.jw-preview, .jw-captions, .jw-title, .jw-overlays, .jw-controls {z-index: 105;}
.videoads iframe {position: relative !important;}
.report{position:relative;float:right;margin-right:5px}
.wprc-container{margin:6px 0 0!important}
button.wprc-switch{padding: 4px 7px; background:#003a59!important;min-width:auto!important;color:#cfcfcf!important;border:1px solid #003a59!important}
.wprc-container .wprc-content{background:#1b1b1b!important;border-top:4px solid #3c3b36!important;box-shadow:0 0 5px #000!important}
@media only screen and ( max-width: 750px ) {
.report{position:relative;float:none;margin-right:0;height:25px}
.wprc-container{margin:6px 0 0!important;width:100%!important}
button.wprc-switch{width:100%!important}
}
#sct_page{background-color:rgba(0,0,0,0.8);padding:15px;border:1px solid #323232;margin:0 0 10px;overflow:hidden;border-radius: 10px;}</style>
<style>
.ctn_side ul {padding-left: 15px;line-height: 18px;}
</style>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-77285272-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-77285272-1');
</script>

<!--  ad tags Size: 320x50 ZoneId:1127811 -->
<!--  -->



<style>
span.jwcontrols {
    z-index: 105 !important;
}
</style>

</head>

<body data-rsssl=1>
<div id='shadow'></div>
	
<div id="sct_top"><div class="wrap"> <span id="sct_welcome" class="fl">Selamat datang di ${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</span> <span id="sct_recommended" class="fr"><div class="textwidget"><span style="color: #0077b6"><strong>Browse:</strong></span>&nbsp;<strong> <a href="/anime-list/#%23">#</a> <a href="/anime-list/#A">A</a> <a href="/anime-list/#B">B</a> <a href="/anime-list/#C">C</a> <a href="/anime-list/#D">D</a> <a href="/anime-list/#E">E</a> <a href="/anime-list/#F">F</a> <a href="/anime-list/#G">G</a> <a href="/anime-list/#H">H</a> <a href="/anime-list/#I">I</a> <a href="/anime-list/#J">J</a> <a href="/anime-list/#K">K</a> <a href="/anime-list/#L">L</a> <a href="/anime-list/#M">M</a> <a href="/anime-list/#N">N</a> <a href="/anime-list/#O">O</a> <a href="/anime-list/#P">P</a> <a href="/anime-list/#Q">Q</a> <a href="/anime-list/#R">R</a> <a href="/anime-list/#S">S</a> <a href="/anime-list/#T">T</a> <a href="/anime-list/#U">U</a> <a href="/anime-list/#V">V</a> <a href="/anime-list/#W">W</a> <a href="/anime-list/#X">X</a> <a href="/anime-list/#Y">Y</a> <a href="/anime-list/#Z">Z</a></strong></div> </span></div></div>
<div id="sct_head">
<div class="wrap">
<a href="/" id="sct_logo" class="fl"><img src="/wp-content/themes/wibunime/img/logo.png" alt="Logo" title="${this.domain}"></a>
<div id="sct_banner_top" class="fr"><a href="https://cutt.ly/animepastijp" target="_blank" rel="nofollow"><img class="alignnone size-full wp-image-141557" src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="" width="728" height="90" /></a> </div></div>
</div>
<div id="sct_menu_area">
<div class="wrap">
<div class="mainx">
<div id="sct_menu">
<ul id="deskmenu" class="menu"><li id="menu-item-16" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li id="menu-item-15" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-18" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
<div class="search-block">
<form method="get" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime"/>
</form>
</div>
</div>
</div>
</div>

<div id="ninemobile">
<div class="mainx">
<!-- ads lie -->
<a href="https://cutt.ly/animepastijp" target="_blank" rel="nofollow"><img src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="${this.domain}" title="${this.domain}" width="100%"/></a>
<form method="get" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
<label for="show-menu" class="show-menu"><span class="dashicons dashicons-menu"></span></label>
<input type="checkbox" id="show-menu" role="button">
<ul id="mobmenu" class="menu"><li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
</div>

<div class="wrap mobilewrap">
<!-- iklan nya lie atas -->
	
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<div class="global_info">
<span>News</span>
Sedang Proses Re-upload Anime-Anime lama... Jika tidak bisa di Streaming... Harap Bersabar... Ini ujian...</div>
<div id="sct_page">



<div id="sct_content" class="fl mobilewrap">
<!-- iklan nya lie atas -->

	<div class="anm_vid">	
<span class="lightSwitcher">Lights Off</span>
							<h1 style="margin-bottom: 10px;">${data.nameurl} Episode ${eps} Subtitle Indonesia</h1>
<script src="https://apis.google.com/js/platform.js" async defer></script>
<div class="g-plusone fl" data-size="medium" data-href="/anime/${data.nameurl}/${eps}"></div>
<div class="fb-like fl" data-href="/anime/${data.nameurl}/${eps}" data-layout="button_count" data-action="like" data-size="small" data-show-faces="false" data-share="true"></div>
<div class="ep_nav fr">
<span class="nav all"><a href="/anime/${data.nameurl}">See All Episodes</a></span>
${parseInt(eps) - 1 < 1 ? "" : `<span class="nav prev"><a href="/anime/${data.nameurl}/${eps - 1}">« Episode ${eps - 1}</a></span>`}
</div>
<div class="clear"></div>	
	<div class="preview">		
		<iframe src="${urlvid}" frameborder="0" width="100%" height="400" allowfullscreen="allowfullscreen"> </iframe>										
    </div>
<div class="ctr">
	<div class="report">
		<div class="wprc-container yellow">
			<button type="button" onclick="window.location.href='/report'" class="wprc-switch">Report Content</button>
		</div>
			<div class="clear"></div>
			<input type="hidden" class="post-id" value="141884">
			<button type="button" class="wprc-submit">Submit Report</button>
			<img class="loading-img" style="display:none;"
				 src="/wp-content/plugins/report-content/static/img/loading.gif"/>
		</div>
	</div>
	</div><div class="clear"></div>
</div>
</div>
<div class="clear"></div>
<br/>
			<!-- iklan judi bawah -->
<div class="infobox">
<h3>${data.nama}</h3>
<div class="infs">
<img width="193" height="300" src=${data.thumb} class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="" /><div class="r">
<span><b>Type</b>: ${data.type}</span>
<span><b>Episodes</b>: ${data.eps.length}</span>
<span><b>Status</b>: ${data.status === false ? "On Going" : "Complite"}</span>
<span><b>Genre</b>: ${genre}</span>
</div>
</div>
<div class="inr">
<ul id="epl">
${loopeps}
</ul>
</div>
</div>
<h3>Link Download: </h3>
${loopdow}
<br/>
<div style="max-height:32px;overflow:auto;clear:both;font-size:10px;font-family:Arial;width:auto;line-height:16px;border-top:2px solid #171717;border-bottom:2px solid #171717;padding:5px 5px;">
</div>
<br>
<div id="disqus_thread"></div>
</div>
</div>
<div id="sct_sidebar" class="fr">
	<div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div><div class="ctn_side">			<div class="textwidget"></div>
		</div><div class="ctn_side">			<div class="textwidget"><iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FAnimeIndoStream%2F&tabs&width=300&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId=1540873672891974" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
</div>
		</div><div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div>
</ul></div>		
</div></div>

</div>

<div id="footer">
<div class="wrap">
<div class="ftr_wgt">
<div class="anm_wdt">
<h3>${this.domain}</h3>			<div class="textwidget"><p><strong>${this.domain}</strong> adalah website yang menyediakan konten streaming video anime subtittle indonesia dengan koleksi 1000+ judul dari berbagai genre dan tersedia fitur yang mempermudah dalam pencarian anime sesuai keinginan anda. <a href="/anime-list">Anime list</a>, <a href="${this.url}/popular-series">Populer anime</a>, <a href="/genre">Genre</a>.</p>
</div>
		</div>
<div class="anm_wdt">
<h3>Navigasi</h3><div class="menu-footer-menu-container"><ul id="menu-footer-menu" class="menu"><li id="menu-item-616" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-616"><a href="/">Home</a></li>
<li id="menu-item-39" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-39"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-40" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-40"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-41" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41"><a href="/ongoing">Anime Ongoing</a></li>
</ul></div></div>
<div class="credit">
<b>${this.domain}</b> - <b>Nonton Streaming Download Anime Subtitle Indonesia</b> Copyright © 2016 - Powered by <b><a href="" target="_blank">WordPress</a></b> & <b><a href="http://enduser.id/" target="_blank" rel="nofollow">Enduser</a></b> - <b><a href="http://hentaiplus.co/" target="_blank">Streaming Hentai</a></b><br><span>Copyrights and trademarks for the anime, and other promotional materials are held by their respective owners and their use is allowed under the fair use clause of the Copyright Law.</span>
	
</div>
</div>
</div>
<script data-cfasync="false" async type="text/javascript" src="//kiltyyoginis.com/rl3g5o25RWa1PGntH/44701"></script>
</body>
<script type='text/javascript' src='/wp-content/plugins/disqus-comment-system/public/js/comment_embed.js'></script>
<script type='text/javascript' src='/wp-includes/js/wp-embed.min.js'></script>
<script type='text/javascript' src='/wp-content/themes/wibunime/js/search.js'></script>
</html>
<!-- Dynamic page generated in 0.693 seconds. -->
<!-- Cached page generated by WP-Super-Cache on 2021-12-09 16:10:00 -->

<!-- Compression = gzip -->`
		return textnya
	}
	// FUNCTION GET PAGE
	getPageBarOngoing = (page, allpage) => {
		page = page === undefined ? 1 : page
		if (isNaN(page)) {
			page = 1
		}
		var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) - 1}">« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) - 1}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
<span class="page-numbers dots">&hellip;</span>
${allpage === parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${allpage !== parseInt(page) ? `<a class="page-numbers" href="/page/${allpage}">${allpage}</a>` : ``}
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/ongoing/${parseInt(page) + 1}">Next &raquo;</a>`}`
		return textnya
	}
	getPageBarGenre = (page, allpage, type) => {
		page = page === undefined ? 1 : page
		if (isNaN(page)) {
			page = 1
		}
		var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) - 1}">« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) - 1}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage !== parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
<span class="page-numbers dots">&hellip;</span>
${allpage === parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${allpage !== parseInt(page) ? `<a class="page-numbers" href="/genre/${allpage}">${allpage}</a>` : ``}
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/genre/${type}/${parseInt(page) + 1}">Next &raquo;</a>`}`
		return textnya
	}
	getPageBarSearc = (page, allpage, pw) => {
		page = page === undefined ? 1 : page
		if (isNaN(page)) {
			page = 1
		}
		var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/searchanime?query=${pw}/${parseInt(page) - 1}">« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/searchanime?query=${pw}/${parseInt(page) - 1}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/searchanime?query=${pw}/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage !== parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/searchanime?query=${pw}/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/searchanime?query=${pw}/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
<span class="page-numbers dots">&hellip;</span>
${allpage === parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${allpage !== parseInt(page) ? `<a class="page-numbers" href="/searchanime?query=${pw}/${allpage}">${allpage}</a>` : ``}
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/searchanime?query=${pw}/${parseInt(page) + 1}">Next &raquo;</a>`}`
		return textnya
	}
	getPageBar = (page, allpage) => {
		if (isNaN(page)) {
			page = 1
		}
		var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) - 1}">« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) - 1}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage !== parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 1 > allpage - 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage - 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
<span class="page-numbers dots">&hellip;</span>
${allpage - 1 === parseInt(page) ? `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${allpage - 1 !== parseInt(page) ? `<a class="page-numbers" href="/page/${allpage - 1}">${allpage - 1}</a>` : ``}
${parseInt(page) + 1 > allpage - 1 ? `` : `<a class="next page-numbers" href="/page/${parseInt(page) + 1}">Next &raquo;</a>`}</div>`
		return textnya
	}
	//FUNCTION PAGE
	NewrilisPage = (data, page, dataget) => {
		let pageX = page === undefined ? 1 : page
		if (isNaN(page)) {
			pageX = 1
		}
		// NYATU DIA SAMA SEMUANYA TINGGAL GW UBAH UBAH AJA PAKE PAGE TERUS DI KALI , DLL
		// console.log(data.length)
		var textnya = ``
		if (data.length < 13) {
			const filPage = pageX !== 1 ? -1 * 13 * pageX + 1 : 1
			for (let i = data.length - 1; i > -1 * Math.abs(filPage); i--) {
				if (data[i].type === "TV") {
					const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
					const checkFilter = checkNameUrls(data[i].url.replace("/anime/", ""))
					textnya += `<div class="node">
 
<div class="title">${data[i].nama}</div>
<div class="thumbnail">
<a href="${data[i].url}/${data[i].eps}">
<div class="imgthumb">
 <img width="225" height="318" src="`+ thumbC + `" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Shin no Nakama ja Nai to Yuusha no Party wo Oidasareta node" srcset="${thumbC} 225w, ${thumbC} 212w, ${thumbC} 83w" sizes="(max-width: 225px) 100vw, 225px"> </div>
<span class="play"></span>
<span class="sub">${checkFilter.status === false ? "On Going" : "Complite"}</span>
</a></div>
<div class="episode">Episode ${data[i].eps}</div>
<span class="ago"></span>
<h2>${data[i].nama}</h2>
</div>`
				}
			}
			const allPage = data.length / 12
			return { html: textnya, page: Math.ceil(allPage) }
		} else {
			const filPage = pageX !== 1 ? -1 * 13 * pageX + 1 : 1
			const filTot = pageX !== 1 ? 12 * pageX - 1 : 12 - 1
			if (data.length < Math.abs(filPage)) {
				if (filTot - 12 > data.length) return false
				for (let i = data.length - 1; i > filTot - 12; i--) {
					if (data[i].type === "TV") {
						const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
						const checkFilter = checkNameUrls(data[i].url.replace("/anime/", ""))
						textnya += `<div class="node">
 
<div class="title">${data[i].nama}</div>
<div class="thumbnail">
<a href="${data[i].url}/${data[i].eps}">
<div class="imgthumb">
 <img width="225" height="318" src="`+ thumbC + `" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Shin no Nakama ja Nai to Yuusha no Party wo Oidasareta node" srcset="${thumbC} 225w, ${thumbC} 212w, ${thumbC} 83w" sizes="(max-width: 225px) 100vw, 225px"> </div>
<span class="play"></span>
<span class="sub">${checkFilter.status === false ? "On Going" : "Complite"}</span>
</a></div>
<div class="episode">Episode ${data[i].eps}</div>
<span class="ago"></span>
<h2>${data[i].nama}</h2>
</div>`
					}
				}
				const allPage = data.length / 12
				return { html: textnya, page: Math.ceil(allPage) }
			} else {
				for (let i = filTot; i > Math.abs(filTot) - 12; i--) {
					if (data[i].type === "TV") {
						const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
						const checkFilter = checkNameUrls(data[i].url.replace("/anime/", ""))
						textnya += `<div class="node">

<div class="title">${data[i].nama}</div>
<div class="thumbnail">
<a href="${data[i].url}/${data[i].eps}">
<div class="imgthumb">
 <img width="225" height="318" src="`+ thumbC + `" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Shin no Nakama ja Nai to Yuusha no Party wo Oidasareta node" srcset="${thumbC} 225w, ${thumbC} 212w, ${thumbC} 83w" sizes="(max-width: 225px) 100vw, 225px"> </div>
<span class="play"></span>
<span class="sub">${checkFilter.status === false ? "On Going" : "Complite"}</span>
</a></div>
<div class="episode">Episode ${data[i].eps}</div>
<span class="ago"></span>
<h2>${data[i].nama}</h2>
</div>`
					}
				}
				const allPage = data.length / 12
				return { html: textnya, page: Math.ceil(allPage) }
			}
		}
	}
	topviewAnime = (data) => {
		data.sort((a, b) => (a.view < b.view) ? 1 : -1)
		var textnya = ``
		if (data.length < 8) {
			for (let i = 0; i < data.length; i++) {
				textnya += `<div class="node">
 
<div class="title">${data[i].nama}</div>
<div class="thumbnail">
<a href=/anime/${data[i].nameurl}>
<div class="imgthumb">
<img width="193" height="300" src="`+ data[i].thumb + `" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt=""> </div>
</div>
<span class="play"></span>
<span class="sub">${data[i].status === true ? "Complete" : "On Going"}</span>
</a></div>
<div class="episode">${data[i].eps.length} Episode</div>
<span class="ago"></span>
<h2>${data[i].nama}</h2>
</div>`
			}
			return textnya
		} else {
			for (let i = 0; i < 7; i++) {
				textnya += `<div class="node">
 
<div class="title">${data[i].nama}</div>
<div class="thumbnail">
<a href=/anime/${data[i].nameurl}>
<div class="imgthumb">
<img width="193" height="300" src="`+ data[i].thumb + `" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt=""> </div>
<span class="play"></span>
<span class="sub">${data[i].status === true ? "Complete" : "On Going"}</span>
</a></div>
<div class="episode">${data[i].eps.length} Episode</div>
<span class="ago"></span>
<h2>${data[i].nama}</h2>
</div>`
			}
			return textnya
		}
	}

	animeList = (htmlaz) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head profile="http://gmpg.org/xfn/11">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>Anime List - ${this.domain}</title>
<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700,300' rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/wp-content/themes/wibunime/style.css" type="text/css" media="screen" />

<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
<link rel="icon" href="/wp-content/uploads/2016/12/01.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="/wp-content/themes/wibunime/js/jquery.qtip.css" />
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/imagesloaded.pkg.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/light.js"></script>
<!-- matiin load

-->
<script type='text/javascript'>
//<![CDATA[
$(document).ready(function(){
   $("#shadow").css("height", $(document).height()).hide();
   $(".lightSwitcher").click(function(){
      $("#shadow").toggle();
         if ($("#shadow").is(":hidden"))
            $(this).html("Lights Off").removeClass("turnedOff");
         else
            $(this).html("Lights On").addClass("turnedOff");
         });
            
  });
//]]>
</script>
<script type="text/javascript">
	function hidediv(id) {
		document.getElementById(id).style.display = 'none';
	}
</script>

	<!-- This site is optimized with the Yoast SEO plugin v17.5 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	<link rel="canonical" href="/anime-list" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content="Anime List - ${this.domain}" />
	<meta property="og:description" content="Report Content Issue: * Copyright Infringement Spam Invalid Contents Broken Links Your Name: * Your Email: * Details: * Submit Report" />
	<meta property="og:url" content="/anime-list" />
	<meta property="og:site_name" content="${this.domain}" />
	<meta property="article:modified_time" content="2016-12-09T16:00:58+00:00" />
	<meta name="twitter:card" content="summary_large_image" />
	<!-- / Yoast SEO plugin. -->


<link rel='dns-prefetch' href='//s.w.org' />
		<script type="text/javascript">
			window._wpemojiSettings = {"baseUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/72x72\/","ext":".png","svgUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/svg\/","svgExt":".svg","source":{"concatemoji":"\/wp-includes\/js\/wp-emoji-release.min.js"}};
			/*! This file is auto-generated */
			!function(e,a,t){var n,r,o,i=a.createElement("canvas"),p=i.getContext&&i.getContext("2d");function s(e,t){var a=String.fromCharCode;p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,e),0,0);e=i.toDataURL();return p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,t),0,0),e===i.toDataURL()}function c(e){var t=a.createElement("script");t.src=e,t.defer=t.type="text/javascript",a.getElementsByTagName("head")[0].appendChild(t)}for(o=Array("flag","emoji"),t.supports={everything:!0,everythingExceptFlag:!0},r=0;r<o.length;r++)t.supports[o[r]]=function(e){if(!p||!p.fillText)return!1;switch(p.textBaseline="top",p.font="600 32px Arial",e){case"flag":return s([127987,65039,8205,9895,65039],[127987,65039,8203,9895,65039])?!1:!s([55356,56826,55356,56819],[55356,56826,8203,55356,56819])&&!s([55356,57332,56128,56423,56128,56418,56128,56421,56128,56430,56128,56423,56128,56447],[55356,57332,8203,56128,56423,8203,56128,56418,8203,56128,56421,8203,56128,56430,8203,56128,56423,8203,56128,56447]);case"emoji":return!s([55357,56424,55356,57342,8205,55358,56605,8205,55357,56424,55356,57340],[55357,56424,55356,57342,8203,55358,56605,8203,55357,56424,55356,57340])}return!1}(o[r]),t.supports.everything=t.supports.everything&&t.supports[o[r]],"flag"!==o[r]&&(t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&t.supports[o[r]]);t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&!t.supports.flag,t.DOMReady=!1,t.readyCallback=function(){t.DOMReady=!0},t.supports.everything||(n=function(){t.readyCallback()},a.addEventListener?(a.addEventListener("DOMContentLoaded",n,!1),e.addEventListener("load",n,!1)):(e.attachEvent("onload",n),a.attachEvent("onreadystatechange",function(){"complete"===a.readyState&&t.readyCallback()})),(n=t.source||{}).concatemoji?c(n.concatemoji):n.wpemoji&&n.twemoji&&(c(n.twemoji),c(n.wpemoji)))}(window,document,window._wpemojiSettings);
		</script>
		<style type="text/css">
img.wp-smiley,
img.emoji {
	display: inline !important;
	border: none !important;
	box-shadow: none !important;
	height: 1em !important;
	width: 1em !important;
	margin: 0 .07em !important;
	vertical-align: -0.1em !important;
	background: none !important;
	padding: 0 !important;
}
</style>
	<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='wprc-style-css'  href='/wp-content/plugins/report-content/static/css/styles.css' type='text/css' media='all' />
<link rel='stylesheet' id='dashicons-css'  href='/wp-includes/css/dashicons.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='popup-maker-site-css'  href='/wp-content/plugins/popup-maker/assets/css/pum-site.min.css' type='text/css' media='all' />
<style id='popup-maker-site-inline-css' type='text/css'>
/* Popup Google Fonts */
@import url('//fonts.googleapis.com/css?family=Montserrat:100');

/* Popup Theme 141978: Default Theme */
.pum-theme-141978, .pum-theme-default-theme { background-color: rgba( 10, 10, 10, 0.00 ) } 
.pum-theme-141978 .pum-container, .pum-theme-default-theme .pum-container { padding: 1px; border-radius: 4px; border: 1px none #000000; box-shadow: 0px 0px 2px 0px rgba( 2, 2, 2, 0.00 ); background-color: rgba( 10, 10, 10, 1.00 ) } 
.pum-theme-141978 .pum-title, .pum-theme-default-theme .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141978 .pum-content, .pum-theme-default-theme .pum-content { color: #8c8c8c; font-family: inherit; font-weight: 400 } 
.pum-theme-141978 .pum-content + .pum-close, .pum-theme-default-theme .pum-content + .pum-close { position: absolute; height: 34px; width: 69px; left: auto; right: 0px; bottom: auto; top: 0px; padding: 0px; color: #ffffff; font-family: inherit; font-weight: 400; font-size: 12px; line-height: 36px; border: 1px none #ffffff; border-radius: 0px; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 10, 0, 130, 1.00 ) } 

/* Popup Theme 141983: Framed Border */
.pum-theme-141983, .pum-theme-framed-border { background-color: rgba( 255, 255, 255, 0.50 ) } 
.pum-theme-141983 .pum-container, .pum-theme-framed-border .pum-container { padding: 18px; border-radius: 0px; border: 20px outset #dd3333; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.97 ) inset; background-color: rgba( 255, 251, 239, 1.00 ) } 
.pum-theme-141983 .pum-title, .pum-theme-framed-border .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141983 .pum-content, .pum-theme-framed-border .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141983 .pum-content + .pum-close, .pum-theme-framed-border .pum-content + .pum-close { position: absolute; height: 20px; width: 20px; left: auto; right: -20px; bottom: auto; top: -20px; padding: 0px; color: #ffffff; font-family: Tahoma; font-weight: 700; font-size: 16px; line-height: 18px; border: 1px none #ffffff; border-radius: 0px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 0, 0, 0, 0.55 ) } 

/* Popup Theme 141984: Floating Bar - Soft Blue */
.pum-theme-141984, .pum-theme-floating-bar { background-color: rgba( 255, 255, 255, 0.00 ) } 
.pum-theme-141984 .pum-container, .pum-theme-floating-bar .pum-container { padding: 8px; border-radius: 0px; border: 1px none #000000; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.23 ); background-color: rgba( 238, 246, 252, 1.00 ) } 
.pum-theme-141984 .pum-title, .pum-theme-floating-bar .pum-title { color: #505050; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141984 .pum-content, .pum-theme-floating-bar .pum-content { color: #505050; font-family: inherit; font-weight: 400 } 
.pum-theme-141984 .pum-content + .pum-close, .pum-theme-floating-bar .pum-content + .pum-close { position: absolute; height: 18px; width: 18px; left: auto; right: 5px; bottom: auto; top: 50%; padding: 0px; color: #505050; font-family: Sans-Serif; font-weight: 700; font-size: 15px; line-height: 18px; border: 1px solid #505050; border-radius: 15px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.00 ); background-color: rgba( 255, 255, 255, 0.00 ); transform: translate(0, -50%) } 

/* Popup Theme 141985: Content Only - For use with page builders or block editor */
.pum-theme-141985, .pum-theme-content-only { background-color: rgba( 0, 0, 0, 0.70 ) } 
.pum-theme-141985 .pum-container, .pum-theme-content-only .pum-container { padding: 0px; border-radius: 0px; border: 1px none #000000; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ) } 
.pum-theme-141985 .pum-title, .pum-theme-content-only .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141985 .pum-content, .pum-theme-content-only .pum-content { color: #8c8c8c; font-family: inherit; font-weight: 400 } 
.pum-theme-141985 .pum-content + .pum-close, .pum-theme-content-only .pum-content + .pum-close { position: absolute; height: 18px; width: 18px; left: auto; right: 7px; bottom: auto; top: 7px; padding: 0px; color: #000000; font-family: inherit; font-weight: 700; font-size: 20px; line-height: 20px; border: 1px none #ffffff; border-radius: 15px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.00 ); background-color: rgba( 255, 255, 255, 0.00 ) } 

/* Popup Theme 141979: Light Box */
.pum-theme-141979, .pum-theme-lightbox { background-color: rgba( 0, 0, 0, 0.60 ) } 
.pum-theme-141979 .pum-container, .pum-theme-lightbox .pum-container { padding: 18px; border-radius: 3px; border: 8px solid #000000; box-shadow: 0px 0px 30px 0px rgba( 2, 2, 2, 1.00 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141979 .pum-title, .pum-theme-lightbox .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141979 .pum-content, .pum-theme-lightbox .pum-content { color: #000000; font-family: inherit; font-weight: 100 } 
.pum-theme-141979 .pum-content + .pum-close, .pum-theme-lightbox .pum-content + .pum-close { position: absolute; height: 26px; width: 26px; left: auto; right: -13px; bottom: auto; top: -13px; padding: 0px; color: #ffffff; font-family: Arial; font-weight: 100; font-size: 24px; line-height: 24px; border: 2px solid #ffffff; border-radius: 26px; box-shadow: 0px 0px 15px 1px rgba( 2, 2, 2, 0.75 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 0, 0, 0, 1.00 ) } 

/* Popup Theme 141980: Enterprise Blue */
.pum-theme-141980, .pum-theme-enterprise-blue { background-color: rgba( 0, 0, 0, 0.70 ) } 
.pum-theme-141980 .pum-container, .pum-theme-enterprise-blue .pum-container { padding: 28px; border-radius: 5px; border: 1px none #000000; box-shadow: 0px 10px 25px 4px rgba( 2, 2, 2, 0.50 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141980 .pum-title, .pum-theme-enterprise-blue .pum-title { color: #315b7c; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 34px; line-height: 36px } 
.pum-theme-141980 .pum-content, .pum-theme-enterprise-blue .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141980 .pum-content + .pum-close, .pum-theme-enterprise-blue .pum-content + .pum-close { position: absolute; height: 28px; width: 28px; left: auto; right: 8px; bottom: auto; top: 8px; padding: 4px; color: #ffffff; font-family: Times New Roman; font-weight: 100; font-size: 20px; line-height: 20px; border: 1px none #ffffff; border-radius: 42px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 49, 91, 124, 1.00 ) } 

/* Popup Theme 141981: Hello Box */
.pum-theme-141981, .pum-theme-hello-box { background-color: rgba( 0, 0, 0, 0.75 ) } 
.pum-theme-141981 .pum-container, .pum-theme-hello-box .pum-container { padding: 30px; border-radius: 80px; border: 14px solid #81d742; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141981 .pum-title, .pum-theme-hello-box .pum-title { color: #2d2d2d; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: Montserrat; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141981 .pum-content, .pum-theme-hello-box .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141981 .pum-content + .pum-close, .pum-theme-hello-box .pum-content + .pum-close { position: absolute; height: auto; width: auto; left: auto; right: -30px; bottom: auto; top: -30px; padding: 0px; color: #2d2d2d; font-family: Times New Roman; font-weight: 100; font-size: 32px; line-height: 28px; border: 1px none #ffffff; border-radius: 28px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 255, 255, 255, 1.00 ) } 

/* Popup Theme 141982: Cutting Edge */
.pum-theme-141982, .pum-theme-cutting-edge { background-color: rgba( 0, 0, 0, 0.50 ) } 
.pum-theme-141982 .pum-container, .pum-theme-cutting-edge .pum-container { padding: 18px; border-radius: 0px; border: 1px none #000000; box-shadow: 0px 10px 25px 0px rgba( 2, 2, 2, 0.50 ); background-color: rgba( 30, 115, 190, 1.00 ) } 
.pum-theme-141982 .pum-title, .pum-theme-cutting-edge .pum-title { color: #ffffff; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: Sans-Serif; font-weight: 100; font-size: 26px; line-height: 28px } 
.pum-theme-141982 .pum-content, .pum-theme-cutting-edge .pum-content { color: #ffffff; font-family: inherit; font-weight: 100 } 
.pum-theme-141982 .pum-content + .pum-close, .pum-theme-cutting-edge .pum-content + .pum-close { position: absolute; height: 24px; width: 24px; left: auto; right: 0px; bottom: auto; top: 0px; padding: 0px; color: #1e73be; font-family: Times New Roman; font-weight: 100; font-size: 32px; line-height: 24px; border: 1px none #ffffff; border-radius: 0px; box-shadow: -1px 1px 1px 0px rgba( 2, 2, 2, 0.10 ); text-shadow: -1px 1px 1px rgba( 0, 0, 0, 0.10 ); background-color: rgba( 238, 238, 34, 1.00 ) } 

#pum-141987 {z-index: 1999999999}
#pum-141986 {z-index: 1999999999}

</style>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js'></script>
<script type='text/javascript' src='/wp-content/plugins/report-content/static/js/scripts.js'></script>
<meta name="generator" content="WordPress 5.4.8" />
		<style>body {
    background: url(/wp-content/uploads/2018/08/warna.png) no-repeat fixed #0a0a0a;
    background-size: 105%;
    background-position:top center;
    color:#d6d6d6;
}
#sct_banner_top img, #sct_banner img {max-width: 728px;height: 90px;}
#sct_logo img {max-width: 220px;height: auto;}
#myElement {width: 100%;height: 100%;position: absolute !important;margin: 0 !important;top: 0;left: 0;}
.jw-preview, .jw-captions, .jw-title, .jw-overlays, .jw-controls {z-index: 105;}
.videoads iframe {position: relative !important;}
.report{position:relative;float:right;margin-right:5px}
.wprc-container{margin:6px 0 0!important}
button.wprc-switch{padding: 4px 7px; background:#003a59!important;min-width:auto!important;color:#cfcfcf!important;border:1px solid #003a59!important}
.wprc-container .wprc-content{background:#1b1b1b!important;border-top:4px solid #3c3b36!important;box-shadow:0 0 5px #000!important}
@media only screen and ( max-width: 750px ) {
.report{position:relative;float:none;margin-right:0;height:25px}
.wprc-container{margin:6px 0 0!important;width:100%!important}
button.wprc-switch{width:100%!important}
}
#sct_page{background-color:rgba(0,0,0,0.8);padding:15px;border:1px solid #323232;margin:0 0 10px;overflow:hidden;border-radius: 10px;}</style>
<style>
.ctn_side ul {padding-left: 15px;line-height: 18px;}
</style>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-77285272-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-77285272-1');
</script>

<!--  ad tags Size: 320x50 ZoneId:1127811 -->
<!--  -->

<!--  -->



<style>
span.jwcontrols {
    z-index: 105 !important;
}
</style>

</head>

<body data-rsssl=1>
<div id='shadow'></div>
	
<div id="sct_top"><div class="wrap"> <span id="sct_welcome" class="fl">Selamat datang di ${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</span> <span id="sct_recommended" class="fr"><div class="textwidget"><span style="color: #0077b6"><strong>Browse:</strong></span>&nbsp;<strong> <a href="/anime-list/#%23">#</a> <a href="/anime-list/#A">A</a> <a href="/anime-list/#B">B</a> <a href="/anime-list/#C">C</a> <a href="/anime-list/#D">D</a> <a href="/anime-list/#E">E</a> <a href="/anime-list/#F">F</a> <a href="/anime-list/#G">G</a> <a href="/anime-list/#H">H</a> <a href="/anime-list/#I">I</a> <a href="/anime-list/#J">J</a> <a href="/anime-list/#K">K</a> <a href="/anime-list/#L">L</a> <a href="/anime-list/#M">M</a> <a href="/anime-list/#N">N</a> <a href="/anime-list/#O">O</a> <a href="/anime-list/#P">P</a> <a href="/anime-list/#Q">Q</a> <a href="/anime-list/#R">R</a> <a href="/anime-list/#S">S</a> <a href="/anime-list/#T">T</a> <a href="/anime-list/#U">U</a> <a href="/anime-list/#V">V</a> <a href="/anime-list/#W">W</a> <a href="/anime-list/#X">X</a> <a href="/anime-list/#Y">Y</a> <a href="/anime-list/#Z">Z</a></strong></div> </span></div></div>
<div id="sct_head">
<div class="wrap">
<a href="/" id="sct_logo" class="fl"><img src="/wp-content/themes/wibunime/img/logo.png" alt="Logo" title="${this.domain}"></a>
<div id="sct_banner_top" class="fr"><a href="https://cutt.ly/nontonanime" target="_blank" rel="nofollow"><img class="alignnone size-full wp-image-141557" src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="" width="728" height="90" /></a> </div></div>
</div>
<div id="sct_menu_area">
<div class="wrap">
<div class="mainx">
<div id="sct_menu">
<ul id="deskmenu" class="menu"><li id="menu-item-16" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li id="menu-item-15" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-13 current_page_item menu-item-15"><a href="/anime-list" aria-current="page">Anime List</a></li>
<li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-18" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
<div class="search-block">
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
</div>
</div>
</div>
</div>

<div id="ninemobile">
<div class="mainx">
<!-- ads lie -->
<a href="https://cutt.ly/nontonanime" target="_blank" rel="nofollow"><img src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="${this.domain}" title="${this.domain}" width="100%"/></a>
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
<label for="show-menu" class="show-menu"><span class="dashicons dashicons-menu"></span></label>
<input type="checkbox" id="show-menu" role="button">
<ul id="mobmenu" class="menu"><li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-13 current_page_item menu-item-15"><a href="/anime-list" aria-current="page">Anime List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a >Movie List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
</div>

<div class="wrap mobilewrap">
<!-- iklan nya lie atas -->
	
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<div class="global_info">
<span>News</span>
Sedang Proses Re-upload Anime-Anime lama... Jika tidak bisa di Streaming... Harap Bersabar... Ini ujian...</div>
<div id="sct_page">



<div id="sct_content" class="fl">
<h1>Anime List</h1>
<div class="list">
	             
	<div class="nav_apb"> <a href="#1">1</a> <a href="#%23">#</a> <a href="#A">A</a> <a href="#B">B</a> <a href="#C">C</a> <a href="#D">D</a> <a href="#E">E</a> <a href="#F">F</a> <a href="#G">G</a> <a href="#H">H</a> <a href="#I">I</a> <a href="#J">J</a> <a href="#K">K</a> <a href="#L">L</a> <a href="#M">M</a> <a href="#N">N</a> <a href="#O">O</a> <a href="#P">P</a> <a href="#Q">Q</a> <a href="#R">R</a> <a href="#S">S</a> <a href="#T">T</a> <a href="#U">U</a> <a href="#V">V</a> <a href="#W">W</a> <a href="#X">X</a> <a href="#Y">Y</a> <a href="#Z">Z</a><div class="clear"></div></div>
	${htmlaz}
			</div>
</div>

<div id="sct_sidebar" class="fr">
	<div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div><div class="ctn_side">			<div class="textwidget"></div>
		</div><div class="ctn_side">			<div class="textwidget"><iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FAnimeIndoStream%2F&tabs&width=300&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId=1540873672891974" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
</div>
		</div><div class="ctn_side">			<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p>
</div>
		</div>
</div></div>

</div>

<div id="footer">
<div class="wrap">
<div class="ftr_wgt">
<div class="anm_wdt">
<h3>${this.domain}</h3>			<div class="textwidget"><p><strong>${this.domain}</strong> adalah website yang menyediakan konten streaming video anime subtittle indonesia dengan koleksi 1000+ judul dari berbagai genre dan tersedia fitur yang mempermudah dalam pencarian anime sesuai keinginan anda. <a href="/anime-list">Anime list</a>, <a href="${this.url}/popular-series">Populer anime</a>, <a href="/genre">Genre</a>.</p>
</div>
		</div>
<div class="anm_wdt">
<h3>Navigasi</h3><div class="menu-footer-menu-container"><ul id="menu-footer-menu" class="menu"><li id="menu-item-616" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-616"><a href="/">Home</a></li>
<li id="menu-item-39" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-39"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-40" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-40"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-41" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41"><a href="/ongoing">Anime Ongoing</a></li>
</ul></div></div>
</div>
<div class="credit">
<b>${this.domain}</b> - <b>Nonton Streaming Download Anime Subtitle Indonesia</b> Copyright © 2016 - Powered by <b><a href="" target="_blank">WordPress</a></b> & <b><a href="http://enduser.id/" target="_blank" rel="nofollow">Enduser</a></b> - <b><a href="http://hentaiplus.co/" target="_blank">Streaming Hentai</a></b><br><span>Copyrights and trademarks for the anime, and other promotional materials are held by their respective owners and their use is allowed under the fair use clause of the Copyright Law.</span>
	
</div>
</div>
</div>
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script data-cfasync="false" async type="text/javascript" src="//kiltyyoginis.com/rl3g5o25RWa1PGntH/44701"></script>
</body>
<div id="pum-141987" class="pum pum-overlay pum-theme-141978 pum-theme-default-theme popmake-overlay auto_open click_open" data-popmake="{&quot;id&quot;:141987,&quot;slug&quot;:&quot;1&quot;,&quot;theme_id&quot;:141978,&quot;cookies&quot;:[],&quot;triggers&quot;:[{&quot;type&quot;:&quot;auto_open&quot;,&quot;settings&quot;:{&quot;cookie_name&quot;:&quot;&quot;,&quot;delay&quot;:&quot;500&quot;}},{&quot;type&quot;:&quot;click_open&quot;,&quot;settings&quot;:{&quot;extra_selectors&quot;:&quot;&quot;,&quot;cookie_name&quot;:null}}],&quot;mobile_disabled&quot;:null,&quot;tablet_disabled&quot;:null,&quot;meta&quot;:{&quot;display&quot;:{&quot;stackable&quot;:false,&quot;overlay_disabled&quot;:false,&quot;scrollable_content&quot;:false,&quot;disable_reposition&quot;:false,&quot;size&quot;:&quot;auto&quot;,&quot;responsive_min_width&quot;:&quot;100%&quot;,&quot;responsive_min_width_unit&quot;:false,&quot;responsive_max_width&quot;:&quot;100%&quot;,&quot;responsive_max_width_unit&quot;:false,&quot;custom_width&quot;:&quot;640px&quot;,&quot;custom_width_unit&quot;:false,&quot;custom_height&quot;:&quot;640px&quot;,&quot;custom_height_unit&quot;:false,&quot;custom_height_auto&quot;:false,&quot;location&quot;:&quot;center&quot;,&quot;position_from_trigger&quot;:false,&quot;position_top&quot;:&quot;100&quot;,&quot;position_left&quot;:&quot;0&quot;,&quot;position_bottom&quot;:&quot;0&quot;,&quot;position_right&quot;:&quot;0&quot;,&quot;position_fixed&quot;:false,&quot;animation_type&quot;:&quot;fade&quot;,&quot;animation_speed&quot;:&quot;350&quot;,&quot;animation_origin&quot;:&quot;center top&quot;,&quot;overlay_zindex&quot;:false,&quot;zindex&quot;:&quot;1999999999&quot;},&quot;close&quot;:{&quot;text&quot;:&quot;Close&quot;,&quot;button_delay&quot;:&quot;0&quot;,&quot;overlay_click&quot;:false,&quot;esc_press&quot;:false,&quot;f4_press&quot;:false},&quot;click_open&quot;:[]}}" role="dialog" aria-hidden="true" >

	<div id="popmake-141987" class="pum-container popmake theme-141978">

				

				

		

				<div class="pum-content popmake-content" tabindex="0">
			<p><a href="https://bit.ly/animeidn" target="_blank" rel="noopener noreferrer"><img class="size-full aligncenter" src="/wp-content/uploads/01.webp" alt="KW88_01" width="100%" /></a></p>
		</div>


				

				            <button type="button" class="pum-close popmake-close" aria-label="Close">
			Close            </button>
		
	</div>

</div>
<script type='text/javascript' src='/wp-includes/js/jquery/ui/core.min.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/ui/position.min.js'></script>
<script type='text/javascript' src='/wp-content/plugins/popup-maker/assets/js/site.min.js'></script>
<script type='text/javascript' src='/wp-includes/js/wp-embed.min.js'></script>
<script type='text/javascript' src='/wp-content/themes/wibunime/js/search.js'></script>
</html>
<!-- Dynamic page generated in 1.265 seconds. -->
<!-- Cached page generated by WP-Super-Cache on 2021-12-14 13:58:03 -->

<!-- Compression = gzip -->`

	genreHtml = (genremove, bargenre, type) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head profile="http://gmpg.org/xfn/11">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>Action Archives - ${this.domain}</title>
<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700,300' rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/wp-content/themes/wibunime/style.css" type="text/css" media="screen" />

<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
<link rel="icon" href="/wp-content/uploads/2016/12/01.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="/wp-content/themes/wibunime/js/jquery.qtip.css" />
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/jquery.qtip.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/imagesloaded.pkg.min.js"></script>
<script type="text/javascript" src="/wp-content/themes/wibunime/js/light.js"></script>
<!-- matiin load

-->
<script type='text/javascript'>
//<![CDATA[
$(document).ready(function(){
   $("#shadow").css("height", $(document).height()).hide();
   $(".lightSwitcher").click(function(){
      $("#shadow").toggle();
         if ($("#shadow").is(":hidden"))
            $(this).html("Lights Off").removeClass("turnedOff");
         else
            $(this).html("Lights On").addClass("turnedOff");
         });
            
  });
//]]>
</script>
<script type="text/javascript">
	function hidediv(id) {
		document.getElementById(id).style.display = 'none';
	}
</script>

	<!-- This site is optimized with the Yoast SEO plugin v17.5 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	<link rel="canonical" href="${this.url}/genres/action" />
	<link rel="next" href="${this.url}/genres/action/page/2" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content="Action Archives - ${this.domain}" />
	<meta property="og:url" content="${this.url}/genres/action" />
	<meta property="og:site_name" content="${this.domain}" />
	<meta name="twitter:card" content="summary_large_image" />	
	<!-- / Yoast SEO plugin. -->


<link rel='dns-prefetch' href='//s.w.org' />
<link rel="alternate" type="application/rss+xml" title="${this.domain} &raquo; Action Genres Feed" href="${this.url}/genres/action/feed" />
		<script type="text/javascript">
			window._wpemojiSettings = {"baseUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/72x72\/","ext":".png","svgUrl":"https:\/\/s.w.org\/images\/core\/emoji\/12.0.0-1\/svg\/","svgExt":".svg","source":{"concatemoji":"https:\/\/${this.domain}\/wp-includes\/js\/wp-emoji-release.min.js"}};
			/*! This file is auto-generated */
			!function(e,a,t){var n,r,o,i=a.createElement("canvas"),p=i.getContext&&i.getContext("2d");function s(e,t){var a=String.fromCharCode;p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,e),0,0);e=i.toDataURL();return p.clearRect(0,0,i.width,i.height),p.fillText(a.apply(this,t),0,0),e===i.toDataURL()}function c(e){var t=a.createElement("script");t.src=e,t.defer=t.type="text/javascript",a.getElementsByTagName("head")[0].appendChild(t)}for(o=Array("flag","emoji"),t.supports={everything:!0,everythingExceptFlag:!0},r=0;r<o.length;r++)t.supports[o[r]]=function(e){if(!p||!p.fillText)return!1;switch(p.textBaseline="top",p.font="600 32px Arial",e){case"flag":return s([127987,65039,8205,9895,65039],[127987,65039,8203,9895,65039])?!1:!s([55356,56826,55356,56819],[55356,56826,8203,55356,56819])&&!s([55356,57332,56128,56423,56128,56418,56128,56421,56128,56430,56128,56423,56128,56447],[55356,57332,8203,56128,56423,8203,56128,56418,8203,56128,56421,8203,56128,56430,8203,56128,56423,8203,56128,56447]);case"emoji":return!s([55357,56424,55356,57342,8205,55358,56605,8205,55357,56424,55356,57340],[55357,56424,55356,57342,8203,55358,56605,8203,55357,56424,55356,57340])}return!1}(o[r]),t.supports.everything=t.supports.everything&&t.supports[o[r]],"flag"!==o[r]&&(t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&t.supports[o[r]]);t.supports.everythingExceptFlag=t.supports.everythingExceptFlag&&!t.supports.flag,t.DOMReady=!1,t.readyCallback=function(){t.DOMReady=!0},t.supports.everything||(n=function(){t.readyCallback()},a.addEventListener?(a.addEventListener("DOMContentLoaded",n,!1),e.addEventListener("load",n,!1)):(e.attachEvent("onload",n),a.attachEvent("onreadystatechange",function(){"complete"===a.readyState&&t.readyCallback()})),(n=t.source||{}).concatemoji?c(n.concatemoji):n.wpemoji&&n.twemoji&&(c(n.twemoji),c(n.wpemoji)))}(window,document,window._wpemojiSettings);
		</script>
		<style type="text/css">
img.wp-smiley,
img.emoji {
	display: inline !important;
	border: none !important;
	box-shadow: none !important;
	height: 1em !important;
	width: 1em !important;
	margin: 0 .07em !important;
	vertical-align: -0.1em !important;
	background: none !important;
	padding: 0 !important;
}
</style>
	<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='wprc-style-css'  href='/wp-content/plugins/report-content/static/css/styles.css' type='text/css' media='all' />
<link rel='stylesheet' id='dashicons-css'  href='/wp-includes/css/dashicons.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='popup-maker-site-css'  href='/wp-content/plugins/popup-maker/assets/css/pum-site.min.' type='text/css' media='all' />
<style id='popup-maker-site-inline-css' type='text/css'>
/* Popup Google Fonts */
@import url('//fonts.googleapis.com/css?family=Montserrat:100');

/* Popup Theme 141978: Default Theme */
.pum-theme-141978, .pum-theme-default-theme { background-color: rgba( 10, 10, 10, 0.00 ) } 
.pum-theme-141978 .pum-container, .pum-theme-default-theme .pum-container { padding: 1px; border-radius: 4px; border: 1px none #000000; box-shadow: 0px 0px 2px 0px rgba( 2, 2, 2, 0.00 ); background-color: rgba( 10, 10, 10, 1.00 ) } 
.pum-theme-141978 .pum-title, .pum-theme-default-theme .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141978 .pum-content, .pum-theme-default-theme .pum-content { color: #8c8c8c; font-family: inherit; font-weight: 400 } 
.pum-theme-141978 .pum-content + .pum-close, .pum-theme-default-theme .pum-content + .pum-close { position: absolute; height: 34px; width: 69px; left: auto; right: 0px; bottom: auto; top: 0px; padding: 0px; color: #ffffff; font-family: inherit; font-weight: 400; font-size: 12px; line-height: 36px; border: 1px none #ffffff; border-radius: 0px; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 10, 0, 130, 1.00 ) } 

/* Popup Theme 141983: Framed Border */
.pum-theme-141983, .pum-theme-framed-border { background-color: rgba( 255, 255, 255, 0.50 ) } 
.pum-theme-141983 .pum-container, .pum-theme-framed-border .pum-container { padding: 18px; border-radius: 0px; border: 20px outset #dd3333; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.97 ) inset; background-color: rgba( 255, 251, 239, 1.00 ) } 
.pum-theme-141983 .pum-title, .pum-theme-framed-border .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141983 .pum-content, .pum-theme-framed-border .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141983 .pum-content + .pum-close, .pum-theme-framed-border .pum-content + .pum-close { position: absolute; height: 20px; width: 20px; left: auto; right: -20px; bottom: auto; top: -20px; padding: 0px; color: #ffffff; font-family: Tahoma; font-weight: 700; font-size: 16px; line-height: 18px; border: 1px none #ffffff; border-radius: 0px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 0, 0, 0, 0.55 ) } 

/* Popup Theme 141984: Floating Bar - Soft Blue */
.pum-theme-141984, .pum-theme-floating-bar { background-color: rgba( 255, 255, 255, 0.00 ) } 
.pum-theme-141984 .pum-container, .pum-theme-floating-bar .pum-container { padding: 8px; border-radius: 0px; border: 1px none #000000; box-shadow: 1px 1px 3px 0px rgba( 2, 2, 2, 0.23 ); background-color: rgba( 238, 246, 252, 1.00 ) } 
.pum-theme-141984 .pum-title, .pum-theme-floating-bar .pum-title { color: #505050; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141984 .pum-content, .pum-theme-floating-bar .pum-content { color: #505050; font-family: inherit; font-weight: 400 } 
.pum-theme-141984 .pum-content + .pum-close, .pum-theme-floating-bar .pum-content + .pum-close { position: absolute; height: 18px; width: 18px; left: auto; right: 5px; bottom: auto; top: 50%; padding: 0px; color: #505050; font-family: Sans-Serif; font-weight: 700; font-size: 15px; line-height: 18px; border: 1px solid #505050; border-radius: 15px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.00 ); background-color: rgba( 255, 255, 255, 0.00 ); transform: translate(0, -50%) } 

/* Popup Theme 141985: Content Only - For use with page builders or block editor */
.pum-theme-141985, .pum-theme-content-only { background-color: rgba( 0, 0, 0, 0.70 ) } 
.pum-theme-141985 .pum-container, .pum-theme-content-only .pum-container { padding: 0px; border-radius: 0px; border: 1px none #000000; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ) } 
.pum-theme-141985 .pum-title, .pum-theme-content-only .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 400; font-size: 32px; line-height: 36px } 
.pum-theme-141985 .pum-content, .pum-theme-content-only .pum-content { color: #8c8c8c; font-family: inherit; font-weight: 400 } 
.pum-theme-141985 .pum-content + .pum-close, .pum-theme-content-only .pum-content + .pum-close { position: absolute; height: 18px; width: 18px; left: auto; right: 7px; bottom: auto; top: 7px; padding: 0px; color: #000000; font-family: inherit; font-weight: 700; font-size: 20px; line-height: 20px; border: 1px none #ffffff; border-radius: 15px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.00 ); background-color: rgba( 255, 255, 255, 0.00 ) } 

/* Popup Theme 141979: Light Box */
.pum-theme-141979, .pum-theme-lightbox { background-color: rgba( 0, 0, 0, 0.60 ) } 
.pum-theme-141979 .pum-container, .pum-theme-lightbox .pum-container { padding: 18px; border-radius: 3px; border: 8px solid #000000; box-shadow: 0px 0px 30px 0px rgba( 2, 2, 2, 1.00 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141979 .pum-title, .pum-theme-lightbox .pum-title { color: #000000; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141979 .pum-content, .pum-theme-lightbox .pum-content { color: #000000; font-family: inherit; font-weight: 100 } 
.pum-theme-141979 .pum-content + .pum-close, .pum-theme-lightbox .pum-content + .pum-close { position: absolute; height: 26px; width: 26px; left: auto; right: -13px; bottom: auto; top: -13px; padding: 0px; color: #ffffff; font-family: Arial; font-weight: 100; font-size: 24px; line-height: 24px; border: 2px solid #ffffff; border-radius: 26px; box-shadow: 0px 0px 15px 1px rgba( 2, 2, 2, 0.75 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 0, 0, 0, 1.00 ) } 

/* Popup Theme 141980: Enterprise Blue */
.pum-theme-141980, .pum-theme-enterprise-blue { background-color: rgba( 0, 0, 0, 0.70 ) } 
.pum-theme-141980 .pum-container, .pum-theme-enterprise-blue .pum-container { padding: 28px; border-radius: 5px; border: 1px none #000000; box-shadow: 0px 10px 25px 4px rgba( 2, 2, 2, 0.50 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141980 .pum-title, .pum-theme-enterprise-blue .pum-title { color: #315b7c; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: inherit; font-weight: 100; font-size: 34px; line-height: 36px } 
.pum-theme-141980 .pum-content, .pum-theme-enterprise-blue .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141980 .pum-content + .pum-close, .pum-theme-enterprise-blue .pum-content + .pum-close { position: absolute; height: 28px; width: 28px; left: auto; right: 8px; bottom: auto; top: 8px; padding: 4px; color: #ffffff; font-family: Times New Roman; font-weight: 100; font-size: 20px; line-height: 20px; border: 1px none #ffffff; border-radius: 42px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 49, 91, 124, 1.00 ) } 

/* Popup Theme 141981: Hello Box */
.pum-theme-141981, .pum-theme-hello-box { background-color: rgba( 0, 0, 0, 0.75 ) } 
.pum-theme-141981 .pum-container, .pum-theme-hello-box .pum-container { padding: 30px; border-radius: 80px; border: 14px solid #81d742; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.00 ); background-color: rgba( 255, 255, 255, 1.00 ) } 
.pum-theme-141981 .pum-title, .pum-theme-hello-box .pum-title { color: #2d2d2d; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: Montserrat; font-weight: 100; font-size: 32px; line-height: 36px } 
.pum-theme-141981 .pum-content, .pum-theme-hello-box .pum-content { color: #2d2d2d; font-family: inherit; font-weight: 100 } 
.pum-theme-141981 .pum-content + .pum-close, .pum-theme-hello-box .pum-content + .pum-close { position: absolute; height: auto; width: auto; left: auto; right: -30px; bottom: auto; top: -30px; padding: 0px; color: #2d2d2d; font-family: Times New Roman; font-weight: 100; font-size: 32px; line-height: 28px; border: 1px none #ffffff; border-radius: 28px; box-shadow: 0px 0px 0px 0px rgba( 2, 2, 2, 0.23 ); text-shadow: 0px 0px 0px rgba( 0, 0, 0, 0.23 ); background-color: rgba( 255, 255, 255, 1.00 ) } 

/* Popup Theme 141982: Cutting Edge */
.pum-theme-141982, .pum-theme-cutting-edge { background-color: rgba( 0, 0, 0, 0.50 ) } 
.pum-theme-141982 .pum-container, .pum-theme-cutting-edge .pum-container { padding: 18px; border-radius: 0px; border: 1px none #000000; box-shadow: 0px 10px 25px 0px rgba( 2, 2, 2, 0.50 ); background-color: rgba( 30, 115, 190, 1.00 ) } 
.pum-theme-141982 .pum-title, .pum-theme-cutting-edge .pum-title { color: #ffffff; text-align: left; text-shadow: 0px 0px 0px rgba( 2, 2, 2, 0.23 ); font-family: Sans-Serif; font-weight: 100; font-size: 26px; line-height: 28px } 
.pum-theme-141982 .pum-content, .pum-theme-cutting-edge .pum-content { color: #ffffff; font-family: inherit; font-weight: 100 } 
.pum-theme-141982 .pum-content + .pum-close, .pum-theme-cutting-edge .pum-content + .pum-close { position: absolute; height: 24px; width: 24px; left: auto; right: 0px; bottom: auto; top: 0px; padding: 0px; color: #1e73be; font-family: Times New Roman; font-weight: 100; font-size: 32px; line-height: 24px; border: 1px none #ffffff; border-radius: 0px; box-shadow: -1px 1px 1px 0px rgba( 2, 2, 2, 0.10 ); text-shadow: -1px 1px 1px rgba( 0, 0, 0, 0.10 ); background-color: rgba( 238, 238, 34, 1.00 ) } 

#pum-141987 {z-index: 1999999999}
#pum-141986 {z-index: 1999999999}

</style>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js'></script>
<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js'></script>
<script type='text/javascript'>
/* <![CDATA[ */
/* ]]> */
</script>
<script type='text/javascript' src='/wp-content/plugins/report-content/static/js/scripts.js'></script>
<meta name="generator" content="WordPress 5.4.8" />
		<style>body {
    background: url(/wp-content/uploads/2018/08/warna.png) no-repeat fixed #0a0a0a;
    background-size: 105%;
    background-position:top center;
    color:#d6d6d6;
}
#sct_banner_top img, #sct_banner img {max-width: 728px;height: 90px;}
#sct_logo img {max-width: 220px;height: auto;}
#myElement {width: 100%;height: 100%;position: absolute !important;margin: 0 !important;top: 0;left: 0;}
.jw-preview, .jw-captions, .jw-title, .jw-overlays, .jw-controls {z-index: 105;}
.videoads iframe {position: relative !important;}
.report{position:relative;float:right;margin-right:5px}
.wprc-container{margin:6px 0 0!important}
button.wprc-switch{padding: 4px 7px; background:#003a59!important;min-width:auto!important;color:#cfcfcf!important;border:1px solid #003a59!important}
.wprc-container .wprc-content{background:#1b1b1b!important;border-top:4px solid #3c3b36!important;box-shadow:0 0 5px #000!important}
@media only screen and ( max-width: 750px ) {
.report{position:relative;float:none;margin-right:0;height:25px}
.wprc-container{margin:6px 0 0!important;width:100%!important}
button.wprc-switch{width:100%!important}
}
#sct_page{background-color:rgba(0,0,0,0.8);padding:15px;border:1px solid #323232;margin:0 0 10px;overflow:hidden;border-radius: 10px;}</style>
<style>
.ctn_side ul {padding-left: 15px;line-height: 18px;}
</style>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-77285272-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-77285272-1');
</script>

<!--  ad tags Size: 320x50 ZoneId:1127811 -->
<!--  -->

<!--  -->



<style>
span.jwcontrols {
    z-index: 105 !important;
}
</style>

</head>

<body data-rsssl=1>
<div id='shadow'></div>
	
<div id="sct_top"><div class="wrap"> <span id="sct_welcome" class="fl">Selamat datang di ${this.domain} - Nonton Streaming Download Anime Subtitle Indonesia</span> <span id="sct_recommended" class="fr"><div class="textwidget"><span style="color: #0077b6"><strong>Browse:</strong></span>&nbsp;<strong> <a href="/anime-list/#%23">#</a> <a href="/anime-list/#A">A</a> <a href="/anime-list/#B">B</a> <a href="/anime-list/#C">C</a> <a href="/anime-list/#D">D</a> <a href="/anime-list/#E">E</a> <a href="/anime-list/#F">F</a> <a href="/anime-list/#G">G</a> <a href="/anime-list/#H">H</a> <a href="/anime-list/#I">I</a> <a href="/anime-list/#J">J</a> <a href="/anime-list/#K">K</a> <a href="/anime-list/#L">L</a> <a href="/anime-list/#M">M</a> <a href="/anime-list/#N">N</a> <a href="/anime-list/#O">O</a> <a href="/anime-list/#P">P</a> <a href="/anime-list/#Q">Q</a> <a href="/anime-list/#R">R</a> <a href="/anime-list/#S">S</a> <a href="/anime-list/#T">T</a> <a href="/anime-list/#U">U</a> <a href="/anime-list/#V">V</a> <a href="/anime-list/#W">W</a> <a href="/anime-list/#X">X</a> <a href="/anime-list/#Y">Y</a> <a href="/anime-list/#Z">Z</a></strong></div> </span></div></div>
<div id="sct_head">
<div class="wrap">
<a href="/" id="sct_logo" class="fl"><img src="/wp-content/themes/wibunime/img/logo.png" alt="Logo" title="${this.domain}"></a>
<div id="sct_banner_top" class="fr"><a href="https://cutt.ly/nontonanime" target="_blank" rel="nofollow"><img class="alignnone size-full wp-image-141557" src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="" width="728" height="90" /></a> </div></div>
</div>
<div id="sct_menu_area">
<div class="wrap">
<div class="mainx">
<div id="sct_menu">
<ul id="deskmenu" class="menu"><li id="menu-item-16" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li id="menu-item-15" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li id="menu-item-18" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li id="menu-item-33" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
<div class="search-block">
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
</div>
</div>
</div>
</div>

<div id="ninemobile">
<div class="mainx">
<!-- ads lie -->
<a href="https://cutt.ly/nontonanime" target="_blank" rel="nofollow"><img src="https://1.bp.blogspot.com/-f9pI2iopEVM/YYqNLJxYLnI/AAAAAAAAbUc/MYKqTcuC0iYBNvcfMzWm5qFPzkY0kdQyACLcBGAsYHQ/s0/lie.gif" alt="${this.domain}" title="${this.domain}" width="100%"/></a>
<form method="POST" id="searchform" action="/search">
  	<input id="s" class="search-live" type="text" placeholder="Search..." name="s"/>
	<input type="hidden" name="post_type" value="anime" />
</form>
<label for="show-menu" class="show-menu"><span class="dashicons dashicons-menu"></span></label>
<input type="checkbox" id="show-menu" role="button">
<ul id="mobmenu" class="menu"><li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-home menu-item-16"><a href="/"><span class="dashicons dashicons-admin-home"></span> Home</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-15"><a href="/anime-list">Anime List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-37"><a href="/movie-list">Movie List</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-18"><a href="/genre">Genres</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/ongoing">Anime Ongoing</a></li>
<li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-33"><a href="/report">Report</a></li>
</ul></div>
</div>

<div class="wrap mobilewrap">
<!-- iklan nya lie atas -->
	
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<a href="https://www.facebook.com/AnimeIndoStream/" target="_blank" rel="nofollow"><img src="/wp-content/uploads/2018/07/ADS-AI-3.jpg" alt="${this.domain}" title="${this.domain}" width="49.5%"/></a>
<div class="global_info">
<span>News</span>
Sedang Proses Re-upload Anime-Anime lama... Jika tidak bisa di Streaming... Harap Bersabar... Ini ujian...</div>
<div id="sct_page">
<div id="sct_content" class="fl">
<h1>${type}</h1>
<div class="node_ls">	                         				
${genremove.html}
</div>
<div class="pagination">
${bargenre}
</div>
</div>
<div id="sct_sidebar" class="fr">
	<div class="ctn_side">			
		<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p></div>
	</div>
	<div class="ctn_side">
		<div class="textwidget"></div>
	</div>
	<div class="ctn_side">
		<div class="textwidget"><iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FAnimeIndoStream%2F&tabs&width=300&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId=1540873672891974" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe></div>
	</div>
	<div class="ctn_side">
		<div class="textwidget"><p><a href="https://www.facebook.com/AnimeIndoStream" target="_blank" rel="nofollow noopener noreferrer"><img class="" title="" src="/wp-content/uploads/2018/07/ADS-AI.jpg" alt="" width="300" height="250" /></a></p></div>
	</div>
</div>`


	admin = (data, ongoing, acnum, action, dbanime) => {
		if (action.toLowerCase() === 'add') {
			if (acnum === 1) {
				return `<div class="d-flex flex-column flex-root">
<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
    <div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
        <div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
				<form method="POST" action="/admin" class="form w-100" id="kt_sign_up_form" name="form_admin">
	<div class="mb-10 text-center">
		<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - ADD NEW ANIME</h1>
	</div>
	<div class="d-flex align-items-center mb-10">
		<div class="border-bottom border-gray-300 mw-50 w-100"></div>
    </div>
	<div class="fv-row mb-7">
    	<label class="form-label fw-bolder text-dark fs-6">Anime Name</label>
		<input class="form-control form-control-lg" type="text" placeholder="Anime Name" name="anime" autocomplete="off" required/>                                               
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Sinop</label>
		<input class="form-control form-control-lg" type="text" placeholder="Sinop" name="sinop" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Thumb</label>
		<input class="form-control form-control-lg" type="text" placeholder="https://static.dw.com/image/18720428_403.jpg" name="thumb" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Name Url</label>
		<input class="form-control form-control-lg" type="text" placeholder="One Pice" name="nameurl" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Genre</label>
		<input class="form-control form-control-lg" type="text" placeholder="horor, adventure, ..." name="genre" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
		<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
			<option value="movie">Movie</option>
			<option value="tv">Tv</option>
		</select>                                                      
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Time</label>
		<input class="form-control form-control-lg" type="date" name="date" value="${moment(Date.now()).tz('Asia/Jakarta').format('YYYY-MM-DD')}" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Studio</label>
		<input class="form-control form-control-lg" type="text" placeholder="Marvel Studio" name="studio" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Password</label>
		<input id="password" class="form-control form-control-lg" type="password" placeholder="Password" name="password" autocomplete="off" required/>
	</div>
	<br>
	<br>
	<div class="text-center">
		<button type="submit" class="btn btn-lg btn-primary">Save</button>
		<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
	</div>
</form>`
			} else if (acnum === 2) {
				var name = dbanime.nama
				var nameurl = dbanime.nameurl
				return `<div class="d-flex flex-column flex-root">
<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
    <div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
        <div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
<form method="POST" action="/admin" class="form w-100" id="kt_sign_up_form" name="form_admin">
	<div class="mb-10 text-center">
		<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - ADD NEW EPS</h1>
	</div>
	<div class="d-flex align-items-center mb-10">
		<div class="border-bottom border-gray-300 mw-50 w-100"></div>
    </div>
	<div class="fv-row mb-7">
    	<label class="form-label fw-bolder text-dark fs-6">Anime Name</label>
    	<input class="form-control form-control-lg" type="text" autocomplete="off" value="${dbanime.nama}" readonly/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
		<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
			<option value="movie">Movie</option>
			<option value="tv">Tv</option>
		</select>                                                      
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Name Url</label>
		<input class="form-control form-control-lg" type="text" name="nameurl" value="${nameurl}" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Download Url</label>
		<input class="form-control form-control-lg" type="text" name="downloadurl" placeholder="link1, link2, ..." autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Download Url</label>
		<input class="form-control form-control-lg" type="text" name="host" placeholder="nama server link1, nama server link2, ..." autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Episode</label>
		<input class="form-control form-control-lg" type="number" name="eps" value="${dbanime.eps.length + 1}" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
		<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
			<option value="movie">Movie</option>
			<option value="tv">Tv</option>
		</select>                                                      
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Time</label>
		<input class="form-control form-control-lg" type="date" name="date" value="${moment(Date.now()).tz('Asia/Jakarta').format('YYYY-MM-DD')}" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Stream</label>
		<input class="form-control form-control-lg" type="text" placeholder="link stream" name="stream" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Password</label>
		<input id="password" class="form-control form-control-lg" type="password" placeholder="Password" name="password" autocomplete="off" required/>
	</div>
	<br>
	<br>
	<div class="text-center">
		<button type="submit" class="btn btn-lg btn-primary">Save</button>
		<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
	</div>
</form>`
			}
		} else if (action.toLowerCase() === 'edit') {
			var animeloop = this.loopingAnimeDel()
			if (acnum === 1) {
				return `<div class="d-flex flex-column flex-root">
	<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
		<div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
			<div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
					<form method="POST" action="/admin" class="form w-100" id="kt_sign_up_form" name="form_admin">
		<div class="mb-10 text-center">
			<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - EDIT ANIME</h1>
		</div>
		<div class="d-flex align-items-center mb-10">
			<div class="border-bottom border-gray-300 mw-50 w-100"></div>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Anime Name</label>
			<select id="nameurl" name="nameurl" class="form-control form-control-lg">
				${animeloop}
			</select>                                                      
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
			<select id="typeanime" name="typeanime" class="form-control form-control-lg">
				<option value="nama">Nama</option>
				<option value="sinop">Sinop</option>
				<option value="thumb">Thumbnail</option>
				<option value="genre">Genre</option>
				<option value="studio">Studio</option>
				<option value="status">Status</option>
				<option value="quality">Quality</option>
				<option value="type">Type</option>
			</select>                                                      
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Thumb</label>
			<input class="form-control form-control-lg" type="text" placeholder="Data Baru" name="newdata" autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Password</label>
			<input id="password" class="form-control form-control-lg" type="password" placeholder="Password" name="password" autocomplete="off" required/>
		</div>
		<br>
		<br>
		<div class="text-center">
			<button type="submit" class="btn btn-lg btn-primary">Save</button>
			<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
		</div>
	</form>`
			} else if (acnum === 2) {
				var name = dbanime.nama
				var nameurl = dbanime.nameurl
				return `<div class="d-flex flex-column flex-root">
	<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
		<div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
			<div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
	<form method="POST" action="/admin" class="form w-100" id="kt_sign_up_form" name="form_admin">
		<div class="mb-10 text-center">
			<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - ADD NEW EPS</h1>
		</div>
		<div class="d-flex align-items-center mb-10">
			<div class="border-bottom border-gray-300 mw-50 w-100"></div>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Anime Name</label>
			<input class="form-control form-control-lg" type="text" autocomplete="off" value="${dbanime.nama}" readonly/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
			<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
				<option value="movie">Movie</option>
				<option value="tv">Tv</option>
			</select>                                                      
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Name Url</label>
			<input class="form-control form-control-lg" type="text" name="nameurl" value="${nameurl}" autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Download Url</label>
			<input class="form-control form-control-lg" type="text" name="downloadurl" placeholder="link1, link2, ..." autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Download Url</label>
			<input class="form-control form-control-lg" type="text" name="host" placeholder="nama server link1, nama server link2, ..." autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Episode</label>
			<input class="form-control form-control-lg" type="number" name="eps" value="${dbanime.eps.length + 1}" autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
			<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
				<option value="movie">Movie</option>
				<option value="tv">Tv</option>
			</select>                                                      
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Time</label>
			<input class="form-control form-control-lg" type="date" name="date" value="${moment(Date.now()).tz('Asia/Jakarta').format('YYYY-MM-DD')}" autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Stream</label>
			<input class="form-control form-control-lg" type="text" placeholder="link stream" name="stream" autocomplete="off" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Password</label>
			<input id="password" class="form-control form-control-lg" type="password" placeholder="Password" name="password" autocomplete="off" required/>
		</div>
		<br>
		<br>
		<div class="text-center">
			<button type="submit" class="btn btn-lg btn-primary">Save</button>
			<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
		</div>
	</form>`
			}
		} else if (action.toLowerCase() === 'delete') {
			if (acnum === 1) {
				var animeloop = this.loopingAnimeDel()
				return `<div class="d-flex flex-column flex-root">
<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
    <div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
        <div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
				<form method="POST" action="/admin" class="form w-100" id="kt_sign_up_form" name="form_admin">
	<div class="mb-10 text-center">
		<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - DELETE ANIME</h1>
	</div>
	<div class="d-flex align-items-center mb-10">
		<div class="border-bottom border-gray-300 mw-50 w-100"></div>
    </div>
	<div class="fv-row mb-7">
    	<label class="form-label fw-bolder text-dark fs-6">Anime</label>
    	<select id="anime" name="anime" class="form-control form-control-lg" placeholder="Anime">
			${animeloop}
    	</select>                                                      
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Password</label>
		<input id="password" class="form-control form-control-lg" type="password" placeholder="Password" name="password" autocomplete="off" required/>
	</div>
	<br>
	<br>
	<div class="text-center">
		<button type="submit" class="btn btn-lg btn-primary">Save</button>
		<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
	</div>
</form>`
			} else if (acnum === 2) {
				var nameurl = dbanime.nameurl
				var jmlheps = dbanime.eps.length
				return `<div class="d-flex flex-column flex-root">
<div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center" style="background-color:#0A0F23">
    <div class="d-flex flex-center flex-column flex-column-fluid p-5 pb-lg-20">
        <div class="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto border">
				<form method="POST" action="/admin" class="form w-100" id="kt_sign_up_form" name="form_admin">
	<div class="mb-10 text-center">
		<h1 class="text-dark mb-3">MANAGE ANIME & EPISODE - DELETE EPISODE</h1>
	</div>
	<div class="d-flex align-items-center mb-10">
		<div class="border-bottom border-gray-300 mw-50 w-100"></div>
    </div>
	<div class="fv-row mb-7">
    	<label class="form-label fw-bolder text-dark fs-6">Anime</label>
		<input id="anime" name="anime" class="form-control form-control-lg" type="text" placeholder="Anime Name" value="${nameurl}" autocomplete="off" readonly/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Episode</label>
		<input id="episode" class="form-control form-control-lg" type="number" name="eps" value="1" min="1" max="${jmlheps}" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Password</label>
		<input id="password" class="form-control form-control-lg" type="password" placeholder="Password" name="password" autocomplete="off" required/>
	</div>
	<br>
	<br>
	<div class="text-center">
		<button type="submit" class="btn btn-lg btn-primary">Save</button>
		<button type="button" class="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3" onclick="history.back()">Cancel</button>
	</div>
</form>`
			}
		}
	}
	loopingEps = (data) => {
		var textnya = ``
		for (let i = 0; i < data.eps.length; i++) {
			textnya += `<li>
			<span class="c1">${i + 1}</span>
			<a class="c2" href="/anime/${data.nameurl}/${i + 1}">Episode ${i + 1}</a>
			<span class="c3">${moment(data.eps[i].time).format('Do/MM/YYYY')}</span >
				<a class="c4" href="/anime/${data.nameurl}/${i + 1}" title="${data.nama} Episode ${i + 1}">Start Watching!</a>
			</li > `
		}
		return textnya
	}
	loopingEpsWatch = (data) => {
		var textnya = ``
		data.eps.sort((a, b) => (a.eps > b.eps) ? -1 : 1)
		//console.log(data.eps.length)
		for (let i = 0; i < data.eps.length; i++) {
			textnya += `<li>
			<span class="c1">${i + 1}</span>
			<a class="c4" href="/anime/${data.nameurl}/${i + 1}" title="${data.nama} Episode ${i + 1}">Start Watching!</a>
			</li>`
		}
		return textnya
	}
	loopingGenre = (data) => {
		var textnya = ``
		for (let i = 0; i < data.genre.length; i++) {
			textnya += `<a href = "/genre/${data.genre[i]}" rel = "tag" > ${data.genre[i]}</a>`
		}
		return textnya
	}
	onGoingFilter = (data) => {
		var textnya = ``
		for (let i = 0; i < data.length; i++) {
			if (data[i].status === false) {
				textnya += `<option value = "${data[i].nameurl}" > ${data[i].nameurl}</option>`
			}
		}
		return textnya
	}
	loopingAnimeDel = () => {
		var data = this.allanime
		var textnya = ``
		for (let i = 0; i < data.length; i++) {
			textnya += `<option value = "${data[i].nameurl}" > ${data[i].nameurl}</option>`
		}
		return textnya
	}
	moviePage = (data) => {
		var dataM = []
		for (let i = 0; i < data.length; i++) {
			if (data[i].type === "MOVIE") {
				dataM.push(data[i])
			}
		}
		if (dataM.length > 10) {
			var textnya = ``
			for (let i = 9; i > -1; i--) {
				const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
				textnya += `<div class="ndseries">
				<div class="ndsm">
					<a class="series" rel="141895" href='${data[i].url}'>
						<img width="225" height="316" src=${thumbC} class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Kimetsu no Yaiba: Yuukaku-hen" srcset="${thumbC} 225w, ${thumbC} 214w, ${thumbC} 84w" sizes="(max-width: 225px) 100vw, 225px" /> </a>
					<div class="title">${data[i].nama}</div>
				</div>
</div> `
			}
			return textnya
		} else {
			var textnya = ``
			for (let i = dataM.length - 1; i > -1; i--) {
				const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
				textnya += `<div class="ndseries">
				<div class="ndsm">
					<a class="series" rel="141895" href='${data[i].url}'>
						<img width="225" height="316" src=${thumbC} class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Kimetsu no Yaiba: Yuukaku-hen" srcset="${thumbC} 225w, ${thumbC} 214w, ${thumbC} 84w" sizes="(max-width: 225px) 100vw, 225px" /> </a>
					<div class="title">${data[i].nama}</div>
				</div>
</div> `
			}
			return textnya
		}
	}
	genreGet = (data, genre) => {
		var DataM = []
		if (!this.genre.includes(genre)) return false
		for (let i = 0; i < data.length; i++) {
			if (data[i].genre.includes(genre)) {
				DataM.push(data[i])
			}
		}
		return DataM
	}
	genreList = (data) => {
		var textnya = ``
		for (let i = 0; i < data.length; i++) {
			textnya += `<li> <a href=/genre/${data[i]}> ${data[i]}</a ></li>`
		}
		return textnya
	}
	genreMove = (data, page) => {
		let pageX = page === undefined ? 1 : page
		if (isNaN(page)) {
			pageX = 1
		}
		if (data.length < 17) {
			var textnya = ``
			for (let i = 0; i < data.length; i++) {
				textnya += `<div class="node_gen">
<img width="225" height="318" src="${data[i].thumb}" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="86" srcset="${data[i].thumb} 225w, ${data[i].thumb} 212w, ${data[i].thumb} 83w" sizes="(max-width: 225px) 100vw, 225px" /> <h2><a href="/anime/${data[i].nameurl}" title="${data[i].nama}">${data[i].nama}</a></h2>
<p>${data[i].sinop}</p>
</div> `
			}
			const allFilter = data.length / 16
			return { html: textnya, page: Math.ceil(allFilter) }
		} else {
			var textnya = ``
			const pageFil = pageX - 1
			const filterPage = pageX !== 1 ? 0 + 16 * pageFil : 0
			const filterLow = pageX !== 1 ? 16 * pageX : 16
			if (data.length > filterLow) {
				for (let i = filterPage; i < filterLow; i++) {
					textnya += `<div class="node_gen">
<img width="225" height="318" src="${data[i].thumb}" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="86" srcset="${data[i].thumb} 225w, ${data[i].thumb} 212w, ${data[i].thumb} 83w" sizes="(max-width: 225px) 100vw, 225px" /> <h2><a href="/anime/${data[i].nameurl}" title="${data[i].nama}">${data[i].nama}</a></h2>
<p>${data[i].sinop}</p>
</div> `
				}
				const allFilter = data.length / 16
				return { html: textnya, page: Math.ceil(allFilter) }
			} else {
				for (let i = filterPage; i < data.length; i++) {
					textnya += `<div class="node_gen">
<img width="225" height="318" src="${data[i].thumb}" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="86" srcset="${data[i].thumb} 225w, ${data[i].thumb} 212w, ${data[i].thumb} 83w" sizes="(max-width: 225px) 100vw, 225px" /> <h2><a href="/anime/${data[i].nameurl}" title="${data[i].nama}">${data[i].nama}</a></h2>
<p>${data[i].sinop}</p>
</div> `
				}
				const allFilter = data.length / 16
				return { html: textnya, page: Math.ceil(allFilter) }
			}
		}
	}
	createMess = (status, title, text) => {
		return `<script>
				Swal.fire({
					icon: '${status}',
					title: '${title}',
					text: '${text}',
				})
</script> `
	}
	ongoingMove = (data) => {
		var dataM = []
		for (let i = 0; i < data.length; i++) {
			if (data[i].status === false) {
				dataM.push(data[i])
			}
		}
		return dataM
	}
	getAZ = (data, type) => {
		var DataA = [
			{
				a: [], b: [], c: [], d: [], e: [],
				f: [], g: [], h: [], i: [], j: [],
				k: [], l: [], m: [], n: [], o: [],
				p: [], q: [], r: [], s: [], t: [],
				u: [], v: [], w: [], x: [], y: [],
				z: [], $: [], num: []
			}
		]
		for (let i = 0; i < data.length; i++) {
			if (data[i].nama.toLowerCase().startsWith("a")) {
				if (data[i].type === type) {
					DataA[0].a.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("b")) {
				if (data[i].type === type) {
					DataA[0].b.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("c")) {
				if (data[i].type === type) {
					DataA[0].c.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("d")) {
				if (data[i].type === type) {
					DataA[0].d.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("e")) {
				if (data[i].type === type) {
					DataA[0].e.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("f")) {
				if (data[i].type === type) {
					DataA[0].f.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("g")) {
				if (data[i].type === type) {
					DataA[0].g.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("h")) {
				if (data[i].type === type) {
					DataA[0].h.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("i")) {
				if (data[i].type === type) {
					DataA[0].i.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("j")) {
				if (data[i].type === type) {
					DataA[0].j.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("k")) {
				if (data[i].type === type) {
					DataA[0].k.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("l")) {
				if (data[i].type === type) {
					DataA[0].l.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("m")) {
				if (data[i].type === type) {
					DataA[0].m.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("n")) {
				if (data[i].type === type) {
					DataA[0].n.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("o")) {
				if (data[i].type === type) {
					DataA[0].o.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("p")) {
				if (data[i].type === type) {
					DataA[0].p.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("q")) {
				if (data[i].type === type) {
					DataA[0].q.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("r")) {
				if (data[i].type === type) {
					DataA[0].r.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("s")) {
				if (data[i].type === type) {
					DataA[0].s.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("t")) {
				if (data[i].type === type) {
					DataA[0].t.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("u")) {
				if (data[i].type === type) {
					DataA[0].u.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("v")) {
				if (data[i].type === type) {
					DataA[0].v.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("w")) {
				if (data[i].type === type) {
					DataA[0].w.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("x")) {
				if (data[i].type === type) {
					DataA[0].x.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("y")) {
				if (data[i].type === type) {
					DataA[0].y.push(data[i])
				}
			} else if (data[i].nama.toLowerCase().startsWith("z")) {
				if (data[i].type === type) {
					DataA[0].z.push(data[i])
				}
			} else if (!isNaN(parseInt(data[i].nama.slice(0)[0]))) {
				if (data[i].type === type) {
					DataA[0].num.push(data[i])
				}
			} else {
				if (data[i].type === type) {
					DataA[0].$.push(data[i])
				}
			}
		}
		return DataA[0]
	}
	GetHtmlList = (data) => {
		var textnya = ``
		if (data.$.length !== 0) {
			textnya += `</ul ><span><a name="#">#</a></span><ul>`
			for (let i = 0; i < data.$.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.$[i].nameurl}">${data.$[i].nama}</a>`
			}
		}
		if (data.num.length !== 0) {
			textnya += `</ul><span><a name="1">1</a></span><ul>`
			for (let i = 0; i < data.num.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.num[i].nameurl}">${data.num[i].nama}</a>`
			}
		}
		if (data.a.length !== 0) {
			textnya += `</ul><span><a name="A">A</a></span><ul>`
			for (let i = 0; i < data.a.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.a[i].nameurl}">${data.a[i].nama}</a>`
			}
		}
		if (data.b.length !== 0) {
			textnya += `</ul><span><a name="B">B</a></span><ul>`
			for (let i = 0; i < data.b.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.b[i].nameurl}">${data.b[i].nama}</a>`
			}
		}
		if (data.c.length !== 0) {
			textnya += `</ul><span><a name="C">C</a></span><ul>`
			for (let i = 0; i < data.c.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.c[i].nameurl}">${data.c[i].nama}</a>`
			}
		}
		if (data.d.length !== 0) {
			textnya += `</ul><span><a name="D">D</a></span><ul>`
			for (let i = 0; i < data.d.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.d[i].nameurl}">${data.d[i].nama}</a>`
			}
		}
		if (data.e.length !== 0) {
			textnya += `</ul><span><a name="E">E</a></span><ul>`
			for (let i = 0; i < data.e.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.e[i].nameurl}">${data.e[i].nama}</a>`
			}
		}
		if (data.f.length !== 0) {
			textnya += `</ul><span><a name="F">F</a></span><ul>`
			for (let i = 0; i < data.f.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.f[i].nameurl}">${data.f[i].nama}</a>`
			}
		}
		if (data.g.length !== 0) {
			textnya += `</ul><span><a name="G">G</a></span><ul>`
			for (let i = 0; i < data.g.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.g[i].nameurl}">${data.g[i].nama}</a>`
			}
		}
		if (data.h.length !== 0) {
			textnya += `</ul><span><a name="H">H</a></span><ul>`
			for (let i = 0; i < data.h.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.h[i].nameurl}">${data.h[i].nama}</a>`
			}
		}
		if (data.i.length !== 0) {
			textnya += `</ul><span><a name="I">I</a></span><ul>`
			for (let i = 0; i < data.i.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.i[i].nameurl}">${data.i[i].nama}</a>`
			}
		}
		if (data.j.length !== 0) {
			textnya += `</ul><span><a name="J">J</a></span><ul>`
			for (let i = 0; i < data.j.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.j[i].nameurl}">${data.j[i].nama}</a>`
			}
		}
		if (data.k.length !== 0) {
			textnya += `</ul><span><a name="K">K</a></span><ul>`
			for (let i = 0; i < data.k.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.k[i].nameurl}">${data.k[i].nama}</a>`
			}
		}
		if (data.l.length !== 0) {
			textnya += `</ul><span><a name="I">I</a></span><ul>`
			for (let i = 0; i < data.l.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.l[i].nameurl}">${data.l[i].nama}</a>`
			}
		}
		if (data.m.length !== 0) {
			textnya += `</ul><span><a name="M">M</a></span><ul>`
			for (let i = 0; i < data.m.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.m[i].nameurl}">${data.m[i].nama}</a>`
			}
		}
		if (data.n.length !== 0) {
			textnya += `</ul><span><a name="N">N</a></span><ul>`
			for (let i = 0; i < data.n.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.n[i].nameurl}">${data.n[i].nama}</a>`
			}
		}
		if (data.o.length !== 0) {
			textnya += `</ul><span><a name="O">O</a></span><ul>`
			for (let i = 0; i < data.o.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.o[i].nameurl}">${data.o[i].nama}</a>`
			}
		}
		if (data.p.length !== 0) {
			textnya += `</ul><span><a name="P">P</a></span><ul>`
			for (let i = 0; i < data.p.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.p[i].nameurl}">${data.p[i].nama}</a>`
			}
		}
		if (data.q.length !== 0) {
			textnya += `</ul><span><a name="Q">Q</a></span><ul>`
			for (let i = 0; i < data.q.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.q[i].nameurl}">${data.q[i].nama}</a>`
			}
		}
		if (data.r.length !== 0) {
			textnya += `</ul><span><a name="R">R</a></span><ul>`
			for (let i = 0; i < data.r.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.r[i].nameurl}">${data.r[i].nama}</a>`
			}
		}
		if (data.s.length !== 0) {
			textnya += `</ul><span><a name="S">S</a></span><ul>`
			for (let i = 0; i < data.s.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.s[i].nameurl}">${data.s[i].nama}</a>`
			}
		}
		if (data.t.length !== 0) {
			textnya += `</ul><span><a name="T">T</a></span><ul>`
			for (let i = 0; i < data.t.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.t[i].nameurl}">${data.t[i].nama}</a>`
			}
		}
		if (data.u.length !== 0) {
			textnya += `</ul><span><a name="U">U</a></span><ul>`
			for (let i = 0; i < data.u.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.u[i].nameurl}">${data.u[i].nama}</a>`
			}
		}
		if (data.v.length !== 0) {
			textnya += `</ul><span><a name="V">V</a></span><ul>`
			for (let i = 0; i < data.v.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.v[i].nameurl}">${data.v[i].nama}</a>`
			}
		}
		if (data.w.length !== 0) {
			textnya += `</ul><span><a name="W">W</a></span><ul>`
			for (let i = 0; i < data.w.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.w[i].nameurl}">${data.w[i].nama}</a>`
			}
		}
		if (data.x.length !== 0) {
			textnya += `</ul><span><a name="X">X</a></span><ul>`
			for (let i = 0; i < data.x.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.x[i].nameurl}">${data.x[i].nama}</a>`
			}
		}
		if (data.y.length !== 0) {
			textnya += `</ul><span><a name="Y">Y</a></span><ul>`
			for (let i = 0; i < data.y.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.y[i].nameurl}">${data.y[i].nama}</a>`
			}
		}
		if (data.z.length !== 0) {
			textnya += `</ul><span><a name="X">X</a></span><ul>`
			for (let i = 0; i < data.z.length; i++) {
				textnya += `<a class="series" rel="1327" href="/anime/${data.z[i].nameurl}">${data.z[i].nama}</a>`
			}
		}
		return textnya
	}
	backToHome = (res, req, mess) => {
		let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
		ip = ip.replace(/\:|f|\:\:1/g, '')
		this.addLogs(ip, "dashboard")
		var animenew = this.NewrilisPage(this.newanime, 1)
		var movienew = this.moviePage(this.newanime)
		if (animenew === false) return res.sendFile(path.join(__dirname, 'page/404.html'))
		var allanime = this.topviewAnime(this.allanime)
		var getBar = this.getPageBar(1, animenew.page)
		res.send(this.htmlPage(animenew, allanime, getBar, movienew, mess))
	}

	filterALLview = (data) => {
		var oldView = data.view
		for (let i = 0; i < data.eps.length; i++) {
			oldView += data.eps[i].ip.length
		}
		return oldView
	}
}

module.exports = RestApi