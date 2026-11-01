// Your first Yapin’ bot. Needs Node 18+ (https://nodejs.org) and yapper.js next to this file.
//   1. Save yapper.js and package.json from https://www.yapin.gg/sdk/ into the same folder
//      (package.json just says these files are ES modules; Node 18-20 needs it).
//   2. Put YAPPER_BOT_TOKEN in your .env file.
//   3. Add the bot to a server you manage (same place), then run:  node starter.js
import 'dotenv/config';
import { Bot } from './yapper.js';

const token = process.env.YAPPER_BOT_TOKEN;
if (!token) throw new Error('Missing YAPPER_BOT_TOKEN in .env');

const bot = new Bot(token, { prefixes: ['?'] });

await bot.loadCogs('./commands');

// Someone joined one of the bot's servers.
bot.on('member_join', async (ev) => {
  const channels = await bot.channels(ev.server_id);
  const general = channels.find((c) => c.kind === 'text' && /general|welcome|chat/i.test(c.name)) || channels.find((c) => c.kind === 'text');
  if (general) bot.send(general.id, `welcome <@${ev.user_id}>! you're member #${ev.member_count}`);
});

// Give the bot a picture once (a PNG/JPG next to this file). Uncomment to use:
// bot.setAvatar('./avatar.png');

bot.start().catch((e) => {
  console.error('[yapper] could not start:', e.message);
  process.exit(1);
});
