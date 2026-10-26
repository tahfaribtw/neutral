import { Embed } from '../../yapper.js';

const mediaUrl = (bucket, path) => {
    if (!path) return null;
    if (path.startsWith('/')) return `https://www.yapin.gg${path}`;
    return `https://files.yapper.website/${bucket}/${path}`;
};

const relativeDate = (value) => {
    const date = new Date(value);
    const difference = (date.getTime() - Date.now()) / 1000;
    if (!Number.isFinite(difference)) return 'unknown';

    const units = [
        ['year', 31536000],
        ['month', 2592000],
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1],
    ];
    const [unit, seconds] = units.find(([, seconds]) => Math.abs(difference) >= seconds) || units.at(-1);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(difference / seconds), unit);
};

export function setup(bot) {
    bot.command('profile', 'Show your public profile', async (msg) => {
        const user = await bot.user(msg.author_id);
        console.log('[profile] user:', user);
        const name = user.username;
        const embed = new Embed()
            .title(`${name} * (${user.display_name})`)
            .description(`*Here's some info about this user...*\n\nPronouns: \`${user.pronouns || 'not set'}\`\nCreated: \`${relativeDate(user.created_at)}\`\nUserID: \`${user.id || msg.author_id}\``)
            .color('grey')
        const avatarUrl = mediaUrl('avatars', user.avatar_path);
        const bannerUrl = mediaUrl('banners', user.banner_path);
        if (avatarUrl) embed.thumbnail(avatarUrl);
        if (bannerUrl) embed.image(bannerUrl);

        return msg.reply('', {
            embeds: [embed],
        });
    });
}