module.exports = (client, message, queue, track) => {
    message.channel.send({
        embed: {
            color: 'RED',
            author: { name: track.title },
            footer: { text: 'Made By Yanz & Pudidi' },
            fields: [
                { name: 'Channel', value: track.author, inline: true },
                { name: 'Requested by', value: track.requestedBy.username, inline: true },
                { name: 'Views', value: track.views, inline: true },
                { name: 'Duration', value: track.duration, inline: true },
            ],
            thumbnail: { url: track.thumbnail },
            timestamp: new Date(),
        },
    });
    
};