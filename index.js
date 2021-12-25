const { default: makeWASocket, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState } = require('@adiwajshing/baileys-md')
const fs = require("fs")
const P = require("pino")
setting = JSON.parse(fs.readFileSync("./setting.json"))
const { state, loadState, saveState } = useSingleFileAuthState(setting.sesionName + ".json")
async function start() {
  const conn = await makeWASocket({
    logger: P({ level: 'silent' }),
    browser: ["WibuNimeBot-MD", "Safari", "1.0.0"],
    printQRInTerminal: true,
    auth: state
  })
  conn.ev.on("messages.upsert", async m => {
    if (!m.messages) return
    const msg = m.messages[0]
    const type = Object.keys(msg.message)[0]
    body = (type === 'conversation' && msg.message.conversation) ? msg.message.conversation : (type == 'imageMessage') && msg.message.imageMessage.caption ? msg.message.imageMessage.caption : (type == 'documentMessage') && msg.message.documentMessage.caption ? msg.message.documentMessage.caption : (type == 'videoMessage') && msg.message.videoMessage.caption ? msg.message.videoMessage.caption : (type == 'extendedTextMessage') && msg.message.extendedTextMessage.text ? msg.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') && msg.message.buttonsResponseMessage.selectedButtonId ? msg.message.buttonsResponseMessage.selectedButtonId : (type == "templateButtonReplyMessage" && msg.message.templateButtonReplyMessage.selectedId) ? msg.message.templateButtonReplyMessage.selectedId : ''
    budy = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : ''
    const command = body.startsWith(".") ? body.replace(".", '').trim().split(/ +/).shift().toLowerCase() : ''
    const { checkRepost, removeReport } = require("./function/function")
    if (command === "list") {
      var textnya = ``
      for (let i = 0; i < checkRepost().length; i++) {
        textnya += `[${i + 1}]Issue : ${checkRepost()[i].issue}\nName : ${checkRepost()[i].nama}\nEmail : ${checkRepost()[i].email}\n\n${checkRepost()[i].detail}${i + 1 === checkRepost().length ? "" : "\n\n"}`
      }
      conn.sendMessage("18623477863-1624245605@g.us", { text: textnya })
    }
    if (command === "delete") {
      textnya = body.slice(8)
      const remove = removeReport(parseInt(textnya))
      if (remove === false) return conn.sendMessage("18623477863-1624245605@g.us", { text: "Eror" })
      conn.sendMessage("18623477863-1624245605@g.us", { text: "Done" })
    }
  })
}
start()
// WEBSITE
const RestApi = require('./lib/classes')
const cron = require('node-cron')
const { remove, text } = require('cheerio/lib/api/manipulation')
const { parse } = require('path')
const client = new RestApi()
let settings = JSON.parse(require('fs').readFileSync('./src/settings.json'))

require('fs').writeFileSync('./src/settings.json', JSON.stringify(settings, null, 5))

client.start();