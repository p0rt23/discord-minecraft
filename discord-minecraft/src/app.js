'use strict'

require('dotenv').config()
const DiscordMinecraft = require('./DiscordMinecraft.js')

const bot = new DiscordMinecraft({
  bot: {
    token: process.env.TOKEN,
    minecraftChannel: 712098346805756004,
    logName: 'discord-minecraft'
  },
  elasticSearch: {
    enabled: true,
    url: 'http://elasticsearch:9200'
  },
  minecraft: {
    rconEnabled: false,
    rconHost: 'minecraft',
    rconPort: 25564,
    rconPassword: 'secret',
    logfileEnabled: true,
    logPath: '/minecraft/logs/latest.log'
  }
})
bot.run()
