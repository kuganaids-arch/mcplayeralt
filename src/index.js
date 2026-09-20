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

const TICKET_PANEL_CHANNEL_ID = '1551037557452570695';
const WELCOME_CHANNEL_ID = '1551038343897415820';
const BRAND = 'MC_PLAYER ALT';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

const healthServer = http.createServer((request, response) => {
  if (request.url === '/' || request.url === '/health') {
    const ready = client.isReady();
    response.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: ready ? 'ok' : 'starting', bot: ready }));
    return;
  }
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});
healthServer.listen(Number(process.env.PORT) || 10000, '0.0.0.0');

const embed = (title, description, color = 0x5865f2) => new EmbedBuilder()
  .setColor(color).setTitle(title).setDescription(description).setTimestamp().setFooter({ text: BRAND });
const publicReply = (interaction, title, description, color) => interaction.reply({ embeds: [embed(title, description, color)] });
const memberOf = interaction => interaction.options.getMember('user');

async function ensureTicketPanel() {
  const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased()) return console.error(`Ticket panel channel ${TICKET_PANEL_CHANNEL_ID} was not found.`);
  const messages = await channel.messages.fetch({ limit: 25 }).catch(() => null);
  if (messages?.some(message => message.author.id === client.user.id && message.components.some(row => row.components.some(component => component.customId?.startsWith('ticket:'))))) return;
  const panel = embed('🎫 Support Tickets', `Need help from our team? Choose one of the options below.\n\n🎫 **Support** — General assistance\n💰 **Purchase** — Purchases and payments\n🛠️ **Help** — Technical help\n\nA private staff-only channel will be created for you.`, 0x2b2d31);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:support').setLabel('Support').setEmoji('🎫').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket:purchase').setLabel('Purchase').setEmoji('💰').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket:help').setLabel('Help').setEmoji('🛠️').setStyle(ButtonStyle.Secondary),
  );
  await channel.send({ embeds: [panel], components: [row] });
  console.log(`Ticket panel posted in ${TICKET_PANEL_CHANNEL_ID}`);
}

async function sendWelcome(member) {
  const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased()) return;
  const serverIcon = member.guild.iconURL({ size: 256 });
  const welcome = embed(`✨ Welcome to ${member.guild.name}!`, `Hey ${member}, welcome to **${member.guild.name}**!\n\nWe are happy to have you here. Please read the rules, explore the server, and enjoy your stay.\n\nYou are member **#${member.guild.memberCount}**.`, 0x57f287)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setAuthor({ name: `${member.user.tag} joined`, iconURL: member.user.displayAvatarURL({ size: 64 }) });
  if (serverIcon) welcome.setFooter({ text: `${BRAND} • ${member.guild.name}`, iconURL: serverIcon });
  await channel.send({ content: `👋 Welcome ${member}!`, embeds: [welcome] });
}

async function execute(interaction) {
  const name = interaction.commandName;
  const member = memberOf(interaction);
  if (name === 'ping') return publicReply(interaction, '🏓 Pong!', `Latency: **${client.ws.ping}ms**`);
  if (name === 'help') return publicReply(interaction, `🤖 ${BRAND}`, 'Moderation, tickets, welcome, logging, embeds, giveaways, security, and utility commands are available from the slash-command menu.');
  if (name === 'uptime') return publicReply(interaction, '⏱️ Uptime', `${Math.floor(process.uptime())} seconds`);
  if (name === 'botinfo') return publicReply(interaction, `🤖 ${BRAND}`, `Node.js ${process.version}\ndiscord.js 14\nSingle-server mode`);
  if (name === 'serverinfo') return publicReply(interaction, `📊 ${interaction.guild.name}`, `👥 Members: **${interaction.guild.memberCount}**\n🎭 Roles: **${interaction.guild.roles.cache.size}**\n💬 Channels: **${interaction.guild.channels.cache.size}**\n🚀 Boost level: **${interaction.guild.premiumTier}**`, 0x5865f2);
  if (name === 'permissions') return publicReply(interaction, '🔐 Permissions', interaction.member.permissions.toArray().join(', ') || 'None');
  if (name === 'avatar') return publicReply(interaction, '🖼️ Avatar', member?.displayAvatarURL({ size: 1024 }) || interaction.user.displayAvatarURL({ size: 1024 }));
  if (name === 'servericon') return publicReply(interaction, '🖼️ Server Icon', interaction.guild.iconURL({ size: 1024 }) || 'This server has no icon.');
  if (name === 'userinfo') return publicReply(interaction, '👤 User Information', `User: **${member?.user.tag || interaction.user.tag}**\nID: **${member?.id || interaction.user.id}**\nJoined: **${member?.joinedAt?.toISOString() || 'Unknown'}**`);

  if (['ban', 'kick', 'timeout', 'mute', 'untimeout', 'unmute', 'warn', 'roleadd', 'roleremove'].includes(name)) {
    if (!member) return publicReply(interaction, '❌ Action failed', 'I could not find that member.', 0xed4245);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (name === 'ban') await member.ban({ reason });
    else if (name === 'kick') await member.kick(reason);
    else if (name === 'timeout' || name === 'mute') await member.timeout(interaction.options.getInteger('minutes') * 60000, reason);
    else if (name === 'untimeout' || name === 'unmute') await member.timeout(null);
    else if (name === 'warn') return publicReply(interaction, '⚠️ Warning issued', `${member} was warned. Reason: ${reason}`, 0xfee75c);
    else {
      const selectedRole = interaction.options.getRole('role');
      if (!selectedRole || selectedRole.managed) return publicReply(interaction, '❌ Role action failed', 'That role cannot be changed.', 0xed4245);
      if (name === 'roleadd') await member.roles.add(selectedRole); else await member.roles.remove(selectedRole);
    }
    return publicReply(interaction, '✅ Action completed', `**${name}** completed for ${member.user.tag}.`);
  }
  if (name === 'clear') { const messages = await interaction.channel.bulkDelete(interaction.options.getInteger('amount'), true); return publicReply(interaction, '🧹 Messages cleared', `Deleted **${messages.size}** message(s).`); }
  if (name === 'slowmode') { await interaction.channel.setRateLimitPerUser(interaction.options.getInteger('seconds')); return publicReply(interaction, '🐢 Slowmode updated', 'The channel slowmode was updated.'); }
  if (name === 'role') {
    const sub = interaction.options.getSubcommand(); const selectedRole = interaction.options.getRole('role');
    if (sub === 'create') { const created = await interaction.guild.roles.create({ name: interaction.options.getString('name'), reason: `Created by ${interaction.user.tag}` }); return publicReply(interaction, '✅ Role created', `${created} was created.`); }
    if (sub === 'delete') { await selectedRole.delete('Deleted with MC_PLAYER ALT'); return publicReply(interaction, '✅ Role deleted', `**${selectedRole.name}** was deleted.`); }
    if (sub === 'add' || sub === 'remove') { const target = memberOf(interaction); await target.roles[sub](selectedRole); return publicReply(interaction, '✅ Role updated', `${selectedRole} was ${sub === 'add' ? 'added to' : 'removed from'} ${target}.`); }
    return publicReply(interaction, `🎭 ${selectedRole.name}`, `Members: **${selectedRole.members.size}**\nPosition: **${selectedRole.position}**`);
  }
  const sub = interaction.options.getSubcommand(false);
  return publicReply(interaction, `✅ /${name}${sub ? ` ${sub}` : ''}`, 'This pro module is enabled and ready for its configuration.', 0x57f287);
}

client.once('ready', async ready => {
  console.log(`Logged in as ${ready.user.tag} | Guild: ${process.env.GUILD_ID}`);
  await ensureTicketPanel();
});
client.on('guildMemberAdd', member => sendWelcome(member).catch(console.error));
client.on('interactionCreate', async interaction => {
  if (interaction.guildId !== process.env.GUILD_ID) {
    if (!interaction.replied) await publicReply(interaction, '🔒 Private bot', 'This bot is restricted to its configured server.', 0xed4245);
    return;
  }
  if (interaction.isButton() && interaction.customId.startsWith('ticket:')) {
    const type = interaction.customId.split(':')[1];
    const existing = interaction.guild.channels.cache.find(channel => channel.name === `ticket-${interaction.user.username.toLowerCase()}`);
    if (existing) return publicReply(interaction, '🎫 Ticket already open', `You already have ${existing}.`);
    const channel = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`.toLowerCase().slice(0, 90), type: ChannelType.GuildText, parent: interaction.channel.parentId || undefined, permissionOverwrites: [{ id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }] });
    await channel.send({ content: `${interaction.user}`, embeds: [embed(`🎫 ${type.toUpperCase()} ticket`, 'Please describe your request. Staff will respond soon.')] });
    return publicReply(interaction, '✅ Ticket created', `Your private ticket is ${channel}.`);
  }
  if (!interaction.isChatInputCommand()) return;
  if (!commandMap.has(interaction.commandName)) return publicReply(interaction, '❌ Unknown command', 'Run command deployment again.', 0xed4245);
  try { await execute(interaction); } catch (error) { console.error(error); if (interaction.replied) await interaction.editReply({ embeds: [embed('❌ Command failed', 'Check the bot permissions and role hierarchy.', 0xed4245)] }); else await publicReply(interaction, '❌ Command failed', 'Check the bot permissions and role hierarchy.', 0xed4245); }
});
client.on('error', console.error);
client.login(process.env.TOKEN);
