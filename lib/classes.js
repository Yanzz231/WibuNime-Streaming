const fs = require('fs')
const { default: Axios } = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const path = require("path");
const favicon = require('serve-favicon')
const moment = require('moment')
const qs = require('querystring')
const chalk = require("chalk")
const translate = require("@vitalets/google-translate-api");
const ws = require('ws')
const multer = require('multer')
const nodemailer = require('nodemailer');

// FUNCTION
const { checkNameUrl, getDBEps, addNewEps, addNewanime, checkID, checkNameUrls, checkThumb, objGenre, filternull, searchAnime, addView, AllGenre, addReport, removeReport, createSerial, checkData, loopGenreALL, translateAnime, dataEnd } = require("../function/function")
const { reports } = require("../function/function")
const { ExcStream, isImage, filterThumb } = require("../function/scraper")
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
    const { getNew, getAnime, getGenre } = require("../function/function")
    this.settingsPath = './src/settings.json'
    this.port = (JSON.parse(fs.readFileSync(this.settingsPath))).PORT
    this.news = (JSON.parse(fs.readFileSync(this.settingsPath))).news
    this.newanime = getNew()
    this.allanime = getAnime()
    this.genre = getGenre()
    this.passwordAdmin = JSON.parse(fs.readFileSync('./src/password.json'))
    this.passwordPage = JSON.parse(fs.readFileSync('./src/passwordPage.json'))
    this.domain = "WibuNime"
    this.url = "https://wibunime.xyz"
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
      if (getData === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const getHtml = this.genreMove(getData, parseInt(req.pageg), !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      if (isNaN(req.pageg)) {
        res.redirect(`/genre/${req.genre}`)
      }
      if (parseInt(req.pageg) > getHtml.page) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const getDataBar = this.getPageBarGenre(req.pageg, getHtml.page, req.genre)
      res.send(this.genreHtml(getHtml, getDataBar, req.genre.toUpperCase(), "genre"))
    })
    app.get('/genre/:genre', async (req, res) => {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      const getData = this.genreGet(this.allanime, req.genre)
      if (getData === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const getHtml = this.genreMove(getData, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const getDataBar = this.getPageBarGenre(1, getHtml.page, req.genre)
      res.send(this.genreHtml(getHtml, getDataBar, req.genre.toUpperCase(), "genre"))
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
      req.pageo = modified;
      next();
    });
    app.get('/ongoing/:pageo', async (req, res) => {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      const getData = this.ongoingMove(this.allanime)
      if (getData === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const getHtml = this.genreMove(getData, parseInt(req.pageo), !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      if (isNaN(req.pageo)) {
        res.redirect(`/genre/${req.genre}`)
      } else {
        if (parseInt(req.pageo) > getHtml.page) return res.send(this.notFound("Page Not Found", "404 Not Found"));
        const getDataBar = this.getPageBarOngoing(parseInt(req.pageo), getHtml.page)
        res.send(this.genreHtml(getHtml, getDataBar, "Anime OnGoing", "going"))
      }
    })
    app.get('/ongoing/', async (req, res) => {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      const getData = this.ongoingMove(this.allanime)
      if (getData === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const getHtml = this.genreMove(getData, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const getDataBar = this.getPageBarOngoing(1, getHtml.page)
      res.send(this.genreHtml(getHtml, getDataBar, "Anime OnGoing", "going"))
    })
    // REPORT
    app.get('/report', async (req, res) => {
      res.send(this.reportPage())
    })
    app.post('/report', async (req, res) => {
      const { issue, name, email, detail, url } = req.body
      if (issue === undefined || name === undefined || email === undefined || detail === undefined || url === undefined) {
        return res.send(this.notFound("Input A Data", "404 Not Found"));
      } else if (issue.length < 1 || name.length < 1 || email.length < 1 || detail.length < 1 || url.length < 1) {
        return res.send(this.notFound("Input A Data", "404 Not Found"));
      } else {
        //func
      }
    })
    // SEARCH
    app.param('pages', function (req, res, next, pages) {
      const modified = pages
      req.pages = modified;
      next();
    });
    // SEARCH
    app.param('ans', function (req, res, next, ans) {
      const modified = ans
      req.ans = modified;
      next();
    });
    app.post('/search', async (req, res) => {
      const { s } = req.body
      var query = s
      if (query < 1) {
        res.send(this.notFound("No Post Found", "Try Different Search?")); 
      } else if (query == undefined) {
        res.send(this.notFound("No Post Found", "Try Different Search?"));
      } else {
        const q = query.toLowerCase()
        const filterSearch = searchAnime(this.allanime, q)
        if (filterSearch === undefined) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        if (filterSearch.length < 1) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        const getHtml = this.genreMove(filterSearch, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
        const getDataBar = this.getPageBarSearc(1, getHtml.page, q)
        res.send(this.genreHtml(getHtml, getDataBar, q, "search"))
      }
    })
    app.get('/search/:ans/:pages', async (req, res) => {
      const query = req.ans
      if (query < 1) {
        res.send(this.notFound("No Post Found", "Try Different Search?"));
      } else if (query == undefined) {
        res.send(this.notFound("No Post Found", "Try Different Search?"));
      } else {
        const q = query.toLowerCase()
        const filterSearch = searchAnime(this.allanime, req.ans)
        if (filterSearch === undefined) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        if (filterSearch.length < 1) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        const getHtml = this.genreMove(filterSearch, parseInt(req.pages), !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
        if (parseInt(req.pages) > getHtml.page) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        const getDataBar = this.getPageBarSearc(parseInt(req.pages), getHtml.page, req.ans)
        res.send(this.genreHtml(getHtml, getDataBar, q, "search"))
      }
    })
    app.get('/search/:ans', async (req, res) => {
      const query = req.ans
      if (query < 1) {
        res.send(this.notFound("No Post Found", "Try Different Search?"));
      } else if (query == undefined) {
        res.send(this.notFound("No Post Found", "Try Different Search?"));
      } else {
        const q = query.toLowerCase()
        const filterSearch = searchAnime(this.allanime, req.ans)
        if (filterSearch === undefined) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        if (filterSearch.length < 1) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        const getHtml = this.genreMove(filterSearch, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
        if (parseInt(req.pages) > getHtml.page) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        const getDataBar = this.getPageBarSearc(parseInt(req.pages), getHtml.page, req.ans)
        res.send(this.genreHtml(getHtml, getDataBar, q, "search"))
      }
    })
    // SEARCH LIVE
    app.get('/searchanime', async (req, res) => {
      const query = req.query.query
      if (query < 1) {
        res.send(this.notFound("Input A Parameter", "404 Not Found"));
      } else if (query == undefined) {
        res.send(this.notFound("Input A Parameter", "404 Not Found"));
      } else {
        const q = query.toLowerCase()
        const filterSearch = searchAnime(this.allanime, query)
        if (filterSearch === undefined) return res.send(this.notFound("No Post Found", "Try Different Search?"));
        let result = []
        if (filterSearch.length < 1) return res.send(this.notFound("No Post Found", "Try Different Search?"));
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
      const animenew = this.NewrilisPage(this.newanime, req.page, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const movienew = this.moviePage(this.newanime)
      if (animenew === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const allanime = this.topviewAnime(this.allanime, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
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
      const animenew = this.NewrilisPage(this.newanime, req.page, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const movienew = this.moviePage(this.newanime)
      if (animenew === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const allanime = this.topviewAnime(this.allanime, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
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
    app.get('/admin', async (req, res) => {
      var action = req.query.action
      var acnum = req.query.acnum
      var passwd = req.query.pass
      if (action === undefined || acnum === undefined || passwd === undefined) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
      if (action === 'add') {
        if (parseInt(acnum) === 1) {
          var on_going = this.onGoingFilter(this.allanime)
          var db = this.allanime
          res.send(this.adminPage(this.admin(db, on_going, parseInt(acnum), action)))
        } else if (parseInt(acnum) === 2) {
          var animek = req.query.anime
          if (animek === undefined) return res.send(this.notFound("Input A Parameter", "404 Not Found"));
          if (!checkNameUrls(animek)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
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
          if (animek === undefined) return res.send(this.notFound("Input A Parameter", "404 Not Found"));
          if (!checkNameUrls(animek)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
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
      } else {
        res.redirect('/')
      }
    })
    app.post('/admin', async (req, res) => {
      var act = req.query.action
      var acnum = req.query.acnum
      var passwd = req.query.pass
      if (act === 'add') {
        if (act === undefined || acnum === undefined || passwd === undefined) return res.send(this.notFound(`Input Parameter ${act === undefined ? 'Action' : acnum === undefined ? 'Acnum' : typemov === undefined ? 'Typemov' : passwd === undefined ? 'Pass' : ''}`, "404 Not Found"));
        if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
          return res.send(this.notFound("Wrong Action", "404 Not Found"));
        } else if (parseInt(acnum) === 1) {
          var { anime, sinop, thumb, nameurl, genre, typeanime, date, rating, password, status } = req.body
          if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
          if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Input A Password Page", "404 Not Found"));
          if (typeanime != "MOVIE" && typeanime != "TV") return res.send(this.notFound("Wrong Type", "404 Not Found"));
          if (checkNameUrls(nameurl)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
          data.addNewanime(anime, sinop, thumb, nameurl, [objGenre(genre)], date, typeanime, rating, status === "false" ? false : status === "true" ? true : false)
          return res.redirect('/')
        } else if (parseInt(acnum) === 2) {
          var nameurl = req.query.anime
          var { anime, downloadurl, eps, typeanime, date, stream, password } = req.body
          if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
          if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Input A Password Page", "404 Not Found"));
          if (!checkNameUrls(nameurl)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
          if (typeanime != "MOVIE" && typeanime != "TV") return res.send(this.notFound("Wrong Type", "404 Not Found"));
          data.addNewEps(nameurl, anime, typeanime.toUpperCase(), downloadurl, '', stream, parseInt(eps), date, createSerial(400))
          return res.redirect('/')
        } else {
          return res.redirect('/')
        }
      } else if (act === 'edit') {
        var nameurl = req.query.anime
        if (act === undefined || parseInt(acnum) === undefined || passwd === undefined) return res.send(this.notFound(`Input Parameter ${act === undefined ? 'Action' : acnum === undefined ? 'Acnum' : passwd === undefined ? 'Pass' : ''}`, "404 Not Found"));
        if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
          return res.send(this.notFound("Wrong Action", "404 Not Found"));
        } else if (parseInt(acnum) === 1) {
          var nameurl = req.query.anime
          var { typedata, newdata, password } = req.body
          if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
          if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Input A Password Page", "404 Not Found"));
          if (checkNameUrls(nameurl) === false) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
          if (typedata === undefined || newdata === undefined) return res.send(this.notFound("Input New Data", "404 Not Found"));
          data.editAnime(nameurl, typedata, newdata)
          return res.redirect('/')
        } else if (parseInt(acnum) === 2) {
          var nameurl = req.query.anime
          var { typeanime, newdata, password, eps } = req.body
          if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Input A Password Page", "404 Not Found"));
          if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
          if (!checkNameUrls(nameurl)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
          if (nameurl === undefined || typeanime === undefined || eps === undefined || newdata === undefined) return res.send(this.notFound("Input A New Data", "404 Not Found"));
          data.editEps(nameurl, parseInt(eps), typeanime, newdata)
          res.redirect('/')
        } else {
          res.redirect('/')
        }
      } else if (act === 'delete') {
        if (act === undefined || acnum === undefined || passwd === undefined) return res.send(this.notFound(`Input Parameter ${act === undefined ? 'Action' : acnum === undefined ? 'Acnum' : passwd === undefined ? 'Pass' : ''}`, "404 Not Found"));
        var { nameurl, download, stream, password } = req.body
        if (parseInt(acnum) < 1 || parseInt(acnum) > 3 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
          return res.send(this.notFound("Wrong Action", "404 Not Found"));
        } else {
          if (parseInt(acnum) < 1 || parseInt(acnum) > 4 || parseInt(acnum) === undefined || isNaN(parseInt(acnum))) {
            if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Wrong Password", "404 Not Found"));
          } else if (parseInt(acnum) === 1) {
            //ANIME						
            if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
            if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Input A Password Page", "404 Not Found"));
            if (!checkNameUrls(nameurl)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
            data.deleteAnime(anime)
            res.redirect('/')
          } else if (parseInt(acnum) === 2) {
            //EPS
            var { eps, password } = req.body
            if (!this.passwordPage.includes(passwd)) return res.send(this.notFound("Input A Password Url", "404 Not Found"));
            if (!this.passwordAdmin.includes(password)) return res.send(this.notFound("Input A Password Page", "404 Not Found"));
            if (!checkNameUrls(anime)) return res.send(this.notFound("Wrong Anime", "404 Not Found"));
            if (!getDBEps(eps)) return res.send(this.notFound("Wrong Episode", "404 Not Found"));
            data.deleteEps(anime, parseInt(eps))
            res.redirect('/')
          } else {
            res.redirect('/')
          }
        }
      } else {
        res.redirect('/')
      }
    })
    app.get('/anime/:anime', async (req, res) => {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      const checkName = await checkNameUrl(req.anime.toLowerCase())
      if (checkName === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const filterView = this.filterALLview(checkName)
      addView(checkName.nameurl, undefined, ip)
      translateAnime(checkName.nama).then((data) => {
        isImage(checkName.thumb).then(rek => {
          res.send(this.detailPage(checkName, this.loopingEps(checkName), this.loopingGenre(checkName), filterView, data, rek))
        })
      })
    })
    app.get('/anime/:anime/:eps', async (req, res) => {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      const checkName = await checkNameUrl(req.anime.toLowerCase())
      const filterEps = isNaN(req.eps) ? 1 : req.eps
      if (isNaN(req.eps)) {
        if (req.eps === "OVA") {
          if (checkName === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
          addView(checkName.nameurl, req.eps, ip)
          const LoopEps = this.loopingEpsWatch(checkName)
          const animdb = await getDBEps(req.anime, req.eps)
          const LoopDown = await this.loopingDownload(checkName, req.eps)
          if(LoopDown === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
          isImage(checkName.thumb).then(rek => {
            res.send(this.WatchAnime(animdb.stream, checkName, req.eps, LoopEps, LoopDown, this.loopingGenre(checkName), rek))
          })
        } else {
          const checkName = await checkNameUrl(req.anime)
          return res.redirect(`/anime/${req.anime}`)
        }
      } else {
        if (checkName === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
        addView(checkName.nameurl, parseInt(req.eps), ip)
        const LoopEps = this.loopingEpsWatch(checkName)
        const animdb = await getDBEps(req.anime, parseInt(req.eps))
        const LoopDown = await this.loopingDownload(checkName, parseInt(req.eps))
        if(LoopDown === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
        isImage(checkName.thumb).then(rek => {
          res.send(this.WatchAnime(animdb.stream, checkName, req.eps, LoopEps, LoopDown, this.loopingGenre(checkName), rek))
        })
      }
    });
    // DASHBOARD && INDEX
    app.get('/dashboard', async (req, res) => {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      this.addLogs(ip, "dashboard")
      const animenew = this.NewrilisPage(this.newanime, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const movienew = this.moviePage(this.newanime)
      if (animenew === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const allanime = this.topviewAnime(this.allanime, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const getBar = this.getPageBar(1, animenew.page)
      res.send(this.htmlPage(animenew, allanime, getBar, movienew))
    })
    app.get('/', async (req, res) => {
      res.redirect
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = ip.replace(/\:|f|\:\:1/g, '')
      this.addLogs(ip, "dashboard")
      const animenew = this.NewrilisPage(this.newanime, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const movienew = this.moviePage(this.newanime)
      if (animenew === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
      const allanime = this.topviewAnime(this.allanime, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
      const getBar = this.getPageBar(1, animenew.page)
      res.send(this.htmlPage(animenew, allanime, getBar, movienew))
    })

    app.get('*', async (req, res) => {
      res.status(404)
      return res.send(this.notFound("Page Not Found", "404 Not Found"));
    });


    // Listening to start server
    const server = app.listen(this.port, () => console.log(`Started at port ${this.port}`))
    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
      });
    });
  }

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
						<h1 class="text-dark mb-3">REPORT A ISSUE</h1>
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

  streamHtml = (url, thumb, type) => {
    if (type === 1) {
      return `
    <!DOCTYPE html><html><head><title>${this.domain} Streaming</title>
    <meta name="robots" content="noindex"/><meta name="googlebot" content="noindex"/>
    <meta name="referrer" content="never"/><meta name="referrer" content="no-referrer"/>
    <meta content='36b971191bc26d81f87ae172c4e5a646' name='etoads'/>
    <style type="text/css">
    *{margin:0;padding:0}#arsipin{position:absolute;width:100%!important;height:100%!important}
    .jw-button-color:hover,.jw-toggle,.jw-toggle:hover,
    .jw-open,.jw-progress{color:#008fee!important;}.jw-active-option{background-color:#008fee!important;}
    .jw-progress{background:#008fee!important;}.jw-skin-seven .jw-toggle.jw-off{color:#fff!important}
    </style>
        <script src="//content.jwplatform.com/libraries/zgIRUsiD.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
        <div id="arsipin" class="arsipin"></div>
    
        <script type="text/javascript">
    var playerInstance=jwplayer('arsipin');
    playerInstance.setup(
        {
        title : '',
        tracks: [{
            file: '',
            kind: 'captions',
            'default': true
        }],
        sources: [{'file':'${url}','type':'video/mp4'}],
        image: "${thumb}",
        captions:
            {
            color:'#FFFF00',fontSize:17,backgroundOpacity:50
        },
    }
    );
    </script>
    </center>`
    } else if (type === 2) {
      return `<!DOCTYPE html>
      <head>
      <title>Player | ${this.domain}</title>
    <meta property="og:title" content="${this.domain}" />
    <meta property="og:type" content="video.streaming" />
    <meta property="og:url" content="/" />
    <meta property="og:image" content="" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0"/>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <style>
    html,body{
    height: 100%;
    width: 100%;
    margin: 0;
    overflow:hidden;
    }
    body {
     margin:0;
     padding:0;
     background:#000;
    }
    
    #player {
     position:absolute;
     width:100%;
     height:100% !important;
    }
    </style>
    </head>
    <body >
    <div id="player"></div>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script type="text/javascript" src="jwplayer.js"></script>
    
    <script type="text/javascript">
    function wibunime(e) {
        e = JSON.parse(e), jwplayer.key = "2pfYkSNlFjontz1vjlwqMm2rpIHxF9Lp6Pg27Q==";
        var t = jwplayer("player");
        t.setup({
            id: "player",
            file: e.file,
            type: "video/mp4",
            image: e.img,
            controls: "true",
            displaytitle: "true",
            width: "100%",
            height: "100%",
            aspectratio: "16:9",
            fullscreen: "true",
            autostart: "false",
            abouttext: "${this.domain}",
            aboutlink: "/",
            skin: {
                name: "bekle"
            },
            captions: {
                color: "#FFFFFF",
                fontSize: 20,
                backgroundOpacity: 20
            }
        })
    }
    wibunime('{"file":"${url}","img":"${thumb}"}');
    </script>
    </body>
    </html>`
    }
  }

  //PAGE
  detailPage = (checkName, alleps, allgenre, view, tran, rek) => `<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content="All-Language" http-equiv="Content-Language">
<meta name="DC.title" content="${checkName.nama} - ${this.domain}">
<title>${checkName.nama} - ${this.domain}</title>
<meta name="keywords" content="${checkName.nama}">
<meta name="keywords" content="${checkName.nama}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
	<link rel="canonical" href="/anime/${checkName.nameurl}/">
	<meta property="og:locale" content="en_US">
	<meta property="og:type" content="article">
	<meta property="og:title" content="${checkName.nama} - ${this.domain}">
	<meta property="og:description" content="${checkName.sinop}">
	<meta property="og:url" content="/anime/${checkName.nameurl}/">
	<meta property="og:site_name" content="${this.domain}">
	<meta property="article:modified_time" content="2021-09-21T06:52:30+00:00">
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:label1" content="Est. reading time">
	<meta name="twitter:data1" content="1 minute">
	<!-- / Yoast SEO plugin. -->
<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//s.w.org">
<link rel="stylesheet" id="/wp-block-library-css" href="/wp-includes/css/dist/block-library/style.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Fontawesome 6-css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Style-css" href="/wp-content/themes/ZStream/style.css" type="text/css" media="all">
<link rel="stylesheet" id="Sweetalert-css" href="/wp-content/themes/ZStream/assets/css/sweetalert2.min.css" type="text/css" media="all">
<link rel="stylesheet" id="simple-favorites-css" href="/wp-content/plugins/favorites/assets/css/favorites.css" type="text/css" media="all">
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js" id="Sweetalert JS-js"></script><style type="text/css">@-webkit-keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="shortlink" href="/">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/anime-list/">Semua Anime</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-127"><a href="/genre/">Genre</a></li>
	<li id="menu-item-128" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-128"><a href="/movie-list/">Semua Movie</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>


<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<meta itemprop="target" content="/search">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off">
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch" style="display: none;"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="series">
<div class="series-cover"> 
<div class="series-bg" style="background-image:url(${rek === false ? "https://i.ibb.co/RTYwBkS/150ba7b5-c0ab-4ad0-ac8b-5842f3cf4726.jpg" : checkName.thumb});"></div>
</div>
<div class="container">
<div class="series-flex">
<div class="series-flexleft">
<div class="series-thumb">
<img src="${rek === false ? "https://i.ibb.co/RTYwBkS/150ba7b5-c0ab-4ad0-ac8b-5842f3cf4726.jpg" : checkName.thumb}?resize=225,310" alt="${checkName.nama}" title="${checkName.nama}"></div>
<div class="series-info">
<div class="series-titlex"><h2>${checkName.nama}</h2><span>${tran}</span></div>
<div class="series-infoz block"><span class="type ${checkName.type}">${checkName.type}</span><span class="status Completed">${checkName.status === false ? "On Going" : "Completed"}</span></div>


<ul class="series-infolist">
<li><b>Episodes</b><span>${checkName.eps.length}</span></li>
<li><b>Aired</b><span>${checkName.time}</span></li>
<li><b>Rating</b><span>${checkName.rating}</span></li>
<li><b>View</b><span>${view}</span></li>
</ul>
</div>
</div>
<div class="series-flexright">
<div class="series-title"><h2>${checkName.nama}</h2><span>${tran}</span></div>
<div class="series-genres">${allgenre}</div>
<div class="series-synops">
<p>${checkName.sinop}</p>
</div>
<div class="series-episode"><h2><span>Episode</span> List</h2><ul class="series-episodelist">
${alleps}
</ul></div>
</div>
</div>
</div>
</div>
</div>
</main>
	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type="text/javascript" src="/wp-includes/js/comment-reply.min.js" id="comment-reply-js"></script>
<script type="text/javascript" src="/wp-includes/js/wp-embed.min.js" id="/wp-embed-js"></script>
	<div id="shadow"></div>
<a href="#" class="scrollToTop" style="display: none;"><i class="fa-solid fa-arrow-up"></i></a>
<script type="text/javascript">jQuery(function(e){"darkmode"==localStorage.getItem("theme-mode")&&e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").on("click",function(t){e(this).is(":checked")?(e("body").addClass("dark"),e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!0)}),localStorage.setItem("theme-mode","darkmode")):(e("body").removeClass("dark"),e(".switch").html('<i class="fa-solid fa-moon fa-fw"></i> Dark Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!1)}),localStorage.setItem("theme-mode","lightmode"))})});</script>
<script type="text/javascript">$(document).ready(function(){$(window).scroll(function(){if($(this).scrollTop()>100){$('.scrollToTop').fadeIn()}else{$('.scrollToTop').fadeOut()}});$('.scrollToTop').click(function(){$('html, body').animate({scrollTop:0},100);return!1})})</script>

<iframe style="display: none;"></iframe></body></html>`

  notFound = (message1, message2) => `<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content="All-Language" http-equiv="Content-Language">
<meta name="DC.title" content="Page not found - ${this.domain}">
<title>Page not found - ${this.domain}</title>
<meta name="robots" content="noindex, follow">

	<!-- This site is optimized with the Yoast SEO plugin v17.8 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta property="og:locale" content="en_US">
	<meta property="og:title" content="Page not found - ${this.domain}">
	<meta property="og:site_name" content="${this.domain}">
	<!-- / Yoast SEO plugin. -->
<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//s.w.org">
<link rel="stylesheet" id="wp-block-library-css" href="/wp-includes/css/dist/block-library/style.min.css?ver=5.8.2" type="text/css" media="all">
<link rel="stylesheet" id="Fontawesome 6-css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css?ver=5.8.2" type="text/css" media="all">
<link rel="stylesheet" id="Style-css" href="/wp-content/themes/ZStream/style.css?ver=5.8.2" type="text/css" media="all">
<link rel="stylesheet" id="Sweetalert-css" href="/wp-content/themes/ZStream/assets/css/sweetalert2.min.css?ver=5.8.2" type="text/css" media="all">
<link rel="stylesheet" id="simple-favorites-css" href="/wp-content/plugins/favorites/assets/css/favorites.css?ver=2.3.2" type="text/css" media="all">
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js?ver=5.8.2" id="Sweetalert JS-js"></script><style type="text/css">@-webkit-keyframes swal2-show {
<style>
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js?ver=2.3.2" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
</head>
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/anime-list/">Semua Anime</a></li>
  <li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/movie-list/">Semua Movie</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-127"><a href="/genre/">Genre</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>


<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<meta itemprop="target" content="/search">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off">
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch" style="display: none;"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="container">
<div class="pagenon">
<h2>${message1}</h2>
<span>${message2}</span>
<br>
<a href="/" title="${this.domain}" rel="home">Home</a>
</div>
</div>
</div>
</main>

	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type="text/javascript">function fetchResults(){var keyword=jQuery('#search').val();if(keyword==""){jQuery('#datafetch').css("display","none");jQuery('#datafetch').html("")}else{jQuery('#datafetch').css("display","block");jQuery('#datafetch').html("<span>Loading...</span>");jQuery.ajax({url:'/wp-admin/admin-ajax.php',type:'post',data:{action:'data_fetch',keyword:keyword},success:function(data){jQuery('#datafetch').html(data)}})}}
$('body').on('click',function(event){$('#datafetch').empty().hide()})</script>
<script type="text/javascript" src="/wp-includes/js/wp-embed.min.js?ver=5.8.2" id="wp-embed-js"></script>
	<div id="shadow"></div>
<a href="#" class="scrollToTop"><i class="fa-solid fa-arrow-up"></i></a>
<script type="text/javascript">jQuery(function(e){"darkmode"==localStorage.getItem("theme-mode")&&e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").on("click",function(t){e(this).is(":checked")?(e("body").addClass("dark"),e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!0)}),localStorage.setItem("theme-mode","darkmode")):(e("body").removeClass("dark"),e(".switch").html('<i class="fa-solid fa-moon fa-fw"></i> Dark Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!1)}),localStorage.setItem("theme-mode","lightmode"))})});</script>
<script type="text/javascript">$(document).ready(function(){$(window).scroll(function(){if($(this).scrollTop()>100){$('.scrollToTop').fadeIn()}else{$('.scrollToTop').fadeOut()}});$('.scrollToTop').click(function(){$('html, body').animate({scrollTop:0},100);return!1})})</script>

</body></html>`

  genrePage = (allgenre) => `<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content="All-Language" http-equiv="Content-Language">
<meta name="DC.title" content="Genre - ${this.domain}">
<title>Genre - ${this.domain}</title>
<meta name="keywords" content="Genre">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

	<!-- This site is optimized with the Yoast SEO plugin v17.8 - https://yoast.com/wordpress/plugins/seo/ -->
	<link rel="canonical" href="/genre/">
	<meta property="og:locale" content="en_US">
	<meta property="og:type" content="article">
	<meta property="og:title" content="Genre - ${this.domain}">
	<meta property="og:url" content="/genre/">
	<meta property="og:site_name" content="${this.domain}">
	<meta name="twitter:card" content="summary_large_image">
	<!-- / Yoast SEO plugin. -->


<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//s.w.org">
<link rel="stylesheet" id="wp-block-library-css" href="/wp-includes/css/dist/block-library/style.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Fontawesome 6-css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Style-css" href="/wp-content/themes/ZStream/style.css" type="text/css" media="all">
<link rel="stylesheet" id="Sweetalert-css" href="/wp-content/themes/ZStream/assets/css/sweetalert2.min.css" type="text/css" media="all">
<link rel="stylesheet" id="simple-favorites-css" href="/wp-content/plugins/favorites/assets/css/favorites.css" type="text/css" media="all">
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js" id="Sweetalert JS-js"></script><style type="text/css">@-webkit-keyframes swal2-show {
<style>
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="shortlink" href="/">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
</head>
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-ancestor current-menu-parent menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/anime-list/">Semua Anime</a></li>
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/movie-list/">Semua Movie</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-115 current_page_item menu-item-127"><a href="/genre/" aria-current="page">Genre</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>


<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<meta itemprop="target" content="/search">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off">
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch" style="display: none;"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="container"><h2><span>Genre</span> List</h2><ul class="achlist">
${allgenre}
</ul>
</div>
</div>
</main>

	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type="text/javascript" src="/wp-includes/js/wp-embed.min.js" id="wp-embed-js"></script>
	<div id="shadow"></div>
<a href="#" class="scrollToTop"><i class="fa-solid fa-arrow-up"></i></a>
<script type="text/javascript">jQuery(function(e){"darkmode"==localStorage.getItem("theme-mode")&&e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").on("click",function(t){e(this).is(":checked")?(e("body").addClass("dark"),e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!0)}),localStorage.setItem("theme-mode","darkmode")):(e("body").removeClass("dark"),e(".switch").html('<i class="fa-solid fa-moon fa-fw"></i> Dark Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!1)}),localStorage.setItem("theme-mode","lightmode"))})});</script>
<script type="text/javascript">$(document).ready(function(){$(window).scroll(function(){if($(this).scrollTop()>100){$('.scrollToTop').fadeIn()}else{$('.scrollToTop').fadeOut()}});$('.scrollToTop').click(function(){$('html, body').animate({scrollTop:0},100);return!1})})</script>

</body></html>`

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
function chgAction(action, actn, type, pass, anime){ 
	if(action.toLowerCase() == "add"){
    if(parseInt(actn) == 1){
		  document.form_admin.action = "/admin?action=add&acnum=1&typemov="+type+"&pass="+pass
    }else if(parseInt(actn) == 2){
		  document.form_admin.action = "/admin?action=add&acnum=2&typemov="+type+"&pass="+pass+"&anime="+anime
    }else{
      console.log(false)
    }
  }else if(action.toLowerCase() == "edit"){
		document.form_admin.action = "/admin?action=edit&acnum="+actn+"&pass="+pass+"&anime="+anime
	}else if(action.toLowerCase() == "delete"){
		document.form_admin.action = "/admin?action=delete&acnum="+actn+"&pass="+pass
	}
}
function getParam(param){
  var queryString = window.location.search;
	var urlParams = new URLSearchParams(queryString);
	var action = urlParams.get(param)
  if(action == undefined) return false
  return action
}
setInterval(() => {
	var queryString = window.location.search;
	var urlParams = new URLSearchParams(queryString);
	var action = urlParams.get('action')
	var type = urlParams.get('acnum')  
	if(action.toLowerCase() == "add"){
    if(parseInt(type) == 1){
		  chgAction(action === undefined || action === null ? 'add' : action, type === undefined || type === null || isNaN(type) ? '1' : type, document.getElementById("typeanime").value, document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value)
    }else if(parseInt(type) == 2){
	    var anime = urlParams.get('anime')
		  chgAction(action === undefined || action === null ? 'add' : action, type === undefined || type === null || isNaN(type) ? '1' : type, '', document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value, anime)
    }else{
      console.log(false)
    }
  }else if(action.toLowerCase() == "edit"){
	  var anime = urlParams.get('anime')
		chgAction(action === undefined || action === null ? 'edit' : action, type === undefined || type === null || isNaN(type) ? '1' : type, '', document.getElementById("password").value == undefined || document.getElementById("password").value == null ? 'null' : document.getElementById("password").value, anime)
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

  htmlPage = (animenew, allanime, page, movie, message) => {
    return `
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content='All-Language' http-equiv='Content-Language'/>
<meta name="DC.title" content="${this.domain} - Nonton Anime Subtitle Indonesia" />
<title>${this.domain} - Nonton Anime Subtitle Indonesia</title>
<meta name="keywords" content="" />
<meta name='robots' content='index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' />

	<!-- This site is optimized with the Yoast SEO plugin v17.8 - https://yoast.com/wordpress/plugins/seo/ -->
	<meta name="description" content="Nonton Anime Subtitle Indonesia" />
	<link rel="canonical" href="/" />
	<link rel="next" href="/page/2/" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="${this.domain}" />
	<meta property="og:description" content="Nonton Anime Subtitle Indonesia" />
	<meta property="og:url" content="/" />
	<meta property="og:site_name" content="${this.domain}" />
	<meta name="twitter:card" content="summary_large_image" />
	<!-- / Yoast SEO plugin. -->

<script>
document.body.classList.add("dark")
</script>
<link rel='dns-prefetch' href='//cdnjs.cloudflare.com' />
<link rel='dns-prefetch' href='//s.w.org' />
<link rel='stylesheet' id='wp-block-library-css'  href='/wp-includes/css/dist/block-library/style.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='Fontawesome 6-css'  href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='Style-css'  href='/wp-content/themes/ZStream/style.css' type='text/css' media='all' />
<link rel='stylesheet' id='Sweetalert-css'  href='/wp-content/themes/ZStream/assets/css/sweetalert2.min.css' type='text/css' media='all' />
<link rel='stylesheet' id='simple-favorites-css'  href='/wp-content/plugins/favorites/assets/css/favorites.css' type='text/css' media='all' />
<script type='text/javascript' src='/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js' id='Sweetalert JS-js'></script>
<script type='text/javascript' src='/wp-content/themes/ZStream/assets/js/jquery.min.js' id='jquery-js'></script>
<script type='text/javascript' src='/wp-content/plugins/favorites/assets/js/favorites.min.js' id='favorites-js'></script>
<meta name="generator" content="WordPress 5.8.2" />
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32" />
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192" />
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg" />
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg" />
${message === undefined ? '' : message}
</head>
<body class="dark">
<script>
document.body.classList.add("dark")
</script>
<style type="text/css">@-webkit-keyframes swal2-show {
	<style>
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="shortlink" href="/">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
</head>
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/anime-list/">Semua Anime</a></li>
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/movie-list/">Semua Movie</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-127"><a href="/genre/">Genre</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>
<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off"/>
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="notif">
<div class="container">
${this.news}</div>
</div>
<div class="popular">
<div class="container">  
<h2><span>Popular</span> Anime</h2>
<div class="flexbox">
    ${allanime}
</div>
</div>
</div>
<div class="container">
<h2><span>Latest</span> Update</h2>
<div class="flexbox">
${animenew.html}
</div>
<div class="pagination">
${page}
</main>

	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type='text/javascript' src='/wp-includes/js/wp-embed.min.js' id='wp-embed-js'></script>
	<div id="shadow"></div>
<a href="#" class="scrollToTop"><i class="fa-solid fa-arrow-up"></i></a>
</body>
</html>`
  }


  addLogs = (ip, page) => {
    console.log(chalk.green(`[${ip}] `) + chalk.red("Open ") + chalk.blue("Page ") + chalk.yellow(`${page[0].toUpperCase()}${page.slice(1)}`))
  }
  //FUNCTION WATCH
  loopingEps = (data) => {
    var textnya = ``
    var angka = 0
    data.eps.sort((a, b) => (a.eps > b.eps) ? 1 : -1)
    for (let i = 0; i < data.eps.length; i++) {
      if (isNaN(data.eps[i].eps)) {
        angka += 1
      }
      if(data.eps[i].eps === null) {
        filternull(data.nameurl)
      }
      textnya += `<li>
<div class="flexeps">
<div class="flexeps-play">  
<i class="fa-solid fa-play"></i>
</div>
<div class="flexeps-infoz">
<a href="/anime/${data.nameurl}/${data.eps[i].eps}" title="${data.nama} Episode ${data.eps[i].eps} Sub Indo"><span>${data.eps[i].eps === "OVA" ? "OVA Sub Indo" : `Episode ${data.eps[i].eps}`}${data.eps[i].eps === data.eps.length - angka ? data.status === true ? " - End" : "" : ""}</span><span class="date">${data.time}</span></a>
</div>
</div>
</li>`
    }
    return textnya
  }

  loopingDownload = async (data, eps) => {
    var textnya = ``
    const dbeps = await getDBEps(data.nameurl, eps)
    if(dbeps === undefined || dbeps === [] || dbeps.length < 1) return false
    for (let i = 0; i < dbeps.download.length; i++) {
      textnya += `<a href="` + dbeps.download[i].url + `" target="_blank">${dbeps.download[i].name}</a>`
    }
    return textnya
  }

  WatchAnime = (urlvid, data, eps, loopeps, loopdow, genre, rek) => {
    var textnya = `<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content="All-Language" http-equiv="Content-Language">
<meta name="DC.title" content="${data.nama} Episode ${eps} Sub Indo - ${this.domain}">
<title>${data.nama} Episode ${eps} Sub Indo - ${this.domain}</title>
<meta name="keywords" content="${data.nama} Episode ${eps} Sub Indo">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

	<!-- This site is optimized with the Yoast SEO plugin v17.8 - https://yoast.com/wordpress/plugins/seo/ -->
	<link rel="canonical" href="/anime/${data.nameurl}/${eps}/">
	<meta property="og:locale" content="en_US">
	<meta property="og:type" content="article">
	<meta property="og:title" content="${data.nama} Episode ${eps} Sub Indo - ${this.domain}">
	<meta property="og:url" content="/anime/${data.nameurl}/${eps}/">
	<meta property="og:site_name" content="${this.domain}">
	<meta property="article:published_time" content="2021-09-14T04:51:14+00:00">
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:label1" content="Written by">
	<meta name="twitter:data1" content="Uuk">
	<!-- / Yoast SEO plugin. -->


<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//s.w.org">
<link rel="alternate" type="application/rss+xml" title="${this.domain} Â» ${data.nama} ${eps} Sub Indo Comments Feed" href="/anime/${data.nameurl}/${eps}/">
<link rel="stylesheet" id="wp-block-library-css" href="/wp-includes/css/dist/block-library/style.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Fontawesome 6-css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Style-css" href="/wp-content/themes/ZStream/style.css" type="text/css" media="all">
<link rel="stylesheet" id="Sweetalert-css" href="/wp-content/themes/ZStream/assets/css/sweetalert2.min.css" type="text/css" media="all">
<link rel="stylesheet" id="simple-favorites-css" href="/wp-content/plugins/favorites/assets/css/favorites.css" type="text/css" media="all">
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js" id="Sweetalert JS-js"></script><style type="text/css">@-webkit-keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="shortlink" href="/">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/anime-list/">Semua Anime</a></li>
  <li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/movie-list/">Semua Movie</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-127"><a href="/genre/">Genre</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>


<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<meta itemprop="target" content="/search">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off">
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch" style="display: none;"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="container">
<div class="episodeflex">
<div class="episodeflex-content">
<div class="episodeflex-streaming">	
	
<div class="embed-stream"> 
<div class="playerload"></div>
<div id="pframe"><iframe src="`+ urlvid + `" rel="nofollow" frameborder="0" width="100%" height="100%" allowfullscreen="allowfullscreen"> </iframe></div>
</div>
<div class="nav-stream">
<div class="nextplay">
${parseInt(eps) - 1 < 1 ? "" : `<div class="nextplaybtn prev"> 
<a href="/anime/${data.nameurl}/${parseInt(eps) - 1}" rel="prev">Â« Prev</a></div>`}
<div class="nextplaybtn all">
<a href="/anime/${data.nameurl}" title="All Episode of ${data.nama}"><i class="fa-solid fa-list-ul"></i></a> 
</div>
${parseInt(eps) + 1 > data.eps.length ? "" : `<div class="nextplaybtn next">
<a href="/anime/${data.nameurl}/${parseInt(eps) + 1}" rel="next">Next Â»</a></div>`} 
</div>

<div class="nav-stream-right">
<a class="btnx dbox" ><i></i> </a></div> 
</div> 
</div>
</div>
<div class="episodeflex-sidebar">
<div class="sidebar-title">
<span class="now"><i class="fa-solid fa-circle-play"></i> Now Watching</span>
<h2>${data.nama} Episode ${eps}</h2>
<span class="infoz">${moment(getDBEps(data.nameurl, eps).time).tz('Asia/Jakarta').format('MMMMM DD, YYYY')} - ${getDBEps(data.nameurl, eps).ip.length} Views</span>
</div>
<div class="series-thumb">
<a href="/anime/${data.nameurl}/" title="${data.nama} Episode ${eps} Sub Indo">
<img src="${rek === false ? "https://i.ibb.co/RTYwBkS/150ba7b5-c0ab-4ad0-ac8b-5842f3cf4726.jpg" : data.thumb}?resize=225,310" alt="${data.nama}" title="${data.nama}"></a>
</div>
<div class="series-episode"><h2><span>More</span> Episode</h2><ul class="series-episodelist">
${loopeps}
</ul></div></div>
</div>
</div>
</div>
</main>
<script type="text/javascript">function showServer(){var s=document.getElementById("mirrorButtons");s.classList.contains("show")?s.classList.remove("show"):s.classList.add("show")}</script>
<script type="text/javascript">function changeDivContent(content,el){document.getElementById("pframe").innerHTML=content};$(document).ready(function(){$("#lamp").on('click',function(){$("header").addClass("cinema")
$('#shadow').fadeIn("1500");$('#shadow').click(function(e){if(!$(e.target).is('.embed-stream')){$("header").removeClass("cinema")
$('#shadow').fadeOut("1500");return!1}})})})</script>
<script type="text/javascript">$(document).ready(function(){$(document).on('favorites-updated-single',function(event,favorites,post_id,site_id,status){if(status==='active'){swal({title:'Saved',html:"Success added to Watchlist",type:'success',showCancelButton:!0,confirmButtonColor:'#3085d6',cancelButtonColor:'#d33',confirmButtonText:'Back',cancelButtonText:'Watchlist',animation:!0,reverseButtons:!0,}).then((result)=>{if(result.value){}else{window.location.href='/watchlist/'}})}else{swal({title:'Removed',html:"Success removed from Watchlist",type:'success',showCancelButton:!0,confirmButtonColor:'#3085d6',cancelButtonColor:'#d33',confirmButtonText:'Back',cancelButtonText:'Watchlist',animation:!0,reverseButtons:!0,}).then((result)=>{if(result.value){}else{window.location.href='/watchlist/?episode'}})}})})</script>

	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type="text/javascript">function fetchResults(){var keyword=jQuery('#search').val();if(keyword==""){jQuery('#datafetch').css("display","none");jQuery('#datafetch').html("")}else{jQuery('#datafetch').css("display","block");jQuery('#datafetch').html("<span>Loading...</span>");jQuery.ajax({url:'/wp-admin/admin-ajax.php',type:'post',data:{action:'data_fetch',keyword:keyword},success:function(data){jQuery('#datafetch').html(data)}})}}
$('body').on('click',function(event){$('#datafetch').empty().hide()})</script>
<script type="text/javascript" src="/wp-includes/js/comment-reply.min.js" id="comment-reply-js"></script>
<script type="text/javascript" src="/wp-includes/js/wp-embed.min.js" id="wp-embed-js"></script>
	<div id="shadow" style="display: none;"></div>
<a href="#" class="scrollToTop" style="display: none;"><i class="fa-solid fa-arrow-up"></i></a>
<script type="text/javascript">jQuery(function(e){"darkmode"==localStorage.getItem("theme-mode")&&e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").on("click",function(t){e(this).is(":checked")?(e("body").addClass("dark"),e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!0)}),localStorage.setItem("theme-mode","darkmode")):(e("body").removeClass("dark"),e(".switch").html('<i class="fa-solid fa-moon fa-fw"></i> Dark Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!1)}),localStorage.setItem("theme-mode","lightmode"))})});</script>
<script type="text/javascript">$(document).ready(function(){$(window).scroll(function(){if($(this).scrollTop()>100){$('.scrollToTop').fadeIn()}else{$('.scrollToTop').fadeOut()}});$('.scrollToTop').click(function(){$('html, body').animate({scrollTop:0},100);return!1})})</script>

<iframe style="display: none;"></iframe></body></html>`
    return textnya
  }
  // FUNCTION GET PAGE
  getPageBarOngoing = (page, allpage) => {
    page = page === undefined ? 1 : page
    if (isNaN(page)) {
      page = 1
    }
    var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) - 1}">Â« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) - 2}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage === parseInt(page) ? `` : allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>`}
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/ongoing/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
${allpage === parseInt(page) ? allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 5 > allpage ? `` : `<a class="page-numbers">..</a>`} 
${parseInt(page) + 5 > allpage ? `` : `<a class="page-numbers" href="/ongoing/${allpage}">${allpage}</a>`} 
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/ongoing/${parseInt(page) + 1}">Next &raquo;</a>`}</div>`
    return textnya
  }
  getPageBarGenre = (page, allpage, type) => {
    page = page === undefined ? 1 : page
    if (isNaN(page)) {
      page = 1
    }
    var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) - 1}">Â« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) - 2}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage === parseInt(page) ? `` : allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>`}
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/genre/${type}/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
${allpage === parseInt(page) ? allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/genre/${type}/${parseInt(page) + 1}">Next &raquo;</a>`}</div>`
    return textnya
  }
  getPageBarSearc = (page, allpage, pw) => {
    page = page === undefined ? 1 : page
    if (isNaN(page)) {
      page = 1
    }
    var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/search/${pw}/${parseInt(page) - 1}">Â« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/search/${pw}/${parseInt(page) - 2}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/search/${pw}/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage === parseInt(page) ? `` : allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>`}
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/search/${pw}/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/search/${pw}/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
${allpage === parseInt(page) ? allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 5 > allpage ? `` : `<a class="page-numbers">..</a>`} 
${parseInt(page) + 5 > allpage ? `` : `<a class="page-numbers" href="/search/${pw}/${allpage}">${allpage}</a>`} 
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/search/${pw}/${parseInt(page) + 1}">Next &raquo;</a>`}</div>`
    return textnya
  }
  getPageBar = (page, allpage) => {
    if (isNaN(page)) {
      page = 1
    }
    var textnya = `${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) - 1}">Â« Previous</a>`}
${parseInt(page) - 2 < 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) - 2}">${parseInt(page) - 2}</a>`}
${parseInt(page) - 1 < 1 ? `` : `<a class="page-numbers" href="/page/${parseInt(page) - 1}">${parseInt(page) - 1}</a>`}
${allpage === parseInt(page) ? `` : allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>`}
${parseInt(page) + 1 > allpage ? `` : `<a class="page-numbers" href="/page/${parseInt(page) + 1}">${parseInt(page) + 1}</a>`} 
${parseInt(page) + 2 > allpage ? `` : `<a class="page-numbers" href="/page/${parseInt(page) + 2}">${parseInt(page) + 2}</a>`} 
${allpage === parseInt(page) ? allpage === 1 ? `` : `<span aria-current="page" class="page-numbers current">${parseInt(page)}</span>` : ``}
${parseInt(page) + 5 > allpage ? `` : `<a class="page-numbers">..</a>`} 
${parseInt(page) + 5 > allpage ? `` : `<a class="page-numbers" href="/page/${allpage}">${allpage}</a>`} 
${parseInt(page) + 1 > allpage ? `` : `<a class="next page-numbers" href="/page/${parseInt(page) + 1}">Next &raquo;</a>`}</div>`
    return textnya
  }
  //FUNCTION PAGE
  NewrilisPage = (datas, page, device, dat) => {
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
      var textnya = ``
      for (let i = data.length - 1; i > -1; i--) {
        if (data[i].type === "TV" || data[i].type === "BD") {
          const dataC = checkData(data[i].url.replace("/anime/", ""))
          //isImage(checkThumb(data[i].url.replace("/anime/", ""))).then(dataimg => {
          const thumbC = checkThumb(data[i].url.replace("/anime/", "")) //dataimg ? checkThumb(data[i].url.replace("/anime/", "")) : "https://i.ibb.co/RTYwBkS/150ba7b5-c0ab-4ad0-ac8b-5842f3cf4726.jpg"
          //console.log(thumbC, dataimg, checkThumb(data[i].url.replace("/anime/", "")))
          const checkFilter = checkNameUrls(data[i].url.replace("/anime/", ""))
          const dam = dataEnd(dataC)
          textnya += `<div class="flexbox-item">
<a href="${data[i].url}/${data[i].eps}" title="${data[i].nama}">
<div class="flexbox-thumb">
<img src="${thumbC}" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 150px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class="flexbox-type ${dataC.type}">${dataC.type}</div>
<div class="flexbox-status ${dataC.status === true ? "Completed" : "Ongoing"}">${dataC.status === true ? "Completed" : "Ongoing"}</div>
<div class="flexbox-episode"><span class="eps">Episode</span><span>${data[i].eps}${data[i].eps === dataC.eps.length - dam ? dataC.status === true ? " - End" : "" : ""}</span></div>
</div>
<div class="flexbox-title">${data[i].nama}</div>
</a>
</div>`
          //})
        }
      }
      const allPage = data.length / 12
      return { html: textnya, page: Math.ceil(allPage) }
    } else {
      // FILTER AKHIR
      let satu = 12 * pageX
      let dua = data.length - satu - 1
      // FILTER AWAL
      let awal1 = pageX - 1
      let awal2 = 12 * awal1
      let awal3 = data.length - awal2 - 1
      var textnya = ``
      if (awal3 < 1) return false
      if (awal3 < 12) {
        let filternya = pageX - 1
        let damnya = 12 * filternya
        for (let i = data.length - damnya - 1; i > -1; i--) {
          if (data[i].type === "TV" || data[i].type === "BD") {
            const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
            const dataC = checkData(data[i].url.replace("/anime/", ""))
            const checkFilter = checkNameUrls(data[i].url.replace("/anime/", ""))
            const dam = dataEnd(dataC)
            textnya += `<div class="flexbox-item">
<a href="${data[i].url}/${data[i].eps}" title="${data[i].nama}">
<div class="flexbox-thumb"> 
<img src="${thumbC}" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 150px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class="flexbox-type ${dataC.type}">${dataC.type}</div>
<div class="flexbox-status ${dataC.status === true ? "Completed" : "Ongoing"}">${dataC.status === true ? "Completed" : "Ongoing"}</div>
<div class="flexbox-episode"><span class="eps">Episode</span><span>${data[i].eps}${data[i].eps === dataC.eps.length - dam ? dataC.status === true ? " - End" : "" : ""}</span></div>
</div>
<div class="flexbox-title">${data[i].nama}</div>
</a>
</div>`
          }
        }
        const allPage = data.length / 12
        return { html: textnya, page: Math.ceil(allPage) }
      } else {
        for (let i = awal3; i > dua; i--) {
          if (data[i].type === "TV" || data[i].type === "BD") {
            const dataC = checkData(data[i].url.replace("/anime/", ""))
            const thumbC = checkThumb(data[i].url.replace("/anime/", ""))
            const checkFilter = checkNameUrls(data[i].url.replace("/anime/", ""))
            const dam = dataEnd(dataC)
            textnya += `<div class="flexbox-item">
<a href="${data[i].url}/${data[i].eps}" title="${data[i].nama}">
<div class="flexbox-thumb"> 
<img src="${thumbC}" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 150px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class="flexbox-type ${dataC.type}">${dataC.type}</div>
<div class="flexbox-status ${dataC.status === true ? "Completed" : "Ongoing"}">${dataC.status === true ? "Completed" : "Ongoing"}</div>
<div class="flexbox-episode"><span class="eps">Episode</span><span>${data[i].eps}${data[i].eps === dataC.eps.length - dam ? dataC.status === true ? " - End" : "" : ""}</span></div>
</div>
<div class="flexbox-title">${data[i].nama}</div>
</a>
</div>`
            //})
          }
        }
        const allPage = data.length / 12
        return { html: textnya, page: Math.ceil(allPage) }
      }
    }
  }
  topviewAnime = (data, device) => {
    var textnya = ``
    if (data.length < 7) {
      data.sort((a, b) => (a.view < b.view) ? 1 : -1)
      for (let i = 0; i < data.length; i++) {
        textnya += `<div class='flexbox-item'><a href='/anime/${data[i].nameurl}' title='${data[i].nameurl}'><div class='flexbox-thumb'><img src="${data[i].thumb}" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 175px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class='flexbox-number'>${i + 1}</div></div><div class='flexbox-title'>${data[i].nama}</div></a></div>`
      }
      return textnya
    } else {
      data.sort((a, b) => (a.view < b.view) ? 1 : -1)
      for (let i = 0; i < 6; i++) {
        textnya += `<div class='flexbox-item'><a href='/anime/${data[i].nameurl}' title='${data[i].nameurl}'><div class='flexbox-thumb'><img src="${data[i].thumb}" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 175px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class='flexbox-number'>${i + 1}</div></div><div class='flexbox-title'>${data[i].nama}</div></a></div>`
      }
      return textnya
    }
  }

  animeList = (htmlaz) => `<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content="All-Language" http-equiv="Content-Language">
<meta name="DC.title" content="Semua Anime - ${this.domain}">
<title>Semua Anime - ${this.domain}</title>
<meta name="keywords" content="Semua Anime">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

	<!-- This site is optimized with the Yoast SEO plugin v17.8 - https://yoast.com/wordpress/plugins/seo/ -->
	<link rel="canonical" href="/anime-list/">
	<meta property="og:locale" content="en_US">
	<meta property="og:type" content="article">
	<meta property="og:title" content="Semua Anime - ${this.domain}">
	<meta property="og:url" content="/anime-list/">
	<meta property="og:site_name" content="${this.domain}">
	<meta property="article:modified_time" content="2021-09-15T15:10:16+00:00">
	<meta name="twitter:card" content="summary_large_image">
	<!-- / Yoast SEO plugin. -->

<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//s.w.org">
<link rel="stylesheet" id="/wp-block-library-css" href="/wp-includes/css/dist/block-library/style.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Fontawesome 6-css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Style-css" href="/wp-content/themes/ZStream/style.css" type="text/css" media="all">
<link rel="stylesheet" id="Sweetalert-css" href="/wp-content/themes/ZStream/assets/css/sweetalert2.min.css" type="text/css" media="all">
<link rel="stylesheet" id="simple-favorites-css" href="/wp-content/plugins/favorites/assets/css/favorites.css" type="text/css" media="all">
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js" id="Sweetalert JS-js"></script><style type="text/css">@-webkit-keyframes swal2-show {
	<style>
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="shortlink" href="/">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
</head>
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-ancestor current-menu-parent menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-10 current_page_item menu-item-16"><a href="/anime-list/" aria-current="page">Semua Anime</a></li>
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-10 current_page_item menu-item-16"><a href="/movie-list/" aria-current="page">Semua Movie</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-127"><a href="/genre/">Genre</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>


<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<meta itemprop="target" content="/search">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off">
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch" style="display: none;"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="container"><h2><span>Anime</span> List</h2>
<div class="animelist">
 
	<div class="animelist-nav"><a href="##">#</a><a href="#1-9">1-9</a><a href="#A">A</a><a href="#B">B</a><a href="#C">C</a><a href="#D">D</a><a href="#E">E</a><a href="#F">F</a><a href="#G">G</a><a href="#H">H</a><a href="#I">I</a><a href="#J">J</a><a href="#K">K</a><a href="#L">L</a><a href="#M">M</a><a href="#N">N</a><a href="#O">O</a><a href="#P">P</a><a href="#Q">Q</a><a href="#R">R</a><a href="#S">S</a><a href="#T">T</a><a href="#U">U</a><a href="#V">V</a><a href="#W">W</a><a href="#X">X</a><a href="#Y">Y</a><a href="#Z">Z</a></div>
	${htmlaz}
	</div>

</div>
</main>

	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type="text/javascript" src="/wp-includes/js/wp-embed.min.js" id="/wp-embed-js"></script>
	<div id="shadow"></div>
<a href="#" class="scrollToTop" style="display: none;"><i class="fa-solid fa-arrow-up"></i></a>
<script type="text/javascript">jQuery(function(e){"darkmode"==localStorage.getItem("theme-mode")&&e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").on("click",function(t){e(this).is(":checked")?(e("body").addClass("dark"),e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!0)}),localStorage.setItem("theme-mode","darkmode")):(e("body").removeClass("dark"),e(".switch").html('<i class="fa-solid fa-moon fa-fw"></i> Dark Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!1)}),localStorage.setItem("theme-mode","lightmode"))})});</script>
<script type="text/javascript">$(document).ready(function(){$(window).scroll(function(){if($(this).scrollTop()>100){$('.scrollToTop').fadeIn()}else{$('.scrollToTop').fadeOut()}});$('.scrollToTop').click(function(){$('html, body').animate({scrollTop:0},100);return!1})})</script>

</body></html>`

  genreHtml = (genremove, bargenre, type, kat) => `<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style><head><link type="text/css" rel="stylesheet" id="dark-mode-custom-link"><link type="text/css" rel="stylesheet" id="dark-mode-general-link"><style lang="en" type="text/css" id="dark-mode-custom-style"></style><style lang="en" type="text/css" id="dark-mode-native-style"></style>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="revisit-after" content="1 days">
<meta name="rating" content="general">
<meta name="distribution" content="global">
<meta name="target" content="global">
<meta content="All-Language" http-equiv="Content-Language">
<meta name="DC.title" content="Action Archives - ${this.domain}">
<title>Action Archives - ${this.domain}</title>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

	<!-- This site is optimized with the Yoast SEO plugin v17.8 - https://yoast.com/wordpress/plugins/seo/ -->
	<link rel="canonical" href="/">
	<link rel="next" href="/">
	<meta property="og:locale" content="en_US">
	<meta property="og:type" content="article">
	<meta property="og:title" content="Action Archives - ${this.domain}">
	<meta property="og:url" content="/">
	<meta property="og:site_name" content="${this.domain}">
	<meta name="twitter:card" content="summary_large_image">
	<script type="application/ld+json" class="yoast-schema-graph">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"/#website","url":"/","name":"${this.domain}","description":"Nonton Anime Subtitle Indonesia","potentialAction":[{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"/?s={search_term_string}"},"query-input":"required name=search_term_string"}],"inLanguage":"en-US"},{"@type":"CollectionPage","@id":"/genre/action/#webpage","url":"/genre/action/","name":"Action Archives - ${this.domain}","isPartOf":{"@id":"/#website"},"breadcrumb":{"@id":"/genre/action/#breadcrumb"},"inLanguage":"en-US","potentialAction":[{"@type":"ReadAction","target":["/genre/action/"]}]},{"@type":"BreadcrumbList","@id":"/genre/action/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"/"},{"@type":"ListItem","position":2,"name":"Action"}]}]}</script>
	<!-- / Yoast SEO plugin. -->


<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//s.w.org">
<link rel="alternate" type="application/rss+xml" title="${this.domain} Â» Action Genre Feed" href="/genre/action/feed/">
<link rel="stylesheet" id="wp-block-library-css" href="/wp-includes/css/dist/block-library/style.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Fontawesome 6-css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" type="text/css" media="all">
<link rel="stylesheet" id="Style-css" href="/wp-content/themes/ZStream/style.css" type="text/css" media="all">
<link rel="stylesheet" id="Sweetalert-css" href="/wp-content/themes/ZStream/assets/css/sweetalert2.min.css" type="text/css" media="all">
<link rel="stylesheet" id="simple-favorites-css" href="/wp-content/plugins/favorites/assets/css/favorites.css" type="text/css" media="all">
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/sweetalert2.all.min.js" id="Sweetalert JS-js"></script><style type="text/css">@-webkit-keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style><style type="text/css">@-webkit-keyframes swal2-show {
<style>
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@keyframes swal2-show {
  0% {
    -webkit-transform: scale(0.7);
            transform: scale(0.7); }
  45% {
    -webkit-transform: scale(1.05);
            transform: scale(1.05); }
  80% {
    -webkit-transform: scale(0.95);
            transform: scale(0.95); }
  100% {
    -webkit-transform: scale(1);
            transform: scale(1); } }

@-webkit-keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@keyframes swal2-hide {
  0% {
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; }
  100% {
    -webkit-transform: scale(0.5);
            transform: scale(0.5);
    opacity: 0; } }

@-webkit-keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@keyframes swal2-animate-success-line-tip {
  0% {
    top: 19px;
    left: 1px;
    width: 0; }
  54% {
    top: 17px;
    left: 2px;
    width: 0; }
  70% {
    top: 35px;
    left: -6px;
    width: 50px; }
  84% {
    top: 48px;
    left: 21px;
    width: 17px; }
  100% {
    top: 45px;
    left: 14px;
    width: 25px; } }

@-webkit-keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@keyframes swal2-animate-success-line-long {
  0% {
    top: 54px;
    right: 46px;
    width: 0; }
  65% {
    top: 54px;
    right: 46px;
    width: 0; }
  84% {
    top: 35px;
    right: 0;
    width: 55px; }
  100% {
    top: 38px;
    right: 8px;
    width: 47px; } }

@-webkit-keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@keyframes swal2-rotate-success-circular-line {
  0% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  5% {
    -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg); }
  12% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); }
  100% {
    -webkit-transform: rotate(-405deg);
            transform: rotate(-405deg); } }

@-webkit-keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@keyframes swal2-animate-error-x-mark {
  0% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  50% {
    margin-top: 26px;
    -webkit-transform: scale(0.4);
            transform: scale(0.4);
    opacity: 0; }
  80% {
    margin-top: -6px;
    -webkit-transform: scale(1.15);
            transform: scale(1.15); }
  100% {
    margin-top: 0;
    -webkit-transform: scale(1);
            transform: scale(1);
    opacity: 1; } }

@-webkit-keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

@keyframes swal2-animate-error-icon {
  0% {
    -webkit-transform: rotateX(100deg);
            transform: rotateX(100deg);
    opacity: 0; }
  100% {
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
    opacity: 1; } }

body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-align: stretch;
      -ms-flex-align: stretch;
          align-items: stretch; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-actions {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end;
    height: 2.2em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-loading {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-input {
    height: 2em;
    margin: .3125em auto;
    font-size: 1em; }
  body.swal2-toast-shown.swal2-has-input > .swal2-container > .swal2-toast .swal2-validationerror {
    font-size: 1em; }

body.swal2-toast-shown > .swal2-container {
  position: fixed;
  background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-shown {
    background-color: transparent; }
  body.swal2-toast-shown > .swal2-container.swal2-top {
    top: 0;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-top-end, body.swal2-toast-shown > .swal2-container.swal2-top-right {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto; }
  body.swal2-toast-shown > .swal2-container.swal2-top-start, body.swal2-toast-shown > .swal2-container.swal2-top-left {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-center-start, body.swal2-toast-shown > .swal2-container.swal2-center-left {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center {
    top: 50%;
    right: auto;
    bottom: auto;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-toast-shown > .swal2-container.swal2-center-end, body.swal2-toast-shown > .swal2-container.swal2-center-right {
    top: 50%;
    right: 0;
    bottom: auto;
    left: auto;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-start, body.swal2-toast-shown > .swal2-container.swal2-bottom-left {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0; }
  body.swal2-toast-shown > .swal2-container.swal2-bottom {
    top: auto;
    right: auto;
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-toast-shown > .swal2-container.swal2-bottom-end, body.swal2-toast-shown > .swal2-container.swal2-bottom-right {
    top: auto;
    right: 0;
    bottom: 0;
    left: auto; }

.swal2-popup.swal2-toast {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  width: auto;
  padding: 0.625em;
  -webkit-box-shadow: 0 0 10px #d9d9d9;
          box-shadow: 0 0 10px #d9d9d9;
  overflow-y: hidden; }
  .swal2-popup.swal2-toast .swal2-header {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
        -ms-flex-direction: row;
            flex-direction: row; }
  .swal2-popup.swal2-toast .swal2-title {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    margin: 0 .6em;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-close {
    position: initial; }
  .swal2-popup.swal2-toast .swal2-content {
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start;
    font-size: 1em; }
  .swal2-popup.swal2-toast .swal2-icon {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-info, .swal2-popup.swal2-toast .swal2-icon.swal2-warning, .swal2-popup.swal2-toast .swal2-icon.swal2-question {
      font-size: 26px;
      line-height: 32px; }
    .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      top: 14px;
      width: 22px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 5px; }
      .swal2-popup.swal2-toast .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 5px; }
  .swal2-popup.swal2-toast .swal2-actions {
    height: auto;
    margin: 0 .3125em; }
  .swal2-popup.swal2-toast .swal2-styled {
    margin: 0 .3125em;
    padding: .3125em .625em;
    font-size: 1em; }
    .swal2-popup.swal2-toast .swal2-styled:focus {
      -webkit-box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 1px #fff, 0 0 0 2px rgba(50, 100, 150, 0.4); }
  .swal2-popup.swal2-toast .swal2-success {
    border-color: #a5dc86; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 32px;
      height: 45px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -4px;
        left: -15px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 32px 32px;
                transform-origin: 32px 32px;
        border-radius: 64px 0 0 64px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -4px;
        left: 15px;
        -webkit-transform-origin: 0 32px;
                transform-origin: 0 32px;
        border-radius: 0 64px 64px 0; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-ring {
      width: 32px;
      height: 32px; }
    .swal2-popup.swal2-toast .swal2-success .swal2-success-fix {
      top: 0;
      left: 7px;
      width: 7px;
      height: 43px; }
    .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'] {
      height: 5px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 18px;
        left: 3px;
        width: 12px; }
      .swal2-popup.swal2-toast .swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 15px;
        right: 3px;
        width: 22px; }
  .swal2-popup.swal2-toast.swal2-show {
    -webkit-animation: showSweetToast .5s;
            animation: showSweetToast .5s; }
  .swal2-popup.swal2-toast.swal2-hide {
    -webkit-animation: hideSweetToast .2s forwards;
            animation: hideSweetToast .2s forwards; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-tip {
    -webkit-animation: animate-toast-success-tip .75s;
            animation: animate-toast-success-tip .75s; }
  .swal2-popup.swal2-toast .swal2-animate-success-icon .swal2-success-line-long {
    -webkit-animation: animate-toast-success-long .75s;
            animation: animate-toast-success-long .75s; }

@-webkit-keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@keyframes showSweetToast {
  0% {
    -webkit-transform: translateY(-10px) rotateZ(2deg);
            transform: translateY(-10px) rotateZ(2deg);
    opacity: 0; }
  33% {
    -webkit-transform: translateY(0) rotateZ(-2deg);
            transform: translateY(0) rotateZ(-2deg);
    opacity: .5; }
  66% {
    -webkit-transform: translateY(5px) rotateZ(2deg);
            transform: translateY(5px) rotateZ(2deg);
    opacity: .7; }
  100% {
    -webkit-transform: translateY(0) rotateZ(0);
            transform: translateY(0) rotateZ(0);
    opacity: 1; } }

@-webkit-keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@keyframes hideSweetToast {
  0% {
    opacity: 1; }
  33% {
    opacity: .5; }
  100% {
    -webkit-transform: rotateZ(1deg);
            transform: rotateZ(1deg);
    opacity: 0; } }

@-webkit-keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@keyframes animate-toast-success-tip {
  0% {
    top: 9px;
    left: 1px;
    width: 0; }
  54% {
    top: 2px;
    left: 2px;
    width: 0; }
  70% {
    top: 10px;
    left: -4px;
    width: 26px; }
  84% {
    top: 17px;
    left: 12px;
    width: 8px; }
  100% {
    top: 18px;
    left: 3px;
    width: 12px; } }

@-webkit-keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

@keyframes animate-toast-success-long {
  0% {
    top: 26px;
    right: 22px;
    width: 0; }
  65% {
    top: 20px;
    right: 15px;
    width: 0; }
  84% {
    top: 15px;
    right: 0;
    width: 18px; }
  100% {
    top: 15px;
    right: 3px;
    width: 22px; } }

html.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown),
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
  height: auto;
  overflow-y: hidden; }

body.swal2-no-backdrop .swal2-shown {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  background-color: transparent; }
  body.swal2-no-backdrop .swal2-shown > .swal2-modal {
    -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  body.swal2-no-backdrop .swal2-shown.swal2-top {
    top: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-top-start, body.swal2-no-backdrop .swal2-shown.swal2-top-left {
    top: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-top-end, body.swal2-no-backdrop .swal2-shown.swal2-top-right {
    top: 0;
    right: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-center {
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-start, body.swal2-no-backdrop .swal2-shown.swal2-center-left {
    top: 50%;
    left: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-center-end, body.swal2-no-backdrop .swal2-shown.swal2-center-right {
    top: 50%;
    right: 0;
    -webkit-transform: translateY(-50%);
            transform: translateY(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom {
    bottom: 0;
    left: 50%;
    -webkit-transform: translateX(-50%);
            transform: translateX(-50%); }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-start, body.swal2-no-backdrop .swal2-shown.swal2-bottom-left {
    bottom: 0;
    left: 0; }
  body.swal2-no-backdrop .swal2-shown.swal2-bottom-end, body.swal2-no-backdrop .swal2-shown.swal2-bottom-right {
    right: 0;
    bottom: 0; }

.swal2-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  padding: 10px;
  background-color: transparent;
  z-index: 1060;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; }
  .swal2-container.swal2-top {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start; }
  .swal2-container.swal2-top-start, .swal2-container.swal2-top-left {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-top-end, .swal2-container.swal2-top-right {
    -webkit-box-align: start;
        -ms-flex-align: start;
            align-items: flex-start;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-center {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-container.swal2-center-start, .swal2-container.swal2-center-left {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-center-end, .swal2-container.swal2-center-right {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-bottom {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end; }
  .swal2-container.swal2-bottom-start, .swal2-container.swal2-bottom-left {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: start;
        -ms-flex-pack: start;
            justify-content: flex-start; }
  .swal2-container.swal2-bottom-end, .swal2-container.swal2-bottom-right {
    -webkit-box-align: end;
        -ms-flex-align: end;
            align-items: flex-end;
    -webkit-box-pack: end;
        -ms-flex-pack: end;
            justify-content: flex-end; }
  .swal2-container.swal2-grow-fullscreen > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-item-align: stretch;
        align-self: stretch;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-row > .swal2-modal {
    display: -webkit-box !important;
    display: -ms-flexbox !important;
    display: flex !important;
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -ms-flex-line-pack: center;
        align-content: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
  .swal2-container.swal2-grow-column {
    -webkit-box-flex: 1;
        -ms-flex: 1;
            flex: 1;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column; }
    .swal2-container.swal2-grow-column.swal2-top, .swal2-container.swal2-grow-column.swal2-center, .swal2-container.swal2-grow-column.swal2-bottom {
      -webkit-box-align: center;
          -ms-flex-align: center;
              align-items: center; }
    .swal2-container.swal2-grow-column.swal2-top-start, .swal2-container.swal2-grow-column.swal2-center-start, .swal2-container.swal2-grow-column.swal2-bottom-start, .swal2-container.swal2-grow-column.swal2-top-left, .swal2-container.swal2-grow-column.swal2-center-left, .swal2-container.swal2-grow-column.swal2-bottom-left {
      -webkit-box-align: start;
          -ms-flex-align: start;
              align-items: flex-start; }
    .swal2-container.swal2-grow-column.swal2-top-end, .swal2-container.swal2-grow-column.swal2-center-end, .swal2-container.swal2-grow-column.swal2-bottom-end, .swal2-container.swal2-grow-column.swal2-top-right, .swal2-container.swal2-grow-column.swal2-center-right, .swal2-container.swal2-grow-column.swal2-bottom-right {
      -webkit-box-align: end;
          -ms-flex-align: end;
              align-items: flex-end; }
    .swal2-container.swal2-grow-column > .swal2-modal {
      display: -webkit-box !important;
      display: -ms-flexbox !important;
      display: flex !important;
      -webkit-box-flex: 1;
          -ms-flex: 1;
              flex: 1;
      -ms-flex-line-pack: center;
          align-content: center;
      -webkit-box-pack: center;
          -ms-flex-pack: center;
              justify-content: center; }
  .swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right) > .swal2-modal {
    margin: auto; }
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .swal2-container .swal2-modal {
      margin: 0 !important; } }
  .swal2-container.swal2-fade {
    -webkit-transition: background-color .1s;
    transition: background-color .1s; }
  .swal2-container.swal2-shown {
    background-color: rgba(0, 0, 0, 0.4); }

.swal2-popup {
  display: none;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
      -ms-flex-direction: column;
          flex-direction: column;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 0.3125em;
  background: #fff;
  font-family: inherit;
  font-size: 1rem;
  -webkit-box-sizing: border-box;
          box-sizing: border-box; }
  .swal2-popup:focus {
    outline: none; }
  .swal2-popup.swal2-loading {
    overflow-y: hidden; }
  .swal2-popup .swal2-header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
        -ms-flex-direction: column;
            flex-direction: column;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center; }
  .swal2-popup .swal2-title {
    display: block;
    position: relative;
    max-width: 100%;
    margin: 0 0 0.4em;
    padding: 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word; }
  .swal2-popup .swal2-actions {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em auto 0; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled[disabled] {
      opacity: .4; }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:hover {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.1)), to(rgba(0, 0, 0, 0.1)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)); }
    .swal2-popup .swal2-actions:not(.swal2-loading) .swal2-styled:active {
      background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0, 0, 0, 0.2)), to(rgba(0, 0, 0, 0.2)));
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)); }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-confirm {
      width: 2.5em;
      height: 2.5em;
      margin: .46875em;
      padding: 0;
      border: .25em solid transparent;
      border-radius: 100%;
      border-color: transparent;
      background-color: transparent !important;
      color: transparent;
      cursor: default;
      -webkit-box-sizing: border-box;
              box-sizing: border-box;
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none; }
    .swal2-popup .swal2-actions.swal2-loading .swal2-styled.swal2-cancel {
      margin-right: 30px;
      margin-left: 30px; }
    .swal2-popup .swal2-actions.swal2-loading :not(.swal2-styled).swal2-confirm::after {
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-left: 5px;
      border: 3px solid #999999;
      border-radius: 50%;
      border-right-color: transparent;
      -webkit-box-shadow: 1px 1px 1px #fff;
              box-shadow: 1px 1px 1px #fff;
      content: '';
      -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
              animation: swal2-rotate-loading 1.5s linear 0s infinite normal; }
  .swal2-popup .swal2-styled {
    margin: 0 .3125em;
    padding: .625em 2em;
    font-weight: 500;
    -webkit-box-shadow: none;
            box-shadow: none; }
    .swal2-popup .swal2-styled:not([disabled]) {
      cursor: pointer; }
    .swal2-popup .swal2-styled.swal2-confirm {
      border: 0;
      border-radius: 0.25em;
      background-color: #3085d6;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled.swal2-cancel {
      border: 0;
      border-radius: 0.25em;
      background-color: #aaa;
      color: #fff;
      font-size: 1.0625em; }
    .swal2-popup .swal2-styled:focus {
      outline: none;
      -webkit-box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4);
              box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(50, 100, 150, 0.4); }
    .swal2-popup .swal2-styled::-moz-focus-inner {
      border: 0; }
  .swal2-popup .swal2-footer {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 1.25em 0 0;
    padding-top: 1em;
    border-top: 1px solid #eee;
    color: #545454;
    font-size: 1em; }
  .swal2-popup .swal2-image {
    max-width: 100%;
    margin: 1.25em auto; }
  .swal2-popup .swal2-close {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    width: 1.2em;
    min-width: 1.2em;
    height: 1.2em;
    margin: 0;
    padding: 0;
    -webkit-transition: color 0.1s ease-out;
    transition: color 0.1s ease-out;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #cccccc;
    font-family: serif;
    font-size: calc(2.5em - 0.25em);
    line-height: 1.2em;
    cursor: pointer; }
    .swal2-popup .swal2-close:hover {
      -webkit-transform: none;
              transform: none;
      color: #f27474; }
  .swal2-popup > .swal2-input,
  .swal2-popup > .swal2-file,
  .swal2-popup > .swal2-textarea,
  .swal2-popup > .swal2-select,
  .swal2-popup > .swal2-radio,
  .swal2-popup > .swal2-checkbox {
    display: none; }
  .swal2-popup .swal2-content {
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    margin: 0;
    padding: 0;
    color: #545454;
    font-size: 1.125em;
    font-weight: 300;
    line-height: normal;
    word-wrap: break-word; }
  .swal2-popup #swal2-content {
    text-align: center; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea,
  .swal2-popup .swal2-select,
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    margin: 1em auto; }
  .swal2-popup .swal2-input,
  .swal2-popup .swal2-file,
  .swal2-popup .swal2-textarea {
    width: 100%;
    -webkit-transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, -webkit-box-shadow .3s;
    transition: border-color .3s, box-shadow .3s;
    transition: border-color .3s, box-shadow .3s, -webkit-box-shadow .3s;
    border: 1px solid #d9d9d9;
    border-radius: 0.1875em;
    font-size: 1.125em;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
    -webkit-box-sizing: border-box;
            box-sizing: border-box; }
    .swal2-popup .swal2-input.swal2-inputerror,
    .swal2-popup .swal2-file.swal2-inputerror,
    .swal2-popup .swal2-textarea.swal2-inputerror {
      border-color: #f27474 !important;
      -webkit-box-shadow: 0 0 2px #f27474 !important;
              box-shadow: 0 0 2px #f27474 !important; }
    .swal2-popup .swal2-input:focus,
    .swal2-popup .swal2-file:focus,
    .swal2-popup .swal2-textarea:focus {
      border: 1px solid #b4dbed;
      outline: none;
      -webkit-box-shadow: 0 0 3px #c4e6f5;
              box-shadow: 0 0 3px #c4e6f5; }
    .swal2-popup .swal2-input::-webkit-input-placeholder,
    .swal2-popup .swal2-file::-webkit-input-placeholder,
    .swal2-popup .swal2-textarea::-webkit-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input:-ms-input-placeholder,
    .swal2-popup .swal2-file:-ms-input-placeholder,
    .swal2-popup .swal2-textarea:-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::-ms-input-placeholder,
    .swal2-popup .swal2-file::-ms-input-placeholder,
    .swal2-popup .swal2-textarea::-ms-input-placeholder {
      color: #cccccc; }
    .swal2-popup .swal2-input::placeholder,
    .swal2-popup .swal2-file::placeholder,
    .swal2-popup .swal2-textarea::placeholder {
      color: #cccccc; }
  .swal2-popup .swal2-range input {
    width: 80%; }
  .swal2-popup .swal2-range output {
    width: 20%;
    font-weight: 600;
    text-align: center; }
  .swal2-popup .swal2-range input,
  .swal2-popup .swal2-range output {
    height: 2.625em;
    margin: 1em auto;
    padding: 0;
    font-size: 1.125em;
    line-height: 2.625em; }
  .swal2-popup .swal2-input {
    height: 2.625em;
    padding: 0.75em; }
    .swal2-popup .swal2-input[type='number'] {
      max-width: 10em; }
  .swal2-popup .swal2-file {
    font-size: 1.125em; }
  .swal2-popup .swal2-textarea {
    height: 6.75em;
    padding: 0.75em; }
  .swal2-popup .swal2-select {
    min-width: 50%;
    max-width: 100%;
    padding: .375em .625em;
    color: #545454;
    font-size: 1.125em; }
  .swal2-popup .swal2-radio,
  .swal2-popup .swal2-checkbox {
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center; }
    .swal2-popup .swal2-radio label,
    .swal2-popup .swal2-checkbox label {
      margin: 0 .6em;
      font-size: 1.125em; }
    .swal2-popup .swal2-radio input,
    .swal2-popup .swal2-checkbox input {
      margin: 0 .4em; }
  .swal2-popup .swal2-validationerror {
    display: none;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    padding: 0.625em;
    background: #f0f0f0;
    color: #666666;
    font-size: 1em;
    font-weight: 300;
    overflow: hidden; }
    .swal2-popup .swal2-validationerror::before {
      display: inline-block;
      width: 1.5em;
      height: 1.5em;
      margin: 0 .625em;
      border-radius: 50%;
      background-color: #f27474;
      color: #fff;
      font-weight: 600;
      line-height: 1.5em;
      text-align: center;
      content: '!';
      zoom: normal; }

@supports (-ms-accelerator: true) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .swal2-range input {
    width: 100% !important; }
  .swal2-range output {
    display: none; } }

.swal2-icon {
  position: relative;
  -webkit-box-pack: center;
      -ms-flex-pack: center;
          justify-content: center;
  width: 80px;
  height: 80px;
  margin: 1.25em auto 1.875em;
  border: 4px solid transparent;
  border-radius: 50%;
  line-height: 80px;
  cursor: default;
  -webkit-box-sizing: content-box;
          box-sizing: content-box;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  zoom: normal; }
  .swal2-icon.swal2-error {
    border-color: #f27474; }
    .swal2-icon.swal2-error .swal2-x-mark {
      position: relative;
      -webkit-box-flex: 1;
          -ms-flex-positive: 1;
              flex-grow: 1; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      display: block;
      position: absolute;
      top: 37px;
      width: 47px;
      height: 5px;
      border-radius: 2px;
      background-color: #f27474; }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='left'] {
        left: 17px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-error [class^='swal2-x-mark-line'][class$='right'] {
        right: 16px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }
  .swal2-icon.swal2-warning, .swal2-icon.swal2-info, .swal2-icon.swal2-question {
    margin: .333333em auto .5em;
    font-family: inherit;
    font-size: 3.75em; }
  .swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86; }
  .swal2-icon.swal2-info {
    border-color: #9de0f6;
    color: #3fc3ee; }
  .swal2-icon.swal2-question {
    border-color: #c9dae1;
    color: #87adbd; }
  .swal2-icon.swal2-success {
    border-color: #a5dc86; }
    .swal2-icon.swal2-success [class^='swal2-success-circular-line'] {
      position: absolute;
      width: 60px;
      height: 120px;
      -webkit-transform: rotate(45deg);
              transform: rotate(45deg);
      border-radius: 50%; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='left'] {
        top: -7px;
        left: -33px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 60px 60px;
                transform-origin: 60px 60px;
        border-radius: 120px 0 0 120px; }
      .swal2-icon.swal2-success [class^='swal2-success-circular-line'][class$='right'] {
        top: -11px;
        left: 30px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg);
        -webkit-transform-origin: 0 60px;
                transform-origin: 0 60px;
        border-radius: 0 120px 120px 0; }
    .swal2-icon.swal2-success .swal2-success-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 80px;
      height: 80px;
      border: 4px solid rgba(165, 220, 134, 0.3);
      border-radius: 50%;
      z-index: 2;
      -webkit-box-sizing: content-box;
              box-sizing: content-box; }
    .swal2-icon.swal2-success .swal2-success-fix {
      position: absolute;
      top: 8px;
      left: 26px;
      width: 7px;
      height: 90px;
      -webkit-transform: rotate(-45deg);
              transform: rotate(-45deg);
      z-index: 1; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] {
      display: block;
      position: absolute;
      height: 5px;
      border-radius: 2px;
      background-color: #a5dc86;
      z-index: 2; }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='tip'] {
        top: 46px;
        left: 14px;
        width: 25px;
        -webkit-transform: rotate(45deg);
                transform: rotate(45deg); }
      .swal2-icon.swal2-success [class^='swal2-success-line'][class$='long'] {
        top: 38px;
        right: 8px;
        width: 47px;
        -webkit-transform: rotate(-45deg);
                transform: rotate(-45deg); }

.swal2-progresssteps {
  -webkit-box-align: center;
      -ms-flex-align: center;
          align-items: center;
  margin: 0 0 1.25em;
  padding: 0;
  font-weight: 600; }
  .swal2-progresssteps li {
    display: inline-block;
    position: relative; }
  .swal2-progresssteps .swal2-progresscircle {
    width: 2em;
    height: 2em;
    border-radius: 2em;
    background: #3085d6;
    color: #fff;
    line-height: 2em;
    text-align: center;
    z-index: 20; }
    .swal2-progresssteps .swal2-progresscircle:first-child {
      margin-left: 0; }
    .swal2-progresssteps .swal2-progresscircle:last-child {
      margin-right: 0; }
    .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep {
      background: #3085d6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progresscircle {
        background: #add8e6; }
      .swal2-progresssteps .swal2-progresscircle.swal2-activeprogressstep ~ .swal2-progressline {
        background: #add8e6; }
  .swal2-progresssteps .swal2-progressline {
    width: 2.5em;
    height: .4em;
    margin: 0 -1px;
    background: #3085d6;
    z-index: 10; }

[class^='swal2'] {
  -webkit-tap-highlight-color: transparent; }

.swal2-show {
  -webkit-animation: swal2-show 0.3s;
          animation: swal2-show 0.3s; }
  .swal2-show.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

.swal2-hide {
  -webkit-animation: swal2-hide 0.15s forwards;
          animation: swal2-hide 0.15s forwards; }
  .swal2-hide.swal2-noanimation {
    -webkit-animation: none;
            animation: none; }

[dir='rtl'] .swal2-close {
  right: auto;
  left: 0; }

.swal2-animate-success-icon .swal2-success-line-tip {
  -webkit-animation: swal2-animate-success-line-tip 0.75s;
          animation: swal2-animate-success-line-tip 0.75s; }

.swal2-animate-success-icon .swal2-success-line-long {
  -webkit-animation: swal2-animate-success-line-long 0.75s;
          animation: swal2-animate-success-line-long 0.75s; }

.swal2-animate-success-icon .swal2-success-circular-line-right {
  -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
          animation: swal2-rotate-success-circular-line 4.25s ease-in; }

.swal2-animate-error-icon {
  -webkit-animation: swal2-animate-error-icon 0.5s;
          animation: swal2-animate-error-icon 0.5s; }
  .swal2-animate-error-icon .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark 0.5s;
            animation: swal2-animate-error-x-mark 0.5s; }

@-webkit-keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }

@keyframes swal2-rotate-loading {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg); }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg); } }
</style>
<script type="text/javascript" src="/wp-content/themes/ZStream/assets/js/jquery.min.js" id="jquery-js"></script>
<script type="text/javascript" src="/wp-content/plugins/favorites/assets/js/favorites.min.js" id="favorites-js"></script>
<meta name="generator" content="WordPress 5.8.2">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-32x32.jpg" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2021/09/cropped-emilia2-192x192.jpg" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2021/09/cropped-emilia2-180x180.jpg">
<meta name="msapplication-TileImage" content="/wp-content/uploads/2021/09/cropped-emilia2-270x270.jpg">
</head>
<body class="dark" style="">
<script>
document.body.classList.add("dark")
</script>
<style>
.header-logo .fa-brands{color:#7da2ff}
.header-logo:hover{color:#7da2ff}
.header-navigation .menu-item a:hover,.header-navigation .current-menu-item a{background:#7da2ff}
.header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.notif{background:#7da2ff}
.content h2 span{color:#7da2ff}
a.otherz{background:#7da2ff}
button.simplefavorites-clear{background:#7da2ff}
.flexbox-number{background:#7da2ff;border-color:#1e73be}
.flexbox-episode{background:#7da2ff}
.flexbox-episode span{background:#1e73be}
.flexbox-episode span.eps{background:#7da2ff}
.flexbox-item:hover .flexbox-title{color:#7da2ff}
.flexbox2-side .synops::-webkit-scrollbar-thumb{background-color:#1e73be}
.flexbox2-side .genres a:hover{color:#7da2ff}
.flexbox3-side .title a:hover{color:#7da2ff}
.flexbox3-side .episode{background:#7da2ff}
.flexbox3-side .episode span{background:#1e73be}
.flexbox3-side .episode span.eps{background:#7da2ff}
.pagination a:hover,.pagination .page-numbers.current{background:#7da2ff}
.animelist-nav{border-color:#7da2ff}
.animelist-nav a:hover{background:#7da2ff}
.animelist-blc ul{color:#7da2ff}
.animelist-blc ul li a.series:hover{color:#7da2ff}
.advancedsearch .btn{background:#7da2ff}
.achlist li a:hover{background:#7da2ff}
.series-infolist a{color:#7da2ff}
.series-genres a:hover{background:#7da2ff}
.series-episodelist li:hover{background:#7da2ff}
.series-episodelist li:hover .flexeps-play{background:#1e73be}
.series-episodelist li a:visited{color:#7da2ff}
.series-episodelist::-webkit-scrollbar-thumb{background-color:#1e73be}
.showserver{background:#7da2ff}
.mirror .the-button.active,.mirror .the-button:hover{background:#7da2ff}
.nextplaybtn a:hover{background:#7da2ff}
.download ul li b{background:#1e73be}
.download ul li a:hover{background:#7da2ff}
.download .dlbox2 .dllink2:hover{background:#7da2ff}
#commentform input#submit{background:#7da2ff}
.reply{background:#7da2ff}
.pagenon span{border-color:#7da2ff}
.footertop-right a:hover{background:#7da2ff}
.footer-navigation li a:hover{background:#7da2ff}
.pagenon a{background:#7da2ff}
.scrollToTop{background:#7da2ff}
.searchbox:hover .searchbox-title{color:#7da2ff}
.login-register .login-form .side-form{border-color:#7da2ff}
.login-register .login-form h2 span{color:#7da2ff}
.login-register .login-form .block .btn-submit{background:#7da2ff}
.profile .side-right h1 span{color:#7da2ff}
.profile .profile-nav ul a.current{background:#7da2ff!important;}
.edit-user .block .btn-submit{background:#7da2ff}
.dark .header-logo:hover{color:#7da2ff}
.dark .header-navigation .menu-item a:hover,.dark .header-navigation .current-menu-item a{background:#7da2ff}
.dark .header-navigation .menu-item.menu-item-has-children .sub-menu li a:hover{background:#7da2ff}
.dark .series-genres a:hover{background:#7da2ff}
.dark .achlist li a:hover{background:#7da2ff}
.dark .series-episodelist li:hover{background:#7da2ff}
.dark .pagination a:hover{background:#7da2ff}
.dark .mirror .the-button.active,.dark .mirror .the-button:hover{background:#7da2ff}
.dark .nextplaybtn a:hover{background:#7da2ff}
.dark .download ul li b{background:#7da2ff}
.dark .download ul li a:hover{background:#7da2ff}
.dark .download .dlbox2 .dllink2:hover{background:#7da2ff}
@media (max-width:768px){
.header-menu #showmenu:checked~#navigation{border-color:#7da2ff}
.header-menu #showsearch:checked~.header-right{border-color:#7da2ff}
}
</style>
<header class="header">
<div class="container">
<div class="header-menu">
<input id="showmenu" type="checkbox" role="button"><label class="showmenu" for="showmenu"><i class="fa-solid fa-bars-staggered"></i></label>
<div class="header-logo">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<ul id="navigation" class="header-navigation"><li id="menu-item-509" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-509"><a href="#">Daftar Anime</a>
<ul class="sub-menu">
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/anime-list/">Semua Anime</a></li>
	<li id="menu-item-16" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16"><a href="/movie-list/">Semua Movie</a></li>
	<li id="menu-item-127" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-127"><a href="/genre/">Genre</a></li>
	<li id="menu-item-129" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-129"><a href="/ongoing/">Ongoing</a></li>
</ul>
</li>


<li id="menu-item-699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-699"><a href="/report/">Lapor</a></li>
</ul>
<script>$("html").click(function(){$("#dropdown-user").hide()}),$(".user").click(function(o){o.stopPropagation()}),$("#user-button").click(function(o){$("#dropdown-user").toggle()});</script>
<input id="showsearch" type="checkbox" role="button"><label class="showsearch" for="showsearch"><i class="fa-solid fa-magnifying-glass"></i></label>
<div class="header-right">
<div class="header-searchbar">
<form action="/search" id="form" method="POST" itemprop="potentialAction">
<meta itemprop="target" content="/search">
<input class="search" id="search" itemprop="query-input" type="text" placeholder="Search..." aria-label="Search" name="s" autocomplete="off">
<button type="submit" value="Submit"><i class="fa-solid fa-magnifying-glass"></i></button>
</form>
<div id="datafetch"></div>
</div>
</div>
</div>
</div>
</header>
<main>
<div class="content">
<div class="container">
${kat === "going" ? "<h2><span>OnGoing</span> List</h2>" : kat === "search" ? `<h2><span>Search result for</span> ${type}</h2>` : kat === "genre" ? `<h2><span>Archive for</span> ${type}</h2>` : ""}
<div class="flexbox2">
${genremove.html}
</div>
<div class="pagination">
${bargenre}
</div>
</div>
</main>
	
<footer>
<div class="footertop">
<div class="container">
<div class="footertop-left">
<a href="/" title="${this.domain}" rel="home"><i class="fa-brands fa-gg"></i> ${this.domain}</a>
</div>
<div class="footertop-right">
</div>
</div>
</div>
<ul id="footermenu" class="footer-navigation"><li id="menu-item-389" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-389"><a href="https://saweria.co/MikasaGCH">Donasi</a></li>
</ul><div class="copyright">Â© Copyright 2021 - ${this.domain}. All rights reserved.</div>
</footer>
<script type="text/javascript" src="/wp-includes/js/wp-embed.min.js" id="wp-embed-js"></script>
	<div id="shadow"></div>
<a href="#" class="scrollToTop" style="display: none;"><i class="fa-solid fa-arrow-up"></i></a>
<script type="text/javascript">jQuery(function(e){"darkmode"==localStorage.getItem("theme-mode")&&e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").on("click",function(t){e(this).is(":checked")?(e("body").addClass("dark"),e(".switch").html('<i class="fa-solid fa-sun fa-fw"></i> Light Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!0)}),localStorage.setItem("theme-mode","darkmode")):(e("body").removeClass("dark"),e(".switch").html('<i class="fa-solid fa-moon fa-fw"></i> Dark Mode'),e(".theme-mode input").each(function(t,o){e(this).prop("checked",!1)}),localStorage.setItem("theme-mode","lightmode"))})});</script>
<script type="text/javascript">$(document).ready(function(){$(window).scroll(function(){if($(this).scrollTop()>100){$('.scrollToTop').fadeIn()}else{$('.scrollToTop').fadeOut()}});$('.scrollToTop').click(function(){$('html, body').animate({scrollTop:0},100);return!1})})</script>

</body></html>`


  admin = (data, ongoing, acnum, action, dbanime) => {
    if (action.toLowerCase() === 'add') {
      if (parseInt(acnum) === 1) {
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
  <label class="form-label fw-bolder text-dark fs-6">Status</label>
  <input class="form-control form-control-lg" type="text" placeholder="true" name="status" autocomplete="off" required/>
</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Genre</label>
		<input class="form-control form-control-lg" type="text" placeholder="horor, adventure, ..." name="genre" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
		<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
			<option value="MOVIE">Movie</option>
			<option value="TV">Tv</option>
		</select>                                                      
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Time</label>
		<input class="form-control form-control-lg" type="date" name="date" value="${moment(Date.now()).tz('Asia/Jakarta').format('YYYY-MM-DD')}" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Rating</label>
		<input class="form-control form-control-lg" type="text" placeholder="1.2" name="rating" autocomplete="off" required/>
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
      } else if (parseInt(acnum) === 2) {
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
    	<input class="form-control form-control-lg" type="text" name="anime" autocomplete="off" value="${dbanime.nama}" readonly/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Name Url</label>
    <input class="form-control form-control-lg" type="text" autocomplete="off" value="${nameurl}" readonly/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Download Url</label>
		<input class="form-control form-control-lg" type="text" name="downloadurl" placeholder="link1, link2, ..." autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Episode</label>
		<input class="form-control form-control-lg" type="number" name="eps" value="${dbanime.eps.length + 1}" min="1" max="${dbanime.eps.length + 1}" autocomplete="off" required/>
	</div>
	<div class="fv-row mb-7">
		<label class="form-label fw-bolder text-dark fs-6">Anime Type</label>
		<select id="typeanime" name="typeanime" class="form-control form-control-lg" placeholder="Movie">
			<option value="MOVIE">Movie</option>
			<option value="TV">Tv</option>
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
      if (parseInt(acnum) === 1) {
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
			<label class="form-label fw-bolder text-dark fs-6">Data Type</label>
			<select id="typedata" name="typedata" class="form-control form-control-lg">
				<option value="nama">Nama</option>
				<option value="sinop">Sinop</option>
				<option value="thumb">Thumbnail</option>
				<option value="genre">Genre</option>
				<option value="rating">Rating</option>
				<option value="status">Status</option>
				<option value="quolity">Quality</option>
				<option value="type">Type</option>
			</select>                                                      
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">New Data</label>
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
      } else if (parseInt(acnum) === 2) {
        var name = dbanime.nama
        var nameurl = dbanime.nameurl
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
			<input class="form-control form-control-lg" type="text" placeholder="${nameurl}" name="anime" autocomplete="off" readonly/>                                              
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Type</label>
			<select id="typeanime" name="typeanime" class="form-control form-control-lg">
				<option value="download">Download</option>
				<option value="stream">Stream</option>
			</select>                                                      
		</div>
    <div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">Episode</label>
      <input id="episode" class="form-control form-control-lg" type="number" name="eps" value="1" min="1" max="${dbanime.eps.length}" required/>
		</div>
		<div class="fv-row mb-7">
			<label class="form-label fw-bolder text-dark fs-6">New Data</label>
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
      }
    } else if (action.toLowerCase() === 'delete') {
      if (parseInt(acnum) === 1) {
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
      } else if (parseInt(acnum) === 2) {
        var nameurl = dbanime.nameurl
        var jmlheps = dbanime.eps === undefined ? 0 : dbanime.eps.length
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
  loopingEpsWatch = (data) => {
    var textnya = ``
    var angka = 0
    data.eps.sort((a, b) => (a.eps > b.eps) ? 1 : -1)
    for (let i = 0; i < data.eps.length; i++) {
      if (isNaN(data.eps[i].eps)) {
        angka += 1
      }
      textnya += `<li>
<div class="flexeps">
<div class="flexeps-play">  
<i class="fa-solid fa-play"></i>
</div>
<div class="flexeps-infoz">
<a href="/anime/${data.nameurl}/${data.eps[i].eps}" title="${data.nama} Episode ${data.eps[i].eps} Sub Indo"><span>Episode ${data.eps[i].eps} ${data.eps[i].eps === data.eps.length - angka ? data.status === true ? ' - End' : '' : ''}</span><span class="date">${moment(data.eps[i].time).tz('Asia/Jakarta').format('MMMMM DD, YYYY')}</span></a>
</div>
</div>
</li>`
    }
    return textnya
  }
  loopingGenre = (data) => {
    var textnya = ``
    for (let i = 0; i < data.genre.length; i++) {
      textnya += `<a href="/genre/${data.genre[i]}" rel="tag"> ${data.genre[i].toUpperCase()}</a>`
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
        //isImage(checkThumb(data[i].url.replace("/anime/", ""))).then(dataimg => {
        const thumbC = checkThumb(data[i].url.replace("/anime/", "")) //dataimg ? checkThumb(data[i].url.replace("/anime/", "")) : "https://i.ibb.co/RTYwBkS/150ba7b5-c0ab-4ad0-ac8b-5842f3cf4726.jpg"
        //console.log(thumbC, dataimg, checkThumb(data[i].url.replace("/anime/", "")))
        textnya += `<div class="ndseries">
<div class="ndsm">
	<a class="series" rel="141895" href='${data[i].url}'>
		<img width="225" height="316" src=${thumbC} class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Kimetsu no Yaiba: Yuukaku-hen" srcset="${thumbC} 225w, ${thumbC} 214w, ${thumbC} 84w" sizes="(max-width: 225px) 100vw, 225px" /> </a>
	<div class="title">${data[i].nama}</div>
</div>
</div>`
        //})
      }
      return textnya
    } else {
      var textnya = ``
      for (let i = dataM.length - 1; i > -1; i--) {
        //isImage(checkThumb(data[i].url.replace("/anime/", ""))).then(dataimg => {
        const thumbC = checkThumb(data[i].url.replace("/anime/", "")) //dataimg ? checkThumb(data[i].url.replace("/anime/", "")) : "https://i.ibb.co/RTYwBkS/150ba7b5-c0ab-4ad0-ac8b-5842f3cf4726.jpg"
        //console.log(thumbC, dataimg, checkThumb(data[i].url.replace("/anime/", "")))
        textnya += `<div class="ndseries">
<div class="ndsm">
	<a class="series" rel="141895" href='${data[i].url}'>
		<img width="225" height="316" src=${thumbC} class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Kimetsu no Yaiba: Yuukaku-hen" srcset="${thumbC} 225w, ${thumbC} 214w, ${thumbC} 84w" sizes="(max-width: 225px) 100vw, 225px" /> </a>
	<div class="title">${data[i].nama}</div>
</div>
</div> `
        //})
      }
      return textnya
    }
  }
  genreGet = (data, genre) => {
    var DataM = []
    if (!AllGenre(this.allanime).includes(genre)) return false
    for (let i = 0; i < data.length; i++) {
      if (data[i].genre.includes(genre)) {
        DataM.push(data[i])
      }
    }
    return DataM
  }
  genreCheck = (data) => {
    var dataall = 0
    for (let i = 0; i < this.allanime.length; i++) {
      if (this.allanime[i].genre.includes(data))
        dataall += 1
    }
    return dataall
  }
  genreList = (data) => {
    var textnya = ``
    for (let i = 0; i < AllGenre(this.allanime).length; i++) {
      textnya += `<li><a href="/genre/${AllGenre(this.allanime)[i]}" title="Lihat Anime ${AllGenre(this.allanime)[i]}">${AllGenre(this.allanime)[i].toUpperCase()}<span>${this.genreCheck(AllGenre(this.allanime)[i])}</span></a></li>`
    }
    return textnya
  }
  genreMove = (data, page, device) => {
    let pageX = page === undefined ? 1 : page
    if (isNaN(page)) {
      pageX = 1
    }
    if (data.length < 13) {
      var textnya = ``
      for (let i = data.length - 1; i > -1; i--) {
        const genrenya = loopGenreALL(data[i].nameurl)
        textnya += `<div class="flexbox2-item">
<div class="flexbox2-content">
<a href="/anime/${data[i].nameurl}" title="${data[i].nameurl}"> 
<div class="flexbox2-thumb"> 
<img src="${data[i].thumb}?resize=225,310" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 170px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class="flexbox2-title"><span>${data[i].nama}</span><span class="rating">${data[i].rating}</span></div>
</div>
</a>
<div class="flexbox2-side"> 
<div class="type ${data[i].type}">${data[i].type}</div>
<div class="synops"><p>${data[i].sinop}</p>
</div>
<div class="genres"><span>${genrenya}</div>
</div>
</div>
</div>`
      }
      const allFilter = data.length / 12
      return { html: textnya, page: Math.ceil(allFilter) }
    } else {
      // FILTER AKHIR
      let satu = 12 * pageX
      let dua = data.length - satu - 1
      // FILTER AWAL
      let awal1 = pageX - 1
      let awal2 = 12 * awal1
      let awal3 = data.length - awal2 - 1
      var textnya = ``
      if (awal3 < 1) return false
      if (awal3 < 12) {
        let filternya = pageX - 1
        let damnya = 12 * filternya
        for (let i = data.length - damnya; i > -1; i--) {
          const genrenya = loopGenreALL(data[i].nameurl)
          textnya += `<div class="flexbox2-item">
<div class="flexbox2-content">
<a href="/anime/${data[i].nameurl}" title="${data[i].nameurl}"> 
<div class="flexbox2-thumb"> 
<img src="${data[i].thumb}?resize=225,310" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 170px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class="flexbox2-title"><span>${data[i].nama}</span><span class="rating">${data[i].rating}</span></div>
</div>
</a>
<div class="flexbox2-side"> 
<div class="type ${data[i].type}">${data[i].type}</div>
<div class="synops"><p>${data[i].sinop}</p>
</div>
<div class="genres"><span>${genrenya}</div>
</div>
</div>
</div>`
        }
        const allFilter = data.length / 12
        return { html: textnya, page: Math.ceil(allFilter) }
      } else {
        for (let i = awal3; i > dua; i--) {
          const genrenya = loopGenreALL(data[i].nameurl)
          textnya += `<div class="flexbox2-item">
<div class="flexbox2-content">
<a href="/anime/${data[i].nameurl}" title="${data[i].nameurl}"> 
<div class="flexbox2-thumb"> 
<img src="${data[i].thumb}?resize=225,310" style="${device === "desktop" ? 'width: 720px; height: 235px;' : device === "android" ? 'width: 500px; height: 170px;' : 'width: 720px; height: 235px;'} object-fit: cover;" class="avatar-img rounded alt="${data[i].nama}" title="${data[i].nama}"><div class="flexbox2-title"><span>${data[i].nama}</span><span class="rating">${data[i].rating}</span></div>
</div>
</a>
<div class="flexbox2-side"> 
<div class="type ${data[i].type}">${data[i].type}</div>
<div class="synops"><p>${data[i].sinop}</p>
</div>
<div class="genres"><span>${genrenya}</div>
</div>
</div>
</div>`
        }
        const allFilter = data.length / 12
        return { html: textnya, page: Math.ceil(allFilter) }
      }
    }
  }
  createMess = (status, title, text) => {
    return `<script>
			swal('${title}', '${text}', '${status}')
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
      textnya += `</ul></div><div class="animelist-blc"><span><a name="#">#</a></span><ul>`
      for (let i = 0; i < data.$.length; i++) {
        textnya += `<li class="${data.$[i].type}"><a class="series" rel="6" href="/anime/${data.num[i].nameurl}">${data.num[i].nama}</a></li>`
      }
    }
    if (data.num.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="1-9">1</a></span><ul>`
      for (let i = 0; i < data.num.length; i++) {
        textnya += `<li class="${data.num[i].type}"><a class="series" rel="6" href="/anime/${data.num[i].nameurl}">${data.num[i].nama}</a></li>`
      }
    }
    if (data.a.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="A">A</a></span><ul>`
      for (let i = 0; i < data.a.length; i++) {
        textnya += `<li class="${data.a[i].type}"><a class="series" rel="6" href="/anime/${data.a[i].nameurl}">${data.a[i].nama}</a></li>`
      }
    }
    if (data.b.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="B">B</a></span><ul>`
      for (let i = 0; i < data.b.length; i++) {
        textnya += `<li class="${data.b[i].type}"><a class="series" rel="6" href="/anime/${data.b[i].nameurl}">${data.b[i].nama}</a></li>`
      }
    }
    if (data.c.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="C">C</a></span><ul>`
      for (let i = 0; i < data.c.length; i++) {
        textnya += `<li class="${data.c[i].type}"><a class="series" rel="6" href="/anime/${data.c[i].nameurl}">${data.c[i].nama}</a></li>`
      }
    }
    if (data.d.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="D">D</a></span><ul>`
      for (let i = 0; i < data.d.length; i++) {
        textnya += `<li class="${data.d[i].type}"><a class="series" rel="6" href="/anime/${data.d[i].nameurl}">${data.d[i].nama}</a></li>`
      }
    }
    if (data.e.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="E">E</a></span><ul>`
      for (let i = 0; i < data.e.length; i++) {
        textnya += `<li class="${data.e[i].type}"><a class="series" rel="6" href="/anime/${data.e[i].nameurl}">${data.e[i].nama}</a></li>`
      }
    }
    if (data.f.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="F">F</a></span><ul>`
      for (let i = 0; i < data.f.length; i++) {
        textnya += `<li class="${data.f[i].type}"><a class="series" rel="6" href="/anime/${data.f[i].nameurl}">${data.f[i].nama}</a></li>`
      }
    }
    if (data.g.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="G">G</a></span><ul>`
      for (let i = 0; i < data.g.length; i++) {
        textnya += `<li class="${data.g[i].type}"><a class="series" rel="6" href="/anime/${data.g[i].nameurl}">${data.g[i].nama}</a></li>`
      }
    }
    if (data.h.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="H">H</a></span><ul>`
      for (let i = 0; i < data.h.length; i++) {
        textnya += `<li class="${data.h[i].type}"><a class="series" rel="6" href="/anime/${data.h[i].nameurl}">${data.h[i].nama}</a></li>`
      }
    }
    if (data.i.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="I">I</a></span><ul>`
      for (let i = 0; i < data.i.length; i++) {
        textnya += `<li class="${data.i[i].type}"><a class="series" rel="6" href="/anime/${data.i[i].nameurl}">${data.i[i].nama}</a></li>`
      }
    }
    if (data.j.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="J">J</a></span><ul>`
      for (let i = 0; i < data.j.length; i++) {
        textnya += `<li class="${data.j[i].type}"><a class="series" rel="6" href="/anime/${data.j[i].nameurl}">${data.j[i].nama}</a></li>`
      }
    }
    if (data.k.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="K">K</a></span><ul>`
      for (let i = 0; i < data.k.length; i++) {
        textnya += `<li class="${data.k[i].type}"><a class="series" rel="6" href="/anime/${data.k[i].nameurl}">${data.k[i].nama}</a></li>`
      }
    }
    if (data.l.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="I">I</a></span><ul>`
      for (let i = 0; i < data.l.length; i++) {
        textnya += `<li class="${data.l[i].type}"><a class="series" rel="6" href="/anime/${data.l[i].nameurl}">${data.l[i].nama}</a></li>`
      }
    }
    if (data.m.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="M">M</a></span><ul>`
      for (let i = 0; i < data.m.length; i++) {
        textnya += `<li class="${data.m[i].type}"><a class="series" rel="6" href="/anime/${data.m[i].nameurl}">${data.m[i].nama}</a></li>`
      }
    }
    if (data.n.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="N">N</a></span><ul>`
      for (let i = 0; i < data.n.length; i++) {
        textnya += `<li class="${data.n[i].type}"><a class="series" rel="6" href="/anime/${data.n[i].nameurl}">${data.n[i].nama}</a></li>`
      }
    }
    if (data.o.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="O">O</a></span><ul>`
      for (let i = 0; i < data.o.length; i++) {
        textnya += `<li class="${data.o[i].type}"><a class="series" rel="6" href="/anime/${data.o[i].nameurl}">${data.o[i].nama}</a></li>`
      }
    }
    if (data.p.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="P">P</a></span><ul>`
      for (let i = 0; i < data.p.length; i++) {
        textnya += `<li class="${data.p[i].type}"><a class="series" rel="6" href="/anime/${data.p[i].nameurl}">${data.p[i].nama}</a></li>`
      }
    }
    if (data.q.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="Q">Q</a></span><ul>`
      for (let i = 0; i < data.q.length; i++) {
        textnya += `<li class="${data.q[i].type}"><a class="series" rel="6" href="/anime/${data.q[i].nameurl}">${data.q[i].nama}</a></li>`
      }
    }
    if (data.r.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="R">R</a></span><ul>`
      for (let i = 0; i < data.r.length; i++) {
        textnya += `<li class="${data.r[i].type}"><a class="series" rel="6" href="/anime/${data.r[i].nameurl}">${data.r[i].nama}</a></li>`
      }
    }
    if (data.s.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="S">S</a></span><ul>`
      for (let i = 0; i < data.s.length; i++) {
        textnya += `<li class="${data.s[i].type}"><a class="series" rel="6" href="/anime/${data.s[i].nameurl}">${data.s[i].nama}</a></li>`
      }
    }
    if (data.t.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="T">T</a></span><ul>`
      for (let i = 0; i < data.t.length; i++) {
        textnya += `<li class="${data.t[i].type}"><a class="series" rel="6" href="/anime/${data.t[i].nameurl}">${data.t[i].nama}</a></li>`
      }
    }
    if (data.u.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="U">U</a></span><ul>`
      for (let i = 0; i < data.u.length; i++) {
        textnya += `<li class="${data.u[i].type}"><a class="series" rel="6" href="/anime/${data.u[i].nameurl}">${data.u[i].nama}</a></li>`
      }
    }
    if (data.v.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="V">V</a></span><ul>`
      for (let i = 0; i < data.v.length; i++) {
        textnya += `<li class="${data.v[i].type}"><a class="series" rel="6" href="/anime/${data.v[i].nameurl}">${data.v[i].nama}</a></li>`
      }
    }
    if (data.w.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="W">W</a></span><ul>`
      for (let i = 0; i < data.w.length; i++) {
        textnya += `<li class="${data.w[i].type}"><a class="series" rel="6" href="/anime/${data.w[i].nameurl}">${data.w[i].nama}</a></li>`
      }
    }
    if (data.x.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="X">X</a></span><ul>`
      for (let i = 0; i < data.x.length; i++) {
        textnya += `<li class="${data.x[i].type}"><a class="series" rel="6" href="/anime/${data.x[i].nameurl}">${data.x[i].nama}</a></li>`
      }
    }
    if (data.y.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="Y">Y</a></span><ul>`
      for (let i = 0; i < data.y.length; i++) {
        textnya += `<li class="${data.y[i].type}"><a class="series" rel="6" href="/anime/${data.y[i].nameurl}">${data.y[i].nama}</a></li>`
      }
    }
    if (data.z.length !== 0) {
      textnya += `</ul></div><div class="animelist-blc"><span><a name="Z">Z</a></span><ul>`
      for (let i = 0; i < data.z.length; i++) {
        textnya += `<li class="${data.z[i].type}"><a class="series" rel="6" href="/anime/${data.z[i].nameurl}">${data.z[i].nama}</a></li>`
      }
    }
    return textnya
  }
  backToHome = (res, req, mess, url) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    ip = ip.replace(/\:|f|\:\:1/g, '')
    this.addLogs(ip, "dashboard")
    var animenew = this.NewrilisPage(this.newanime, 1, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
    var movienew = this.moviePage(this.newanime)
    if (animenew === false) return res.send(this.notFound("Page Not Found", "404 Not Found"));
    var allanime = this.topviewAnime(this.allanime, !!req.headers['user-agent'].match(/Windows/) ? 'dasktop' : !!req.headers['user-agent'].match(/Android/) ? 'android' : !!req.headers['user-agent'].match(/iPhone/) ? 'android' : 'desktop')
    var getBar = this.getPageBar(1, animenew.page)
    var url_nye = `<script> window.location = ${url} <script>`
    res.send(this.htmlPage(animenew, allanime, getBar, movienew, mess === undefined ? undefined : mess), url === undefined ? '' : url_nye)
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