import { Embed } from '../../yapper.js';

const mediaUrl = (bucket, path) => {
    if (!path) return null;
    if (path.startsWith('/')) return `https://www.yapin.gg${path}`;
    return `https://files.yapper.website/${bucket}/${path}`;
};

const formatDate = (value) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export function setup(bot) {
    bot.command('serverinfo', 'Show this server’s info', async (msg) => {
        if (!msg.server_id) return msg.reply('This command only works in a server.');

        const [server, channels, categories] = await Promise.all([
            bot.server(msg.server_id),
            bot.channels(msg.server_id),
            bot.categories(msg.server_id),
        ]);
        console.log('[serverinfo] server:', server);

        const textCount = channels.filter((channel) => (channel.type || channel.kind) === 'text').length;
        const voiceCount = channels.filter((channel) => (channel.type || channel.kind) === 'voice').length;
        const owner = server.owner_id ? `<@${server.owner_id}>` : 'Unknown';
        const embed = new Embed()
            .title(server.name || 'Server')
            .description(`*Here's some info about this server...*\n\nOwner: ${owner}\nMembers: \`${server.member_count ?? 'Unknown'}\`\nCreated: \`${formatDate(server.created_at)}\`\n\nText channels: \`${textCount}\`\nVoice channels: \`${voiceCount}\`\nCategories: \`${categories.length}\``)
            .color('grey');
        const iconUrl = mediaUrl('icons', server.icon_path);
        const bannerUrl = mediaUrl('banners', server.banner_path);
        if (iconUrl) embed.thumbnail(iconUrl);
        if (bannerUrl) embed.image(bannerUrl);

        return msg.reply('', { embeds: [embed] });
    });
}