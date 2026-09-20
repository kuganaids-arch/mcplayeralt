const { Collection } = require('discord.js');
const commands = require('../commands');
const support = require('../commands/support');

const allCommands = [...commands, support];
const commandMap = new Collection(allCommands.map(command => [command.name, command]));
module.exports = { commands: allCommands, commandMap, support };
