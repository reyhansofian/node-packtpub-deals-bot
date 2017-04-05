# Packtpub Telegram Bot

## Prerequisite

1. **Token**. You need to talk to [@botfather](https://telegram.me/BotFather) and create a new bot.
2. Add your bot to a group (this bot is meant for group chat for now)
3. Send a `/start` message

## How to use
### With Git

1. Clone this repository `git clone https://github.com/reyhansofian/node-packtpub-deals-bot`
2. Run `npm install`
3. Run `TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN node index.js`

### With Docker

1. Pull this docker image `docker pull computecoholic/packtpub-telegram-bot`
2. Run the docker image

```sh
docker run \
    -p 49160:8080 \
    -e TELEGRAM_BOT_TOKEN='YOUR_BOT_TOKEN' \
    -d computecoholic/packtpub-telegram-bot
```
