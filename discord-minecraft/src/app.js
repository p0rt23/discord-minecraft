'use strict'

require('dotenv').config()
const Bunyan = require('bunyan')
const Discord = require('./lib/discord.js')
const Elastic = require('./lib/elastic.js')
const moment = require('moment')
const Tail = require('tail-file')

const loggerName = 'discord-minecraft'
const elasticUrl = 'http://elasticsearch:9200'

class DiscordMinecraft {
  constructor (loggerName, elasticUrl) {
    const token = process.env.TOKEN
    this.log = Bunyan.createLogger({
      name: loggerName,
      level: 'debug'
    })
    try {
      this.logfile = new Tail('/minecraft/logs/latest.log', { force: true })
      this.elastic = new Elastic(elasticUrl, this.log)
      this.discord = new Discord(token, this.log)
    } catch (e) {
      this.log.error(e)
    }
  }

  run () {
    this.registerEvents()
    this.logfile.start()
  }

  registerEvents () {
    this.logfile.on('line', line => this.handleOnLine(line))
    this.logfile.on('error', err => this.log.error(err))
    this.discord.client.on('ready', () => { this.handleOnReady() })
    this.discord.client.on('message', msg => { this.handleOnMessage(msg) })
  }

  handleOnReady () {
    this.log.info(`Logged in as ${this.discord.client.user.tag}!`)
  }

  handleOnMessage (msg) {
    if (msg.content.match(/^!mc-logins/)) {
      this.replyLogins(msg)
    }
  }

  handleOnLine (line) {
    if (line.match(/<.+>/)) {
      this.log.debug(match[1])
      const match = line.match(/^\[.+\]\s\[.+\]:\s(.*)$/)
      if (match && match[1]) {
        this.log.info(match[1])
      }
    }
  }

  replyLogins (msg) {
    const match = msg.content.match(/^!mc-logins\s(\d+)/)
    let daysBack = 1
    if (match && match[1]) {
      daysBack = match[1]
    }

    this.log.info(`${msg.author.username} said "${msg.content}"`)

    this.elastic.getLogins(daysBack).then(logins => {
      if (logins.length > 0) {
        this.discord.reply(msg, this.formatLogins(logins, daysBack))
      } else {
        this.discord.reply(msg, `No logins in the past ${daysBack} day(s).`)
      }
    }).catch(error => {
      this.log.error(error)
    })
  }

  formatLogins (logins, daysBack) {
    const formatted = []
    let maxRecords = 10

    formatted.push(`Logins for the past ${daysBack} day(s):`)
    for (let i = 0; i < logins.length; i++) {
      try {
        const timestamp = logins[i]._source['@timestamp']
        const fromNow = moment(timestamp).fromNow()
        const message = logins[i]._source.message.replace(/^.*]: /, '')
        formatted.push(`${message} (${fromNow})`)
      } catch (e) {
        this.log.error(e)
      }
      if (maxRecords-- === 0) {
        break
      }
    }
    return formatted.join('\n')
  }
}
module.exports = DiscordMinecraft

const bot = new DiscordMinecraft(loggerName, elasticUrl)
bot.run()
