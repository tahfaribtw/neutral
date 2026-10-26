import { actionEmbed, isUserId, replyUsage, targetId } from './_shared.js';

export function setup(bot) {
  bot.command('unban', 'Unban a user with a reason', async (msg) => {
    if (!msg.server_id) return msg.reply('This command only works in a server.');

    const [rawTarget, ...reasonParts] = msg.argv;
    const target = targetId(rawTarget);
    const reason = reasonParts.join(' ').trim();
    if (!isUserId(target) || !reason || reason.length > 1024) {
      return replyUsage(msg, 'unban', '?unban <user-id> <reason>', 'Unban a user immediately with a required reason.');
    }

    try {
      await bot.unban(msg.server_id, target);
      return bot.send(msg.channel_id, '', {
        embeds: [actionEmbed('User unbanned', target, reason, 'green')],
      });
    } catch (error) {
      console.error('[unban] failed:', error);
      return msg.reply('Unban failed. Check the bot’s Ban permission and the user ID.');
    }
  });
}