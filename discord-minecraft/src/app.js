'use strict'

require('dotenv').config()
const Bunyan = require('bunyan')
const Discord = require('./lib/discord.js')
const Elastic = require('./lib/elastic.js')

const loggerName = 'discord-minecraft'
const elasticUrl = 'http://elasticsearch:9200'

class DiscordMinecraft {
  constructor (loggerName, elasticUrl) {
    const token = process.env.TOKEN

    this.log = Bunyan.createLogger({ name: loggerName })
    this.elastic = new Elastic(elasticUrl, this.log)
    this.discord = new Discord(token, this.log)
  }

  run () {
    this.registerEvents()
  }

  registerEvents () {
    this.discord.client.on('ready', () => { this.handleOnReady() })
    this.discord.client.on('message', msg => { this.handleOnMessage(msg) })
  }

  handleOnReady () {
    this.log.info(`Logged in as ${this.discord.client.user.tag}!`)
  }

  handleOnMessage (msg) {
    if (msg.content === '!mc-logins') {
      this.replyLogins(msg)
    }
  }

  replyLogins (msg) {
    this.log.info(`${msg.author.username} said "${msg.content}"`)

    this.elastic.getLogins(1).then(logins => {
      if (logins) {
        this.discord.reply(msg, `${logins}`)
      } else {
        this.discord.reply(msg, 'Something went wrong!')
      }
    })
  }
}
module.exports = DiscordMinecraft

const bot = new DiscordMinecraft(loggerName, elasticUrl)
bot.run()
