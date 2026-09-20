const http = require('node:http');
const {
  Client, GatewayIntentBits, Partials, PresenceUpdateStatus,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionsBitField,
} = require('discord.js');
const { commandMap } = require('./handlers/commandRegistry');
const { createEmbed } = require('./utils/embeds');
require('dotenv').config();

for (const key of ['TOKEN', 'CLIENT_ID', 'GUILD_ID']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const PANEL_CHANNEL_ID = process.env.TICKET_PANEL_CHANNEL_ID || '1551037557452570695';
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1551038343897415820';
const STAFF_ROLE_ID = process.env.TICKET_STAFF_ROLE_ID || '';
const PORT = Number(process.env.PORT) || 10000;
const RED = 0xed4245;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

const healthServer = http.createServer((request, response) => {
  if (request.url === '/' || request.url === '/health') {
    const ready = client.isReady();
    response.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: ready ? 'ok' : 'starting', bot: ready, guild: process.env.GUILD_ID }));
    return;
  }
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});
healthServer.on('error', error => console.error('Health server error:', error));
healthServer.listen(PORT, '0.0.0.0', () => console.log(`Health server listening on ${PORT}`));

const publicReply = (interaction, title, description, color = 0x5865f2) => interaction.reply({ embeds: [createEmbed(title, description, color)] });
const memberOption = interaction => interaction.options.getMember('user');

async function postTicketPanel() {
  const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(error => { console.error('Ticket panel channel:', error.message); return null; });
  if (!channel?.isTextBased()) return;
  const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (messages?.some(message => message.author.id === client.user.id && message.components.some(row => row.components.some(component => component.customId === 'ticket:support')))) return;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:support').setLabel('Support').setEmoji('🎫').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:purchase').setLabel('Purchase').setEmoji('💰').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:help').setLabel('Help').setEmoji('🛠️').setStyle(ButtonStyle.Danger),
  );
  await channel.send({ embeds: [createEmbed('🎫 MC_PLAYER ALT Support Center', 'Choose Support, Purchase, or Help to open one private ticket.\n\n🔥 Powered By MC_PLAYER', RED)], components: [row] });
  console.log(`Ticket panel ready in ${PANEL_CHANNEL_ID}`);
}

async function findTicket(guild, userId) {
  await guild.channels.fetch();
  return guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.topic === `ticket-owner:${userId}`);
}

async function handleTicket(interaction, type) {
  const existing = await findTicket(interaction.guild, interaction.user.id);
  if (existing) return publicReply(interaction, '🎫 Ticket already open', `You already have ${existing}. Only one open ticket is allowed.`, RED);
  const permissions = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
  ];
  if (STAFF_ROLE_ID) permissions.push({ id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
  const ticket = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90), type: ChannelType.GuildText,
    topic: `ticket-owner:${interaction.user.id}`, parent: interaction.channel.parentId || undefined, permissionOverwrites: permissions,
  });
  const close = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
  await ticket.send({ content: `${interaction.user}`, embeds: [createEmbed(`🔴 ${type.toUpperCase()} ticket`, `Opened by: ${interaction.user}\nOnly the opener${STAFF_ROLE_ID ? ' and support staff' : ''} can view this ticket.`, RED)], components: [close] });
  return publicReply(interaction, '✅ Ticket created', `Your private ticket is ${ticket}.`, 0x57f287);
}

async function execute(interaction) {
  const name = interaction.commandName;
  const member = memberOption(interaction);
  if (name === 'support') return publicReply(interaction, '🛟 MC_PLAYER ALT Support', 'Use the ticket panel to choose Support, Purchase, or Help.');
  if (name === 'ping') return publicReply(interaction, '🏓 Pong!', `Latency: **${client.ws.ping}ms**`);
  if (name === 'help') return publicReply(interaction, '🤖 MC_PLAYER ALT', 'Use `/support` or the ticket panel. All commands are available through Discord’s slash-command menu.');
  if (name === 'uptime') return publicReply(interaction, '⏱️ Uptime', `${Math.floor(process.uptime())} seconds`);
  if (name === 'serverinfo') return publicReply(interaction, `📊 ${interaction.guild.name}`, `👥 Members: **${interaction.guild.memberCount}**\n🎭 Roles: **${interaction.guild.roles.cache.size}**\n💬 Channels: **${interaction.guild.channels.cache.size}**\n🚀 Boost level: **${interaction.guild.premiumTier}**`);
  if (name === 'permissions') return publicReply(interaction, '🔐 Permissions', interaction.member.permissions.toArray().join(', ') || 'None');
  if (name === 'avatar') return publicReply(interaction, '🖼️ Avatar', member?.displayAvatarURL({ size: 1024 }) || interaction.user.displayAvatarURL({ size: 1024 }));
  if (name === 'servericon') return publicReply(interaction, '🖼️ Server Icon', interaction.guild.iconURL({ size: 1024 }) || 'No server icon.');
  if (name === 'userinfo') return publicReply(interaction, '👤 User Information', `User: **${member?.user.tag || interaction.user.tag}**\nID: **${member?.id || interaction.user.id}**\nJoined: **${member?.joinedAt?.toISOString() || 'Unknown'}**`);
  if (name === 'clear') { const messages = await interaction.channel.bulkDelete(interaction.options.getInteger('amount'), true); return publicReply(interaction, '🧹 Messages cleared', `Deleted **${messages.size}** message(s).`); }
  if (name === 'slowmode') { await interaction.channel.setRateLimitPerUser(interaction.options.getInteger('seconds')); return publicReply(interaction, '🐢 Slowmode updated', 'Channel slowmode updated.'); }
  if (['ban', 'kick', 'timeout', 'mute', 'untimeout', 'unmute'].includes(name)) {
    if (!member) return publicReply(interaction, '❌ Action failed', 'Member not found.', RED);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (name === 'ban') await member.ban({ reason }); else if (name === 'kick') await member.kick(reason); else if (name === 'untimeout' || name === 'unmute') await member.timeout(null); else await member.timeout(interaction.options.getInteger('minutes') * 60000, reason);
    return publicReply(interaction, '✅ Action completed', `**${name}** completed for ${member.user.tag}.`);
  }
  const sub = interaction.options.getSubcommand(false);
  return publicReply(interaction, `✅ /${name}${sub ? ` ${sub}` : ''}`, 'Command received and processed. 🔥 Powered By MC_PLAYER');
}

client.once('clientReady', async ready => {
  ready.user.setPresence({ status: PresenceUpdateStatus.Online, activities: [{ name: 'MC_PLAYER ALT • /help', type: 0 }] });
  console.log(`Logged in as ${ready.user.tag}`);
  console.log(`Presence set to online | Single-server mode: ${process.env.GUILD_ID}`);
  await postTicketPanel().catch(error => console.error('Ticket panel setup failed:', error));
});
client.on('guildMemberAdd', async member => {
  const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(error => { console.error('Welcome channel:', error.message); return null; });
  if (!channel?.isTextBased()) return;
  await channel.send({ content: `👋 Welcome ${member}!`, embeds: [createEmbed(`✨ Welcome to ${member.guild.name}!`, `We are glad to have you here, ${member}.\n\nPlease read the rules, meet the community, and enjoy your stay.\n\nMember number: **${member.guild.memberCount}**`, 0x57f287, member.guild.iconURL({ size: 128 }))] });
});
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('ticket:')) {
      if (interaction.customId === 'ticket:close') { if (interaction.channel.topic?.startsWith('ticket-owner:')) await interaction.channel.delete('Ticket closed'); return; }
      if (interaction.guildId !== process.env.GUILD_ID) return publicReply(interaction, '🔒 Private bot', 'This bot is restricted to its configured server.', RED);
      return handleTicket(interaction, interaction.customId.split(':')[1]);
    }
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'support' && interaction.guildId !== process.env.GUILD_ID) return publicReply(interaction, '🔒 Private bot', 'This bot is restricted to its configured server.', RED);
    if (!commandMap.has(interaction.commandName)) return publicReply(interaction, '❌ Unknown command', 'Run deployment again.', RED);
    await execute(interaction);
  } catch (error) {
    console.error('Interaction failed:', error);
    const message = 'Check Render logs, bot permissions, channel access, and role hierarchy.';
    if (interaction.replied || interaction.deferred) await interaction.editReply({ embeds: [createEmbed('❌ Command failed', message, RED)] }).catch(() => {}); else await publicReply(interaction, '❌ Command failed', message, RED).catch(() => {});
  }
});
client.on('error', error => console.error('Discord client error:', error));
client.on('shardError', error => console.error('Discord gateway error:', error));
client.login(process.env.TOKEN).catch(error => { console.error('Discord login failed:', error); process.exitCode = 1; });
process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught exception:', error));
