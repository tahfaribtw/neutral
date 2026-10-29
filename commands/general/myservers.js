import { Embed } from '../../yapper.js';

export function setup(bot) {
  bot.command('myservers', 'List servers you share with the bot', async (msg) => {
    try {
      const servers = await bot.servers();
      const shared = [];

      for (const server of servers) {
        try {
          const member = await bot.member(server.id, msg.author_id);
          if (member) shared.push(server);
        } catch (error) {
          if (error.status !== 404) throw error;
        }
      }

      if (!shared.length) return msg.reply('You and the bot do not share any servers.');

      const lines = shared.map((server) => `• ${server.name || 'Unnamed server'} (\`${server.id}\`)`);
      const fields = [];
      let group = [];
      let length = 0;
      for (const line of lines) {
        if (length + line.length + 1 > 1000 && group.length) {
          fields.push(group.join('\n'));
          group = [];
          length = 0;
        }
        group.push(line);
        length += line.length + 1;
      }
      if (group.length) fields.push(group.join('\n'));

      const embed = new Embed()
        .title('Servers you share with the bot')
        .color('blue')
        .description(`${shared.length} shared server${shared.length === 1 ? '' : 's'}.`);
      fields.forEach((value, index) => embed.field(`Servers ${index + 1}`, value));
      return msg.reply('', { embeds: [embed] });
    } catch (error) {
      console.error('[myservers] lookup failed:', error);
      return msg.reply('Could not check the servers you share with the bot.');
    }
  });
}