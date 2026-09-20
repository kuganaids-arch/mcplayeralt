const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const permission = (builder, permissions) => builder.setDefaultMemberPermissions(permissions);
const user = (option, description = 'Select a member') => option.setName('user').setDescription(description).setRequired(true);
const reason = (option) => option.setName('reason').setDescription('Reason for this action').setRequired(false);
const channel = (option, description = 'Select a channel') => option.setName('channel').setDescription(description).addChannelTypes(ChannelType.GuildText).setRequired(true);
const role = (option, description = 'Select a role') => option.setName('role').setDescription(description).setRequired(true);

const moderation = [
  permission(new SlashCommandBuilder().setName('ban').setDescription('Ban a member').addUserOption(o => user(o)).addStringOption(o => reason(o)), PermissionFlagsBits.BanMembers),
  permission(new SlashCommandBuilder().setName('unban').setDescription('Unban a user').addStringOption(o => o.setName('userid').setDescription('User ID').setRequired(true)).addStringOption(o => reason(o)), PermissionFlagsBits.BanMembers),
  permission(new SlashCommandBuilder().setName('kick').setDescription('Kick a member').addUserOption(o => user(o)).addStringOption(o => reason(o)), PermissionFlagsBits.KickMembers),
  permission(new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').addUserOption(o => user(o)).addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setMinValue(1).setMaxValue(40320).setRequired(true)).addStringOption(o => reason(o)), PermissionFlagsBits.ModerateMembers),
  permission(new SlashCommandBuilder().setName('untimeout').setDescription('Remove a member timeout').addUserOption(o => user(o)), PermissionFlagsBits.ModerateMembers),
  permission(new SlashCommandBuilder().setName('warn').setDescription('Warn a member').addUserOption(o => user(o)).addStringOption(o => reason(o)), PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('warnings').setDescription('View a member warning count').addUserOption(o => user(o)),
  permission(new SlashCommandBuilder().setName('clear').setDescription('Delete recent messages').addIntegerOption(o => o.setName('amount').setDescription('1-100 messages').setMinValue(1).setMaxValue(100).setRequired(true)), PermissionFlagsBits.ManageMessages),
  permission(new SlashCommandBuilder().setName('slowmode').setDescription('Set channel slowmode').addIntegerOption(o => o.setName('seconds').setDescription('0-21600 seconds').setMinValue(0).setMaxValue(21600).setRequired(true)), PermissionFlagsBits.ManageChannels),
  permission(new SlashCommandBuilder().setName('lock').setDescription('Lock the current channel'), PermissionFlagsBits.ManageChannels),
  permission(new SlashCommandBuilder().setName('unlock').setDescription('Unlock the current channel'), PermissionFlagsBits.ManageChannels),
  permission(new SlashCommandBuilder().setName('lockall').setDescription('Lock all text channels'), PermissionFlagsBits.Administrator),
  permission(new SlashCommandBuilder().setName('unlockall').setDescription('Unlock all text channels'), PermissionFlagsBits.Administrator),
  permission(new SlashCommandBuilder().setName('nick').setDescription('Change a member nickname').addUserOption(o => user(o)).addStringOption(o => o.setName('nickname').setDescription('New nickname').setRequired(true)), PermissionFlagsBits.ManageNicknames),
  permission(new SlashCommandBuilder().setName('mute').setDescription('Mute a member using timeout').addUserOption(o => user(o)).addIntegerOption(o => o.setName('minutes').setDescription('Duration').setMinValue(1).setRequired(true)), PermissionFlagsBits.ModerateMembers),
  permission(new SlashCommandBuilder().setName('unmute').setDescription('Remove a member mute').addUserOption(o => user(o)), PermissionFlagsBits.ModerateMembers),
  permission(new SlashCommandBuilder().setName('roleadd').setDescription('Add a role to a member').addUserOption(o => user(o)).addRoleOption(o => role(o)), PermissionFlagsBits.ManageRoles),
  permission(new SlashCommandBuilder().setName('roleremove').setDescription('Remove a role from a member').addUserOption(o => user(o)).addRoleOption(o => role(o)), PermissionFlagsBits.ManageRoles),
  permission(new SlashCommandBuilder().setName('roleall').setDescription('Give a role to every member').addRoleOption(o => role(o)), PermissionFlagsBits.Administrator),
  permission(new SlashCommandBuilder().setName('roleall-remove').setDescription('Remove a role from every member').addRoleOption(o => role(o)), PermissionFlagsBits.Administrator),
];

const utility = [
  new SlashCommandBuilder().setName('help').setDescription('Show available MC_PLAYER ALT commands'),
  new SlashCommandBuilder().setName('ping').setDescription('Show bot latency'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Show server information'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Show user information').addUserOption(o => user(o, 'User to inspect')),
  new SlashCommandBuilder().setName('avatar').setDescription('Show a user avatar').addUserOption(o => user(o, 'User')),
  new SlashCommandBuilder().setName('banner').setDescription('Show a user banner').addUserOption(o => user(o, 'User')),
  new SlashCommandBuilder().setName('roleinfo').setDescription('Show role information').addRoleOption(o => role(o)),
  new SlashCommandBuilder().setName('channelinfo').setDescription('Show channel information').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(false)),
  new SlashCommandBuilder().setName('permissions').setDescription('Show your permissions'),
  new SlashCommandBuilder().setName('botinfo').setDescription('Show bot information'),
  new SlashCommandBuilder().setName('uptime').setDescription('Show bot uptime'),
  new SlashCommandBuilder().setName('stats').setDescription('Show bot statistics'),
  new SlashCommandBuilder().setName('invite').setDescription('Create an invite for this server'),
  new SlashCommandBuilder().setName('servericon').setDescription('Show the server icon'),
  new SlashCommandBuilder().setName('serverbanner').setDescription('Show the server banner'),
];

const roleCommand = permission(new SlashCommandBuilder().setName('role').setDescription('Manage roles').addSubcommand(s => s.setName('create').setDescription('Create a role').addStringOption(o => o.setName('name').setDescription('Role name').setRequired(true))).addSubcommand(s => s.setName('delete').setDescription('Delete a role').addRoleOption(o => role(o))).addSubcommand(s => s.setName('add').setDescription('Add a role').addUserOption(o => user(o)).addRoleOption(o => role(o))).addSubcommand(s => s.setName('remove').setDescription('Remove a role').addUserOption(o => user(o)).addRoleOption(o => role(o))).addSubcommand(s => s.setName('info').setDescription('Inspect a role').addRoleOption(o => role(o))), PermissionFlagsBits.ManageRoles);

const configurable = [
  new SlashCommandBuilder().setName('welcome').setDescription('Configure welcome and goodbye messages').addSubcommand(s => s.setName('setup').setDescription('Set welcome channel').addChannelOption(o => channel(o))).addSubcommand(s => s.setName('enable').setDescription('Enable welcome messages')).addSubcommand(s => s.setName('disable').setDescription('Disable welcome messages')).addSubcommand(s => s.setName('test').setDescription('Test welcome message')).addSubcommand(s => s.setName('message').setDescription('Set welcome message').addStringOption(o => o.setName('text').setDescription('Message text').setRequired(true))).addSubcommand(s => s.setName('channel').setDescription('Set welcome channel').addChannelOption(o => channel(o))),
  new SlashCommandBuilder().setName('ticket').setDescription('Manage tickets').addSubcommand(s => s.setName('setup').setDescription('Set up tickets').addChannelOption(o => channel(o))).addSubcommand(s => s.setName('panel').setDescription('Post ticket panel')).addSubcommand(s => s.setName('close').setDescription('Close this ticket')).addSubcommand(s => s.setName('reopen').setDescription('Reopen this ticket')).addSubcommand(s => s.setName('delete').setDescription('Delete this ticket')).addSubcommand(s => s.setName('add').setDescription('Add a member').addUserOption(o => user(o))).addSubcommand(s => s.setName('remove').setDescription('Remove a member').addUserOption(o => user(o))).addSubcommand(s => s.setName('rename').setDescription('Rename this ticket').addStringOption(o => o.setName('name').setDescription('New name').setRequired(true))).addSubcommand(s => s.setName('claim').setDescription('Claim this ticket')).addSubcommand(s => s.setName('transcript').setDescription('Create a transcript')),
  new SlashCommandBuilder().setName('embed').setDescription('Build embeds').addSubcommand(s => s.setName('create').setDescription('Create an embed')).addSubcommand(s => s.setName('edit').setDescription('Edit an embed').addStringOption(o => o.setName('id').setDescription('Embed ID').setRequired(true))).addSubcommand(s => s.setName('delete').setDescription('Delete an embed').addStringOption(o => o.setName('id').setDescription('Embed ID').setRequired(true))).addSubcommand(s => s.setName('preview').setDescription('Preview an embed').addStringOption(o => o.setName('id').setDescription('Embed ID').setRequired(true))).addSubcommand(s => s.setName('list').setDescription('List saved embeds')),
  new SlashCommandBuilder().setName('giveaway').setDescription('Manage giveaways').addSubcommand(s => s.setName('start').setDescription('Start a giveaway').addStringOption(o => o.setName('duration').setDescription('For example: 1h or 2d').setRequired(true)).addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setMinValue(1).setRequired(true)).addStringOption(o => o.setName('prize').setDescription('Prize').setRequired(true))).addSubcommand(s => s.setName('end').setDescription('End a giveaway').addStringOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))).addSubcommand(s => s.setName('reroll').setDescription('Reroll a giveaway').addStringOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))).addSubcommand(s => s.setName('cancel').setDescription('Cancel a giveaway').addStringOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))).addSubcommand(s => s.setName('list').setDescription('List giveaways')),
  new SlashCommandBuilder().setName('security').setDescription('Configure server security').addSubcommand(s => s.setName('setup').setDescription('Configure security')).addSubcommand(s => s.setName('antiraid').setDescription('Toggle anti-raid')).addSubcommand(s => s.setName('antispam').setDescription('Toggle anti-spam')).addSubcommand(s => s.setName('antilink').setDescription('Toggle anti-link')).addSubcommand(s => s.setName('antiinvite').setDescription('Toggle anti-invite')).addSubcommand(s => s.setName('verification').setDescription('Configure verification')).addSubcommand(s => s.setName('lockdown').setDescription('Lock down the server')),
  new SlashCommandBuilder().setName('automod').setDescription('Configure AutoMod').addSubcommand(s => s.setName('setup').setDescription('Set up AutoMod')).addSubcommand(s => s.setName('enable').setDescription('Enable AutoMod')).addSubcommand(s => s.setName('disable').setDescription('Disable AutoMod')).addSubcommand(s => s.setName('words').setDescription('Configure blocked words')).addSubcommand(s => s.setName('links').setDescription('Configure link filter')).addSubcommand(s => s.setName('spam').setDescription('Configure spam filter')).addSubcommand(s => s.setName('mentions').setDescription('Configure mention filter')),
  new SlashCommandBuilder().setName('autorole').setDescription('Configure automatic roles').addSubcommand(s => s.setName('set').setDescription('Set auto role').addRoleOption(o => role(o))).addSubcommand(s => s.setName('remove').setDescription('Remove auto role')).addSubcommand(s => s.setName('enable').setDescription('Enable auto role')).addSubcommand(s => s.setName('disable').setDescription('Disable auto role')),
];

module.exports = [...moderation, ...utility, roleCommand, ...configurable];
