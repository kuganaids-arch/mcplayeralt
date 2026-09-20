# MC_PLAYER ALT Render/Web Service troubleshooting

## Render settings

- Build command: `npm install`
- Start command: `npm run deploy && npm start`
- Health check path: `/health`
- Add `TOKEN`, `CLIENT_ID`, and `GUILD_ID` as Render environment variables.

If the bot is offline, open Render logs and look for `Discord login failed`. Check that the token is current, the bot is invited to the server, and the configured `GUILD_ID` is correct. Never put the token in GitHub.

## Discord permissions and intents

Enable **Server Members Intent** and **Message Content Intent** in the Developer Portal. Give the bot View Channels, Send Messages, Embed Links, Read Message History, Manage Channels, Manage Roles, and the moderation permissions required by the commands.

Set `TICKET_STAFF_ROLE_ID` to the role that should see tickets. Without it, Discord correctly hides the ticket from everyone except its opener and the bot.

## Behavior

- `/support` is deployed globally and may take up to an hour to appear; guild commands update immediately.
- The panel is posted once to the configured panel channel after startup.
- Welcome messages are sent to `WELCOME_CHANNEL_ID` for new members only. Test with a new join or use the welcome test command after implementing its handler.
- Tickets use a topic owner marker, so one user cannot create a second open ticket even if they change username. Ticket messages and ticket embeds are red.
