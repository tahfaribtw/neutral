import { Embed } from '../../yapper.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUserId = (value) => typeof value === 'string' && UUID.test(value);

export const replyUsage = (msg, command, syntax, description) => msg.reply('', {
  embeds: [new Embed()
    .title(`${command} usage`)
    .color('orange')
    .description(description)
    .field('Usage', syntax)],
});