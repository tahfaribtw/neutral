import { Embed } from '../../yapper.js';

export function setup(bot) {
  bot.command('about', 'Show bot commands', (msg) => msg.reply('', {
    embeds: [new Embed()
      .title('Neutral')
      .description('A small Yapin’ bot.')
      .color('green')
      .field('Commands', '?ping, ?roll [sides], ?vote, ?channels, ?profile, ?serverinfo, ?roles, ?voice')],
  }));
}