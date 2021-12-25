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
const app = express()
const wsServer = new ws.Server({ noServer: true });

app.use(express.static(__dirname + '/page/watch'));
/*
app.param('name', function(req, res, next, name) {
    const modified = name.toUpperCase(); 
    req.name = modified;
    next();
});      
app.get('watch/:name', function(req, res) {
    res.send('Hello ' + req.name + '!');
});
*/
app.get('/onepice', async (req, res) => {
    res.sendfile(__dirname + '/page/watch/tes.html')
});

module.exports = app;