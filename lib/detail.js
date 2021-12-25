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

app.get('/', async (req, res) => {
    app.param('name', function(req, res, next, name) {
        const modified = name.toUpperCase(); 
        req.name = modified;
        next();
    });      
    app.get('/api/users/:name', function(req, res) {
        res.send('Hello ' + req.name + '!');
    });
});

module.exports = app;