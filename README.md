# MC_PLAYER ALT

Single-server Discord bot built with Node.js and discord.js 14, deployable as a Render Web Service.

## Render Web Service setup

- **Service type:** Web Service
- **Build command:** `npm install`
- **Start command:** `npm run deploy && npm start`
- **Health check path:** `/health`

Add these environment variables in Render:

```text
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_single_server_id
```

Render provides the `PORT` variable automatically. The bot listens on `0.0.0.0` and exposes `/health` so the Web Service remains compatible with Render's health checks.

## Local setup

```bash
npm install
cp .env.example .env
npm run deploy
npm start
```

The bot is locked to `GUILD_ID` and will not operate in other servers. Never commit `.env` or your bot token.
