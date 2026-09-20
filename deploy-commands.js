const { REST, Routes } = require('discord.js');
const { commands, support } = require('./src/handlers/commandRegistry');
require('dotenv').config();

for (const key of ['TOKEN', 'CLIENT_ID', 'GUILD_ID']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands.filter(command => command.name !== 'support').map(command => command.toJSON()),
    });
    // /support is also registered globally. Global commands can take up to an hour to propagate.
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [support.toJSON()],
    });
    console.log(`Registered ${commands.length - 1} guild commands and /support globally.`);
  } catch (error) {
    console.error('Command deployment failed:', error);
    process.exitCode = 1;
  }
})();
