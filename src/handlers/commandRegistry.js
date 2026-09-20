const { Collection } = require('discord.js');
const commands = require('../commands');

const commandMap = new Collection(commands.map(command => [command.name, command]));
module.exports = { commands, commandMap };
