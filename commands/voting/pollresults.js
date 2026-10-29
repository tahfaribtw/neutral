import { Embed } from '../../yapper.js';
import { isUserId, replyUsage } from './_shared.js';

const OPTIONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function setup(bot) {
  bot.command('pollresults', 'Show reaction poll results', async (msg) => {
    const [messageId] = msg.argv;
    if (!msg.server_id) return msg.reply('Poll results can only be viewed in a server.');
    if (!isUserId(messageId) || msg.argv.length !== 1) {
      return replyUsage(msg, 'pollresults', '?pollresults <message-id>', 'Use the ID of the poll message to see its current reaction totals.');
    }

    try {
      const poll = await bot.message(msg.channel_id, messageId);
      if (!poll?.content?.startsWith('📊 **Poll**')) return msg.reply('That message is not a poll in this channel.');

      const choices = OPTIONS.flatMap((emoji) => {
        const line = poll.content.split('\n').find((item) => item.startsWith(`${emoji} `));
        return line ? [{ emoji, label: line.slice(emoji.length + 1) }] : [];
      });
      const reactions = await bot.reactions(msg.channel_id, messageId);
      const fields = choices.map(({ emoji, label }) => {
        const voters = new Set(reactions
          .filter((reaction) => reaction.emoji === emoji && reaction.user_id !== bot.me?.id)
          .map((reaction) => reaction.user_id));
        return { emoji, label, count: voters.size };
      });
      const embed = new Embed()
        .title('Poll results')
        .description(poll.content.split('\n')[2] || 'Current reaction totals.')
        .color('green');
      for (const { emoji, label, count } of fields) {
        embed.field(`${emoji} ${label}`, `${count} vote${count === 1 ? '' : 's'}`);
      }
      return msg.reply('', { embeds: [embed] });
    } catch (error) {
      console.error('[pollresults] lookup failed:', error);
      return msg.reply('Could not load poll results. Check that the poll message is still available.');
    }
  });
}