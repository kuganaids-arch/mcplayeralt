const http = require('node:http');
const {
  Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField,
} = require('discord.js');
const { commandMap } = require('./handlers/commandRegistry');
require('dotenv').config();

for (const key of ['TOKEN', 'CLIENT_ID', 'GUILD_ID']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const PANEL_CHANNEL_ID = process.env.TICKET_PANEL_CHANNEL_ID || '1551037557452570695';
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1551038343897415820';
const STAFF_ROLE_ID = process.env.TICKET_STAFF_ROLE_ID || '';
const BRAND = 'MC_PLAYER ALT';
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
healthServer.listen(Number(process.env.PORT) || 10000, '0.0.0.0', () => console.log(`HTTP health server listening on ${process.env.PORT || 10000}`));

const makeEmbed = (title, description, color = 0x5865f2) => new EmbedBuilder()
  .setColor(color).setTitle(title).setDescription(description).setTimestamp().setFooter({ text: BRAND });
const reply = (interaction, title, description, color = 0x5865f2) => interaction.reply({ embeds: [makeEmbed(title, description, color)] });
const memberOption = interaction => interaction.options.getMember('user');

function ticketOverwrites(guild, userId) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
  ];
  if (STAFF_ROLE_ID) overwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
  return overwrites;
}

async function findOpenTicket(guild, userId) {
  await guild.channels.fetch();
  return guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.topic === `ticket-owner:${userId}`);
}

async function postTicketPanel() {
  const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(error => { console.error('Ticket panel channel fetch failed:', error.message); return null; });
  if (!channel?.isTextBased()) return;
  const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  const alreadyPosted = messages?.some(message => message.author.id === client.user.id && message.components.some(row => row.components.some(component => component.customId === 'ticket:support')));
  if (alreadyPosted) return;
  const panel = makeEmbed('🎫 MC_PLAYER ALT Support Center', 'Choose one option below to open a private support ticket.\n\n🎫 **Support** — General assistance\n💰 **Purchase** — Purchases and payments\n🛠️ **Help** — Technical support\n\nOnly you and the support team can see your ticket.', 0x2b2d31);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:support').setLabel('Support').setEmoji('🎫').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:purchase').setLabel('Purchase').setEmoji('💰').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:help').setLabel('Help').setEmoji('🛠️').setStyle(ButtonStyle.Danger),
  );
  await channel.send({ embeds: [panel], components: [row] });
}

async function sendWelcome(member) {
  const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(error => { console.error('Welcome channel fetch failed:', error.message); return null; });
  if (!channel?.isTextBased()) return;
  const icon = member.guild.iconURL({ size: 256 });
  const welcome = makeEmbed(`✨ Welcome to ${member.guild.name}!`, `Hey ${member}, welcome to **${member.guild.name}**!\n\nWe are glad to have you here. Please read the rules, meet the community, and enjoy your stay.\n\nYou are member **#${member.guild.memberCount}**.`, 0x57f287)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setAuthor({ name: `${member.user.tag} joined`, iconURL: member.user.displayAvatarURL({ size: 64 }) });
  if (icon) welcome.setFooter({ text: `${BRAND} • ${member.guild.name}`, iconURL: icon });
  await channel.send({ content: `👋 Welcome ${member}!`, embeds: [welcome] });
}

async function execute(interaction) {
  const name = interaction.commandName;
  const member = memberOption(interaction);
  if (name === 'support') return reply(interaction, '🛟 MC_PLAYER ALT Support', 'Use the support panel in the server to open a private ticket. Choose Support, Purchase, or Help. If the panel is missing, ask an administrator to restart the bot.', 0x57f287);
  if (name === 'ping') return reply(interaction, '🏓 Pong!', `Latency: **${client.ws.ping}ms**`);
  if (name === 'help') return reply(interaction, `🤖 ${BRAND}`, 'Use `/support` for help. Moderation, tickets, welcome, security, utility, embeds, giveaways, and role commands are available from the slash-command menu.');
  if (name === 'uptime') return reply(interaction, '⏱️ Uptime', `${Math.floor(process.uptime())} seconds`);
  if (name === 'botinfo') return reply(interaction, `🤖 ${BRAND}`, `Node.js ${process.version}\ndiscord.js 14\nSingle-server mode`);
  if (name === 'serverinfo') return reply(interaction, `📊 ${interaction.guild.name}`, `👥 Members: **${interaction.guild.memberCount}**\n🎭 Roles: **${interaction.guild.roles.cache.size}**\n💬 Channels: **${interaction.guild.channels.cache.size}**\n🚀 Boost level: **${interaction.guild.premiumTier}**`);
  if (name === 'permissions') return reply(interaction, '🔐 Permissions', interaction.member.permissions.toArray().join(', ') || 'None');
  if (name === 'avatar') return reply(interaction, '🖼️ Avatar', member?.displayAvatarURL({ size: 1024 }) || interaction.user.displayAvatarURL({ size: 1024 }));
  if (name === 'servericon') return reply(interaction, '🖼️ Server Icon', interaction.guild.iconURL({ size: 1024 }) || 'This server has no icon.');
  if (name === 'userinfo') return reply(interaction, '👤 User Information', `User: **${member?.user.tag || interaction.user.tag}**\nID: **${member?.id || interaction.user.id}**\nJoined: **${member?.joinedAt?.toISOString() || 'Unknown'}**`);
  if (['ban', 'kick', 'timeout', 'mute', 'untimeout', 'unmute', 'warn', 'roleadd', 'roleremove'].includes(name)) {
    if (!member) return reply(interaction, '❌ Action failed', 'I could not find that member.', RED);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (name === 'ban') await member.ban({ reason });
    else if (name === 'kick') await member.kick(reason);
    else if (name === 'timeout' || name === 'mute') await member.timeout(interaction.options.getInteger('minutes') * 60000, reason);
    else if (name === 'untimeout' || name === 'unmute') await member.timeout(null);
    else if (name === 'warn') return reply(interaction, '⚠️ Warning issued', `${member} was warned.\nReason: ${reason}`, 0xfee75c);
    else { const selectedRole = interaction.options.getRole('role'); if (!selectedRole || selectedRole.managed) return reply(interaction, '❌ Role action failed', 'That role cannot be changed.', RED); if (name === 'roleadd') await member.roles.add(selectedRole); else await member.roles.remove(selectedRole); }
    return reply(interaction, '✅ Action completed', `**${name}** completed for ${member.user.tag}.`);
  }
  if (name === 'clear') { const messages = await interaction.channel.bulkDelete(interaction.options.getInteger('amount'), true); return reply(interaction, '🧹 Messages cleared', `Deleted **${messages.size}** message(s).`); }
  if (name === 'slowmode') { await interaction.channel.setRateLimitPerUser(interaction.options.getInteger('seconds')); return reply(interaction, '🐢 Slowmode updated', 'The channel slowmode was updated.'); }
  if (name === 'role') { const sub = interaction.options.getSubcommand(); const selectedRole = interaction.options.getRole('role'); if (sub === 'create') { const created = await interaction.guild.roles.create({ name: interaction.options.getString('name'), reason: `Created by ${interaction.user.tag}` }); return reply(interaction, '✅ Role created', `${created} was created.`); } if (sub === 'delete') { await selectedRole.delete('Deleted with MC_PLAYER ALT'); return reply(interaction, '✅ Role deleted', `**${selectedRole.name}** was deleted.`); } if (sub === 'add' || sub === 'remove') { const target = memberOption(interaction); await target.roles[sub](selectedRole); return reply(interaction, '✅ Role updated', `${selectedRole} was updated for ${target}.`); } return reply(interaction, `🎭 ${selectedRole.name}`, `Members: **${selectedRole.members.size}**\nPosition: **${selectedRole.position}**`); }
  const sub = interaction.options.getSubcommand(false);
  return reply(interaction, `✅ /${name}${sub ? ` ${sub}` : ''}`, 'The command is registered. This feature is ready for configuration.', 0x57f287);
}

client.once('ready', async ready => {
  console.log(`Logged in as ${ready.user.tag} (${ready.user.id}) | Guild: ${process.env.GUILD_ID}`);
  const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
  if (!guild) console.error('Configured GUILD_ID is not accessible. Check the ID and bot invite.');
  await postTicketPanel().catch(error => console.error('Ticket panel setup failed:', error));
});
client.on('guildMemberAdd', member => sendWelcome(member).catch(error => console.error('Welcome failed:', error)));
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('ticket:')) {
      if (interaction.guildId !== process.env.GUILD_ID) return reply(interaction, '🔒 Private bot', 'This bot is restricted to its configured server.', RED);
      const type = interaction.customId.split(':')[1];
      const existing = await findOpenTicket(interaction.guild, interaction.user.id);
      if (existing) return reply(interaction, '🎫 Ticket already open', `You already have ${existing}. Only one open ticket is allowed per user.`, RED);
      const ticket = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 85), type: ChannelType.GuildText, topic: `ticket-owner:${interaction.user.id}`, parent: interaction.channel.parentId || undefined, permissionOverwrites: ticketOverwrites(interaction.guild, interaction.user.id) });
      const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
      await ticket.send({ content: `${interaction.user}`, embeds: [makeEmbed(`🔴 ${type.toUpperCase()} ticket`, `**Opened by:** ${interaction.user}\n**Visibility:** ticket owner${STAFF_ROLE_ID ? ' + support staff' : ''}\n\nPlease describe your request.`, RED)], components: [closeRow] });
      return reply(interaction, '✅ Ticket created', `Your private ticket is ${ticket}.` , 0x57f287);
    }
    if (interaction.isButton() && interaction.customId === 'ticket:close') {
      if (!interaction.channel.topic?.startsWith('ticket-owner:')) return reply(interaction, '❌ Not a ticket', 'This channel is not a managed ticket.', RED);
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageChannels) && interaction.channel.topic !== `ticket-owner:${interaction.user.id}`) return reply(interaction, '❌ Not allowed', 'Only the ticket owner or staff can close this ticket.', RED);
      await interaction.channel.delete('Ticket closed');
      return;
    }
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'support' && interaction.guildId !== process.env.GUILD_ID) return reply(interaction, '🔒 Private bot', 'This bot is restricted to its configured server.', RED);
    if (!commandMap.has(interaction.commandName)) return reply(interaction, '❌ Unknown command', 'Run deployment again.', RED);
    await execute(interaction);
  } catch (error) {
    console.error('Interaction failed:', error);
    if (interaction.replied || interaction.deferred) await interaction.editReply({ embeds: [makeEmbed('❌ Command failed', 'Check Render logs, bot permissions, and role hierarchy.', RED)] }).catch(() => {});
    else await reply(interaction, '❌ Command failed', 'Check Render logs, bot permissions, and role hierarchy.', RED).catch(() => {});
  }
});
client.on('error', error => console.error('Discord client error:', error));
client.on('shardError', error => console.error('Discord gateway error:', error));
client.login(process.env.TOKEN).catch(error => { console.error('Discord login failed:', error); process.exitCode = 1; });
process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught exception:', error));
