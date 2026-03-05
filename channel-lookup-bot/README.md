# Discord Kick Bot (Dokploy)

This project runs a Discord slash command bot that calls Kick `GET /public/v1/channels` using a `slug` query parameter and posts the API response back to Discord.

## 1) Create Discord bot app

1. Go to Discord Developer Portal and create an application.
2. Open `Bot` tab and create a bot user.
3. Copy bot token and keep it secret.
4. In `OAuth2 -> URL Generator`:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Send Messages`, `Use Slash Commands`
5. Open generated URL and invite the bot to your server.

## 2) Configure environment

Copy `.env.example` values into Dokploy environment variables:

- `DISCORD_TOKEN`: Bot token from Discord portal
- `DISCORD_CLIENT_ID`: Discord application ID
- `DISCORD_GUILD_ID`: Discord server ID for command registration
- `KICK_API_BASE_URL`: Kick API host URL (default `https://api.kick.com`)
- `KICK_OAUTH2_TOKEN`: Kick OAuth2 bearer token

## 3) Kick API contract

The bot sends:

```http
GET /public/v1/channels?slug=<kick_username> HTTP/1.1
Host: api.kick.com
Authorization: Bearer <KICK_OAUTH2_TOKEN>
Accept: */*
```

Your API should return JSON or text. The bot prints the response in Discord.

## 4) Deploy with Dokploy

1. Push this folder to a Git repository.
2. In Dokploy, create a new application from that repo.
3. Build method: Dockerfile.
4. Add the environment variables listed above.
5. Deploy and check logs for:
   - `Ready as ...`
   - `Registered guild slash command: /kick`

## 5) Test

In your Discord server, run:

`/kick slug: trainwreckstv`

You should see the Kick API response in the bot reply.
