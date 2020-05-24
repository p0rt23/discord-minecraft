'use strict'

require('dotenv').config()

const config = {
  development: {
    bot: {
      token: process.env.TOKEN,
      minecraftChannel: '712098346805756004',
      logName: 'discord-minecraft-develop'
    },
    elasticSearch: {
      enabled: false,
      url: ''
    },
    minecraft: {
      rconEnabled: false,
      rconHost: '',
      rconPort: 0,
      rconPassword: '',
      logfileEnabled: false,
      logPath: ''
    },
    preferences: {
      enabled: true,
      path: 'preferences.json'
    }
  },
  testing: {
    bot: {
      token: process.env.TOKEN,
      minecraftChannel: '712098346805756004',
      logName: 'discord-minecraft-develop'
    },
    elasticSearch: {
      enabled: true,
      url: 'http://elasticsearch:9200'
    },
    minecraft: {
      rconEnabled: true,
      rconHost: 'minecraft',
      rconPort: 25564,
      rconPassword: process.env.RCON_SECRET,
      logfileEnabled: true,
      logPath: '/minecraft/logs/latest.log'
    },
    preferences: {
      enabled: true,
      path: '/preferences/preferences.json'
    }
  },
  production: {
    bot: {
      token: process.env.TOKEN,
      minecraftChannel: '712098346805756004',
      logName: 'discord-minecraft'
    },
    elasticSearch: {
      enabled: true,
      url: 'http://elasticsearch:9200'
    },
    minecraft: {
      rconEnabled: true,
      rconHost: 'minecraft',
      rconPort: 25564,
      rconPassword: process.env.RCON_SECRET,
      logfileEnabled: true,
      logPath: '/minecraft/logs/latest.log'
    },
    preferences: {
      enabled: true,
      path: '/preferences/preferences.json'
    }
  }
}

module.exports = config[process.env.NODE_ENV || 'development']
