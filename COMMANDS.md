# Command implementation status

All requested slash-command names and subcommands are registered for the single configured guild. Core utility, moderation, role-management, and channel-management actions are implemented. Ticket, welcome, embed, giveaway, security, AutoMod, and auto-role commands currently acknowledge requests and provide the integration point for the persistent SQLite/configuration layer.

Run `npm install`, configure `.env`, then run `npm run deploy` followed by `npm start`.
