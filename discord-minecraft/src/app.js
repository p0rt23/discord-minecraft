'use strict'

require('dotenv').config()
const Bunyan = require('bunyan')
const Discord = require('./lib/discord.js')
const Elastic = require('./lib/elastic.js')
const moment = require('moment')

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
        this.discord.reply(msg, this.formatLogins(logins))
      } else {
        this.discord.reply(msg, 'Something went wrong!')
      }
    }).catch(error => {
      this.log.error(error)
    })
  }

  formatLogins (logins) {
    const formatted = []
    let maxRecords = 10
    for (let i = 0; i < logins.length; i++) {
      try {
        const detail = JSON.parse(logins[i]._source.message)
        const message = detail.msg
        const time = detail.time
        const fromNow = moment(time).fromNow()
        formatted.push(`${message} (${fromNow})`)
      } catch (e) {
        this.log.error(e)
      }
      if (maxRecords-- === 0) {
        break
      }
    }
    return formatted.join('')
  }
}
module.exports = DiscordMinecraft

const bot = new DiscordMinecraft(loggerName, elasticUrl)
bot.run()
