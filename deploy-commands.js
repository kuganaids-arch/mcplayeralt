const path = require('node:path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const required = ['TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Commands will be added here as features are implemented.
const commands = [];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} command(s) to guild ${process.env.GUILD_ID}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('Guild commands registered successfully.');
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exitCode = 1;
  }
})();
