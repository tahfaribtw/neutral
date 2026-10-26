export function setup(bot) {
  bot.command('voice', 'Show who is in voice channels', async (msg) => {
    if (!msg.server_id) return msg.reply('This command only works in a server.');

    const channels = await bot.voice(msg.server_id);
    if (!channels.length) return msg.reply('No one is in a voice channel right now.');

    const people = channels.reduce((count, channel) => count + channel.user_ids.length, 0);
    const list = channels.slice(0, 15).map((channel) => {
      const users = channel.user_ids.slice(0, 10).map((id) => `<@${id}>`).join(', ');
      const extraUsers = channel.user_ids.length > 10 ? `, and ${channel.user_ids.length - 10} more` : '';
      return `<#${channel.channel_id}> (${channel.user_ids.length}): ${users || 'No participants'}${extraUsers}`;
    }).join('\n');
    const extraChannels = channels.length > 15 ? `\n…and ${channels.length - 15} more channels.` : '';

    return msg.reply(`Voice channels: ${channels.length} · People connected: ${people}\n${list}${extraChannels}`);
  });
}