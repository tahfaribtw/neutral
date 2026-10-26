export function setup(bot) {
  bot.command('channels', 'List text channels in this server', async (msg) => {
    if (!msg.server_id) return msg.reply('This command only works in a server.');

    const channels = await bot.channels(msg.server_id, { type: 'text' });
    if (!channels.length) return msg.reply('I can’t see any text channels here.');

    const list = channels.slice(0, 25)
      .map((channel) => `<#${channel.id}>`)
      .join('\n');
    const remainder = channels.length > 25 ? `\n…and ${channels.length - 25} more.` : '';
    return msg.reply(`Text channels (${channels.length}):\n${list}${remainder}`);
  });
}