# MC_PLAYER ALT

Single-server Discord bot built with Node.js and discord.js 14.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the Discord application values.
3. Register the slash commands:

   ```bash
   npm run deploy
   ```

4. Start the bot:

   ```bash
   npm start
   ```

The bot is locked to `GUILD_ID` and will not operate in other servers.
