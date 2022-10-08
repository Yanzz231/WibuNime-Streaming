module.exports = (client, error, message, ...args) => {
  switch (error) {
    case 'NotPlaying':
      message.channel.send(`${client.emotes.error} - There is no music being played on this server !`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
      break;
    case 'NotConnected':
      message.channel.send(`${client.emotes.error} - You are not connected in any voice channel !`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
      break;
    case 'UnableToJoin':
      message.channel.send(`${client.emotes.error} - I am not able to join your voice channel, please check my permissions !`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
      break;
    case 'VideoUnavailable':
      message.channel.send(`${client.emotes.error} - ${args[0].title} is not available in your country! Skipping...`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
      break;
    case 'MusicStarting':
      message.channel.send(`The music is starting... please wait and retry!`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
      break;
    default:
      message.channel.send(`${client.emotes.error} - Something went wrong ... Error : ${error}`).then(msg => {
        setTimeout(() => msg.delete(), client.durasi.message)
      })
  };
};
