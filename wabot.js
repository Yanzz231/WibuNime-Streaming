module.exports = wabot = async (m, mek, conn, MessageType, Mimetype, Presence, GroupSettingChange) => {
    try {
        body = (messageType === 'conversation' && m.message.conversation) ? m.message.conversation : (messageType == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (messageType == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : (messageType == 'extendedTextMessage') && m.message.extendedTextMessage.text ? m.message.extendedTextMessage.text : '' || ''
        const command = body.trim().split(/ +/).shift().toLowerCase()
        
        // COMMAND
        
    } catch (err) {
        console.log(err)
    }
}