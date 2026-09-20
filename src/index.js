const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const required = ['TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
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

client.once('ready', (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Single-server mode: ${process.env.GUILD_ID}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.guildId || interaction.guildId !== process.env.GUILD_ID) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ This bot is private and restricted to its configured server.',
        ephemeral: true,
      });
    }
    return;
  }

  // Command and component routing will be added as features are implemented.
});

client.on('error', (error) => console.error('Discord client error:', error));

client.login(process.env.TOKEN);
