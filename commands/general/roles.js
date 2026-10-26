export function setup(bot) {
  bot.command('roles', 'List roles in this server', async (msg) => {
    if (!msg.server_id) return msg.reply('This command only works in a server.');

    const roles = await bot.roles(msg.server_id);
    if (!roles.length) return msg.reply('I can’t see any roles here.');

    const list = roles.slice(0, 25)
      .map((role) => `• ${role.name || 'Unnamed role'}${role.id ? ` (\`${role.id}\`)` : ''}`)
      .join('\n');
    const remainder = roles.length > 25 ? `\n…and ${roles.length - 25} more.` : '';
    return msg.reply(`Roles (${roles.length}):\n${list}${remainder}`);
  });
}