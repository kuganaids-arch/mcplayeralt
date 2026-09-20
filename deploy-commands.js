const { commands } = require('./src/handlers/commandRegistry');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

for (const key of ['TOKEN', 'CLIENT_ID', 'GUILD_ID']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log(`Registering ${commands.length} guild commands...`);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands.map(command => command.toJSON()),
    });
    console.log('Guild commands registered successfully.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
})();
