module.exports = (client, message, query, tracks) => {
    message.channel.send(`${client.emotes.error} - You did not provide a valid response ... Please send the command again !`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
}; 
