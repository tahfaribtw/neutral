import { randomUUID } from 'node:crypto';
import { Button, Embed, Row } from '../../yapper.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONFIRMATION_TTL = 60_000;
const pendingActions = new Map();

export const targetId = (value) => value?.match(/^<@!?([^>]+)>$/)?.[1] || value;
export const isUserId = (value) => typeof value === 'string' && UUID.test(value);

export const actionEmbed = (title, target, reason, color = 'orange') => new Embed()
  .title(title)
  .color(color)
  .field('Target', `<@${target}>`)
  .field('Reason', reason);

export const replyUsage = (msg, command, syntax, description) => msg.reply('', {
  embeds: [new Embed()
    .title(`${command} usage`)
    .color('orange')
    .description(description)
    .field('Usage', syntax)],
});

const clearExpired = () => {
  for (const [id, pending] of pendingActions) {
    if (pending.expiresAt <= Date.now()) pendingActions.delete(id);
  }
};

export function registerConfirmedAction(bot, action) {
  const title = action === 'kick' ? 'Kick' : 'Ban';
  const syntax = `?${action} <@user|user-id> <reason>`;

  bot.command(action, `${title} a user after confirmation`, async (msg) => {
    if (!msg.server_id) return msg.reply('This command only works in a server.');

    const [rawTarget, ...reasonParts] = msg.argv;
    const target = targetId(rawTarget);
    const reason = reasonParts.join(' ').trim();
    if (!isUserId(target) || !reason || reason.length > 1024) {
      return replyUsage(msg, action, syntax, `Request a ${action} with a required reason. The action needs confirmation.`);
    }

    clearExpired();
    const id = randomUUID();
    pendingActions.set(id, {
      action,
      target,
      reason,
      serverId: msg.server_id,
      channelId: msg.channel_id,
      requestedBy: msg.author_id,
      expiresAt: Date.now() + CONFIRMATION_TTL,
    });

    return msg.reply('', {
      embeds: [actionEmbed(`Confirm ${action}?`, target, reason)],
      components: [new Row(
        Button.danger(`Confirm ${title}`, `moderation:${action}:confirm:${id}`),
        Button.secondary('Cancel', `moderation:${action}:cancel:${id}`),
      )],
    });
  });

  const pattern = new RegExp(`^moderation:${action}:(confirm|cancel):([0-9a-f-]+)$`, 'i');
  bot.onButton(pattern, async (interaction) => {
    const match = pattern.exec(interaction.custom_id);
    if (!match) return;
    const [, choice, id] = match;
    clearExpired();
    const pending = pendingActions.get(id);
    if (!pending) return interaction.ephemeral('This moderation confirmation expired or was already used.');
    if (interaction.user_id !== pending.requestedBy) {
      return interaction.ephemeral('Only the person who requested this action can confirm it.');
    }

    pendingActions.delete(id);
    if (choice === 'cancel') {
      await interaction.update({ components: [] });
      return bot.send(pending.channelId, '', {
        embeds: [actionEmbed(`${title} cancelled`, pending.target, pending.reason, 'grey')],
      });
    }

    await interaction.ack();
    try {
      await bot[action](pending.serverId, pending.target);
      const resultTitle = action === 'kick' ? 'User kicked' : 'User banned';
      return bot.send(pending.channelId, '', {
        embeds: [actionEmbed(resultTitle, pending.target, pending.reason, 'red')],
      });
    } catch (error) {
      console.error(`[${action}] failed:`, error);
      return bot.send(pending.channelId, '', {
        embeds: [new Embed()
          .title(`Failed!`)
          .color('red')
          .description('Check the bot’s permissions and the supplied user ID.')],
      });
    }
  });
}