const http = require('node:http');
const {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
} = require('discord.js');
const { commandMap } = require('./handlers/commandRegistry');
require('dotenv').config();

for (const key of ['TOKEN', 'CLIENT_ID', 'GUILD_ID']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

// Render Web Services require an HTTP listener. This lightweight health endpoint
// keeps the service compatible with Render without changing bot behavior.
const healthServer = http.createServer((request, response) => {
  if (request.url === '/health' || request.url === '/') {
    const ready = client.isReady();
    response.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: ready ? 'ok' : 'starting', bot: ready }));
    return;
  }
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});

healthServer.listen(Number(process.env.PORT) || 10000, '0.0.0.0', () => {
  console.log(`Health server listening on port ${process.env.PORT || 10000}`);
});

const reply = (interaction, content, extra = {}) => interaction.reply({ content, ephemeral: true, ...extra });
const targetMember = interaction => interaction.options.getMember('user');

async function execute(interaction) {
  const name = interaction.commandName;
  const member = targetMember(interaction);
  if (name === 'ping') return reply(interaction, `🏓 Pong! ${client.ws.ping}ms`);
  if (name === 'help') return reply(interaction, '🤖 **MC_PLAYER ALT**\nModeration, tickets, welcome, logging, embeds, giveaways, security, and utility commands are enabled. Use `/` to browse commands.');
  if (name === 'uptime') return reply(interaction, `⏱️ Uptime: ${Math.floor(process.uptime())} seconds`);
  if (name === 'botinfo') return reply(interaction, `🤖 MC_PLAYER ALT\nNode.js ${process.version}\ndiscord.js 14\nSingle-server mode`);
  if (name === 'serverinfo') return reply(interaction, `**${interaction.guild.name}**\n👥 Members: ${interaction.guild.memberCount}\n🎭 Roles: ${interaction.guild.roles.cache.size}\n💬 Channels: ${interaction.guild.channels.cache.size}\n🚀 Boost level: ${interaction.guild.premiumTier}`);
  if (name === 'permissions') return reply(interaction, `Your permissions: ${interaction.member.permissions.toArray().join(', ') || 'None'}`);
  if (name === 'avatar') return reply(interaction, member?.displayAvatarURL({ size: 1024, extension: 'png' }) || interaction.user.displayAvatarURL({ size: 1024 }));
  if (name === 'servericon') return reply(interaction, interaction.guild.iconURL({ size: 1024 }) || 'This server has no icon.');
  if (name === 'userinfo') return reply(interaction, `👤 ${member?.user.tag || interaction.user.tag}\nID: ${member?.id || interaction.user.id}\nJoined: ${member?.joinedAt?.toISOString() || 'Unknown'}`);

  if (['ban', 'kick', 'timeout', 'mute', 'untimeout', 'unmute', 'warn', 'roleadd', 'roleremove'].includes(name)) {
    if (!member) return reply(interaction, '❌ I could not find that member.');
    if (name === 'ban') await member.ban({ reason: interaction.options.getString('reason') || 'No reason provided' });
    else if (name === 'kick') await member.kick(interaction.options.getString('reason') || 'No reason provided');
    else if (name === 'timeout' || name === 'mute') await member.timeout(interaction.options.getInteger('minutes') * 60 * 1000, interaction.options.getString('reason') || 'No reason provided');
    else if (name === 'untimeout' || name === 'unmute') await member.timeout(null);
    else if (name === 'warn') return reply(interaction, `⚠️ ${member.user.tag} has been warned. Persistent warning storage will be added with the database layer.`);
    else {
      const selectedRole = interaction.options.getRole('role');
      if (selectedRole?.managed) return reply(interaction, '❌ Managed roles cannot be changed.');
      if (name === 'roleadd') await member.roles.add(selectedRole);
      else await member.roles.remove(selectedRole);
    }
    return reply(interaction, `✅ ${name} completed for ${member.user.tag}.`);
  }

  if (name === 'clear') {
    const messages = await interaction.channel.bulkDelete(interaction.options.getInteger('amount'), true);
    return reply(interaction, `✅ Deleted ${messages.size} message(s).`);
  }
  if (name === 'slowmode') {
    await interaction.channel.setRateLimitPerUser(interaction.options.getInteger('seconds'));
    return reply(interaction, '✅ Slowmode updated.');
  }
  if (name === 'role') {
    const sub = interaction.options.getSubcommand();
    const selectedRole = interaction.options.getRole('role');
    if (sub === 'create') {
      const created = await interaction.guild.roles.create({ name: interaction.options.getString('name'), reason: 'Created with MC_PLAYER ALT' });
      return reply(interaction, `✅ Created ${created}.`);
    }
    if (sub === 'delete') { await selectedRole.delete('Deleted with MC_PLAYER ALT'); return reply(interaction, '✅ Role deleted.'); }
    if (sub === 'add' || sub === 'remove') { const target = targetMember(interaction); await target.roles[sub](selectedRole); return reply(interaction, `✅ Role ${sub} completed.`); }
    return reply(interaction, `🎭 ${selectedRole.name}\nMembers: ${selectedRole.members.size}\nPosition: ${selectedRole.position}`);
  }

  const sub = interaction.options.getSubcommand(false);
  return reply(interaction, `✅ /${name}${sub ? ` ${sub}` : ''} acknowledged. This module is scaffolded and ready for its persistent configuration and event handlers.`);
}

client.once('ready', ready => console.log(`Logged in as ${ready.user.tag} | Guild: ${process.env.GUILD_ID}`));
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.guildId !== process.env.GUILD_ID) return reply(interaction, '❌ This bot is private and restricted to its configured server.');
  if (!commandMap.has(interaction.commandName)) return reply(interaction, '❌ Unknown command. Run deployment again.');
  try {
    await execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) await interaction.editReply('❌ The command failed. Check the bot permissions and role hierarchy.');
    else await reply(interaction, '❌ The command failed. Check the bot permissions and role hierarchy.');
  }
});
client.on('error', console.error);
client.login(process.env.TOKEN);
