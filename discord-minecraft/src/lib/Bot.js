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
    this.botChatEnabled = config.minecraft.rconEnabled
    this.log = Bunyan.createLogger({ name: config.bot.logName, level: 'debug' })
    this.discord = new Discord(config.bot.token, this.log)
    this.elastic = new Elastic(config.elasticSearch, this.log)
    this.minecraft = new Minecraft(config.minecraft, this.log)
    this.preferences = new Preferences(config, this.log)
  }

  clearPreferences (msg) {
    this.log.info(`[${msg.guild.id}] ${msg.author.username}: clearPreferences`)
    this.preferences.clearPreferences(msg.guild.id)
    this.discord.reply(msg, 'preferences cleared!')
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

  formatStatus (id) {
    const status = []
    status.push(`Current status of ${this.discord.client.user}:`)
    for (const key in this.preferences.prefs[id]) {
      status.push(`${key}: ${this.preferences.prefs[id][key]}`)
    }
    return status.join('\n')
  }

  handleOnLine (line) {
    if (line.match(/\[Rcon\]/)) {
      return
    }
    if (line.match(/<.+>/)) {
      const match = line.match(/^\[.+\]\s\[.+\]:\s(.*)$/)
      if (match && match[1]) {
        // Any guilds subscribed to chat should get the message
        this.preferences.getGuilds().forEach(guildId => {
          const channel = this.preferences.channel(guildId)
          if (channel !== undefined && this.preferences.chatEnabled(guildId)) {
            this.log.debug(`Fetching channel for: ${channel}`)
            this.discord.client.channels.fetch(channel)
              .then(c => {
                c.send(match[1])
                this.log.info(`Sent to (${c.name}): ${match[1]}`)
              })
              .catch(err => this.log.error(err))
          }
        })
      }
    }
  }

  handleOnMessage (msg) {
    // Only process if message is tagged at @botname
    if (this.isAtMe(msg)) {
      if (msg.content.match(/!channel/)) {
        this.setChannel(msg)
      } else if (msg.content.match(/!status/)) {
        this.showStatus(msg)
      } else if (msg.content.match(/!savePreferences/) && this.preferences.botPrefsEnabled) {
        this.toggleSavePreferences(msg)
      } else if (msg.content.match(/!clearPreferences/) && this.preferences.botPrefsEnabled) {
        this.clearPreferences(msg)
      } else if (msg.content.match(/!chat/)) {
        this.toggleChat(msg)
      }
    } else {
      // Only process if message was in the right channel
      if (msg.channel.id === this.preferences.channel(msg.guild.id)) {
        if (msg.content.match(/^!logins/) && this.preferences.loginsEnabled(msg.guild.id)) {
          this.replyLogins(msg)
        } else {
          if (this.preferences.chatEnabled(msg.guild.id) && (!this.isFromMe(msg))) {
            this.minecraftSay(msg)
          }
        }
      }
    }
  }

  handleOnReady () {
    this.log.info(`Logged in as ${this.discord.client.user.tag}!`)
  }

  isAtMe (msg) {
    const taggedUser = msg.mentions.users.first()
    const me = this.discord.client.user
    if ((taggedUser !== undefined) && (taggedUser.username === me.username)) {
      return true
    }
    return false
  }

  isFromMe (msg) {
    return (msg.author.username === this.discord.client.user.username)
  }

  minecraftSay (msg) {
    const message = `<${msg.author.username}> ${msg.content}`
    this.minecraft.say(message)
  }

  registerEvents () {
    this.discord.client.on('ready', () => { this.handleOnReady() })
    this.discord.client.on('message', msg => { this.handleOnMessage(msg) })
    if (this.botChatEnabled) {
      this.minecraft.logfile.on('line', line => this.handleOnLine(line))
    }
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

  setChannel (msg) {
    const channel = msg.mentions.channels.first()
    if (channel !== undefined) {
      this.preferences.channel(msg.guild.id, channel.id)
      this.log.info(`[${msg.guild.id}] ${msg.author.username}: channel=${channel.id} (${channel.name})`)
      this.discord.reply(msg, `channel set to ${channel.name}!`)
    }
  }

  showStatus (msg) {
    this.discord.reply(msg, this.formatStatus(msg.guild.id))
    this.log.info(`[${msg.guild.id}] ${msg.author.username}: showStatus`)
  }

  toggleChat (msg) {
    if (msg.content.match(/true/)) {
      this.preferences.chatEnabled(msg.guild.id, true)
      this.log.info(`[${msg.guild.id}] ${msg.author.username}: chat=true`)
    }
    if (msg.content.match(/false/)) {
      this.preferences.chatEnabled(msg.guild.id, false)
      this.log.info(`[${msg.guild.id}] ${msg.author.username}: chat=false`)
    }
  }

  toggleSavePreferences (msg) {
    if (msg.content.match(/true/)) {
      this.preferences.savePreferences(msg.guild.id, true)
      this.log.info(`[${msg.guild.id}] ${msg.author.username}: savePreferences=true`)
    }
    if (msg.content.match(/false/)) {
      this.preferences.savePreferences(msg.guild.id, false)
      this.log.info(`[${msg.guild.id}] ${msg.author.username}: savePreferences=false`)
    }
  }

  replyLogins (msg) {
    const match = msg.content.match(/^!logins\s(\d+)/)
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
}
