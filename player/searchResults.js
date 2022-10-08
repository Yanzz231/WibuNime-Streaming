module.exports = (client, message, query, tracks) => {
    const pe = tracks.map((t, i) => `${t.thumbnail}`).join(' ')
    message.channel.send({
        embed: {
            color: 'RED',
            author: { name: `Here Are Your Search Results For ${query}` },
            footer: { text: 'Made By Yanz & Pudidi' },
            timestamp: new Date(),
            description: `${tracks.map((t, i) => `**${i + 1}** - ${t.title}`).join('\n')}`,
            thumbnail: { url: tracks[0].thumbnail },
        },
    });
};