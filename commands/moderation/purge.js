import { Embed } from '../../yapper.js';
import { replyUsage } from './_shared.js';

export function setup(bot) {
  bot.command('purge', 'Delete up to 50 recent messages', async (msg) => {
    if (!msg.server_id) return msg.reply('This command only works in a server.');

    const count = msg.argv[0] === undefined ? 50 : Number(msg.argv[0]);
    if (msg.argv.length > 1 || !Number.isInteger(count) || count < 1 || count > 50) {
      return replyUsage(msg, 'purge', '?purge [1-50]', 'Delete up to 50 recent messages in this channel. Defaults to 50.');
    }

    try {
      const messages = await bot.messages(msg.channel_id, count + 1);
      const ids = messages
        .filter((message) => message.id !== msg.id)
        .slice(-count)
        .map((message) => message.id)
        .filter(Boolean);
      if (!ids.length) return msg.reply('There are no messages to purge.');

      const result = await bot.bulkDelete(msg.channel_id, ids);
      const deletedCount = Array.isArray(result.deleted)
        ? result.deleted.length
        : typeof result.deleted === 'number' ? result.deleted : ids.length;
      return bot.send(msg.channel_id, `Deleted ${deletedCount} messages.`);
    } catch (error) {
      console.error('[purge] failed:', error);
      return msg.reply('Purge failed. Check the bot’s Manage Messages permission.');
    }
  });
}