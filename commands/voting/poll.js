import { Embed } from '../../yapper.js';
import { replyUsage } from './_shared.js';

const OPTIONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function setup(bot) {
  bot.command('poll', 'Create a reaction poll', async (msg) => {
    const parts = msg.args.split('|').map((part) => part.replace(/\s+/g, ' ').trim());
    const [question, ...choices] = parts;
    if (!msg.server_id) return msg.reply('Polls can only be created in a server.');
    if (!question || choices.length < 2 || choices.length > OPTIONS.length || choices.some((choice) => !choice)) {
      return replyUsage(msg, 'poll', '?poll <question> | <choice> | <choice>...', 'Create a poll with 2 to 10 choices. Separate the question and each choice with `|`.');
    }

    const content = [
      '📊 **Poll**',
      `**${question}**`,
      ...choices.map((choice, index) => `${OPTIONS[index]} ${choice}`),
      'React with one option to vote.',
    ].join('\n\n');

    try {
      const poll = await bot.send(msg.channel_id, content);
      for (const emoji of OPTIONS.slice(0, choices.length)) {
        await bot.react(msg.channel_id, poll.id, emoji);
      }
      return msg.reply(`Poll created. Use \`?pollresults ${poll.id}\` to see the current totals.`);
    } catch (error) {
      console.error('[poll] creation failed:', error);
      return msg.reply('Could not create the poll. Check that the bot can post and add reactions.');
    }
  });
}