export function setup(bot) {
  bot.command('ping', 'Is the bot alive?', (msg) => msg.reply('pong 🏓'));
}