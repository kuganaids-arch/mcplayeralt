const { EmbedBuilder } = require('discord.js');

const POWERED_FOOTER = '🔥 Powered By MC_PLAYER';

/**
 * Create a consistently branded embed for every public bot response.
 * @param {string} title Embed title.
 * @param {string} description Embed description.
 * @param {number} color Embed color.
 * @param {string} [iconURL] Optional footer icon URL.
 * @returns {EmbedBuilder}
 */
function createEmbed(title, description, color = 0x5865f2, iconURL) {
  const footer = { text: POWERED_FOOTER };
  if (iconURL) footer.iconURL = iconURL;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter(footer);
}

module.exports = { POWERED_FOOTER, createEmbed };
