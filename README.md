# kick-discord-bots

This repository contains two separate Discord bot projects.

- `channel-lookup-bot/`: Slash-command bot that calls Kick `GET /public/v1/channels?slug=...` and posts the response to Discord.
- `screenshot-bot/`: Existing screenshot-focused Discord bot project.

## Deploy with Dokploy

Create one Dokploy application per folder:

- App 1: repository `ustacode/kick-discord-bots`, branch `discord-kick-bot`, Docker context path `./channel-lookup-bot`, Dockerfile path `./channel-lookup-bot/Dockerfile`.
- App 2: repository `ustacode/kick-discord-bots`, choose branch for screenshot bot, context path `./screenshot-bot`.
