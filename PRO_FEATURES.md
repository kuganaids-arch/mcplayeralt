# MC_PLAYER ALT Pro Configuration

The bot now provides public, professional embed responses instead of ephemeral confirmations.

## Automatic ticket panel

On startup, the bot posts one panel to channel `1551037557452570695` if a panel is not already present. It has three buttons:

- 🎫 Support
- 💰 Purchase
- 🛠️ Help

Each button creates a private ticket channel for the requesting member.

## Professional welcome messages

New members receive a branded welcome embed in channel `1551038343897415820`. The embed includes the server name, server icon, member avatar, username, and current member count.

The bot requires `View Channel`, `Send Messages`, `Embed Links`, `Manage Channels`, and `Manage Roles` as appropriate. Re-run `npm run deploy` after command-definition changes, then restart the Render service.
