'use strict'

const Bunyan = require('bunyan')
const moment = require('moment')
const nodeCleanup = require('node-cleanup')
const Discord = require('./Discord.js')
const Elastic = require('./Elastic.js')
const Minecraft = require('./Minecraft.js')
const Preferences = require('./Preferences.js')

module.exports = class Bot {
  constructor (config) {
    this.chatEnabled = config.minecraft.rconEnabled
    this.minecraftChannel = config.bot.minecraftChannel

    this.log = Bunyan.createLogger({ name: config.bot.logName, level: 'debug' })
    this.discord = new Discord(config.bot.token, this.log)
    this.elastic = new Elastic(config.elasticSearch, this.log)
    this.minecraft = new Minecraft(config.minecraft, this.log)
    this.preferences = new Preferences(config, this.log)
  }

  run () {
    try {
      this.discord.init()
      this.elastic.init()
      this.minecraft.init()
      this.preferences.init()
      this.registerEvents()
    } catch (e) {
      this.log.error(e)
    }

    nodeCleanup((exitCode, signal) => {
      this.discord.finish()
      this.minecraft.finish()
    })
  }

  registerEvents () {
    this.discord.client.on('ready', () => { this.handleOnReady() })
    this.discord.client.on('message', msg => { this.handleOnMessage(msg) })
    if (this.chatEnabled) {
      this.minecraft.logfile.on('line', line => this.handleOnLine(line))
    }
  }

  handleOnReady () {
    this.log.info(`Logged in as ${this.discord.client.user.tag}!`)
  }

  handleOnMessage (msg) {
    if (msg.content.match(/^!mc-logins/) && this.preferences.loginsEnabled(msg.guild.id)) {
      this.replyLogins(msg)
    }
    if (msg.content.match(/^!say/) && this.preferences.chatEnabled(msg.guild.id)) {
      this.minecraftSay(msg)
    }
  }

  handleOnLine (line) {
    if (line.match(/\[Rcon\]/)) {
      return
    }
    if (line.match(/<.+>/)) {
      const match = line.match(/^\[.+\]\s\[.+\]:\s(.*)$/)
      if (match && match[1]) {
        this.log.debug(`Fetching channel for: ${this.minecraftChannel}`)
        this.discord.client.channels.fetch(this.minecraftChannel)
          .then(channel => {
            channel.send(match[1])
            this.log.info(`Sent to (${channel.name}): ${match[1]}`)
          })
          .catch(err => this.log.error(err))
      }
    }
  }

  minecraftSay (msg) {
    const match = msg.content.match(/^!say\s+(.*)$/)
    if (match && match[1]) {
      const message = `<${msg.author.username}> ${match[1]}`
      this.minecraft.say(message)
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
      if (logins && logins.length > 0) {
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
