'use strict'

const Bot = require('./lib/Bot.js')
const config = require('../config.js')

const bot = new Bot(config)
bot.run()
