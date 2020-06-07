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
    this.botLogfileEnabled = config.minecraft.logfileEnabled
    this.log = Bunyan.createLogger({ name: config.bot.logName, level: 'debug' })
    this.discord = new Discord(config.bot.token, this.log)
    this.elastic = new Elastic(config.elasticSearch, this.log)
    this.minecraft = new Minecraft(config.minecraft, this.log)
    this.preferences = new Preferences(config, this.log)
    this.adminWhiteList = config.bot.adminWhiteList
  }

  addAdmin (msg) {
    // @bot !addAdmin @userTag
    const user = msg.mentions.users.last()
    this.preferences.addAdmin(msg.guild.id, user.id)
    this.discord.reply(msg, `${user.username} added as a bot admin!`)
    this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.addAdmin(): ${user.username}`)
  }

  clearPreferences (msg) {
    this.log.info(`[${msg.guild.name}] ${msg.author.username}: clearPreferences`)
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

  async formatStatus (msg) {
    const status = []

    status.push(`Current status of ${this.discord.client.user.username} on ${msg.guild.name}:`)
    status.push(`Version: ${process.env.npm_package_version}`)
    status.push(`!logins enabled: ${this.preferences.loginsEnabled(msg.guild.id)}`)
    status.push(`!chat enabled: ${this.preferences.chatEnabled(msg.guild.id)}`)
    status.push(`!savePreferences enabled: ${this.preferences.savePreferences(msg.guild.id)}`)
    status.push(`!joinMessages enabled: ${this.preferences.joinMessages(msg.guild.id)}`)
    status.push(`!achievements enabled: ${this.preferences.achievements(msg.guild.id)}`)
    status.push(`!leaveMessages enabled: ${this.preferences.leaveMessages(msg.guild.id)}`)

    const channelId = this.preferences.channel(msg.guild.id)
    let channelName = 'NONE'
    if (channelId !== undefined) {
      this.log.debug(`${msg.guild.name}|${msg.author.username}|Bot.formatStatus(): Fetching channel ${channelId}`)
      try {
        const channel = await this.discord.client.channels.fetch(this.preferences.channel(msg.guild.id))
        if (channel !== undefined) {
          channelName = channel.name
        }
      } catch (e) {
        this.log.error(e)
      }
    }
    status.push(`!channel set to: ${channelName}`)

    const adminNames = []
    const admins = this.preferences.getAdmins(msg.guild.id)
    admins.unshift(msg.guild.ownerID)
    if (admins.length > 0) {
      for (const userId of admins) {
        try {
          this.log.debug(`${msg.guild.name}|${msg.author.username}|Bot.formatStatus(): Fetching user ${userId}`)
          const user = await this.discord.client.users.fetch(userId)
          if (user !== undefined) {
            adminNames.push(user.username)
          }
        } catch (e) {
          this.log.error(e)
        }
      }
    }
    status.push(`Users who can change these settings: ${adminNames.join(', ')}`)

    /*
    this.discord.client.channels.fetch(this.preferences.channel(guild.id))
      .then(c => { status.push(`!channel set to: ${c.name}`) })
      .catch(e => this.log.error(e))
    const adminNames = []
    this.preferences.getAdmins(guild.id).forEach(userId => {
      this.discord.client.users.fetch(userId)
        .then(user => { adminNames.push(user.username) })
        .catch(e => this.log.error(e))
    })
    */
    return status.join('\n')
  }

  handleOnLine (line) {
    // [01:41:32] [Server thread/INFO]: [Rcon] <Reven> Testing!
    if (line.match(/\[Rcon\]/)) { return }

    if (line.match(/: <.+>/)) {
      // [01:41:45] [Server thread/INFO]: <p0rt23> Working
      this.sendLogToGuilds(line, 'chat')
    } else if (line.match(/joined the game$/)) {
      // [23:35:34] [Server thread/INFO]: p0rt23 joined the game
      this.sendLogToGuilds(line, 'joinMessages')
    } else if (line.match(/has made the advancement \[.+\]$/)) {
      // [23:40:26] [Server thread/INFO]: p0rt23 has made the advancement [Tactical Fishing]
      this.sendLogToGuilds(line, 'achievements')
    } else if (line.match(/left the game$/)) {
      // [23:40:31] [Server thread/INFO]: p0rt23 left the game
      this.sendLogToGuilds(line, 'leaveMessages')
    }
  }

  handleOnMessage (msg) {
    // Ignore bots
    if (msg.author.bot) { return }

    // Only process if message is tagged at @botname and from an Admin
    if (this.isAtMe(msg)) {
      if (!this.isFromAdmin(msg)) { return }
      if (msg.content.match(/!channel/)) {
        this.setChannel(msg)
      } else if (msg.content.match(/!status/)) {
        this.showStatus(msg)
      } else if (msg.content.match(/!savePreferences/) && this.preferences.botPrefsEnabled) {
        this.togglePreference(msg, 'savePreferences')
      } else if (msg.content.match(/!clearPreferences/) && this.preferences.botPrefsEnabled) {
        this.clearPreferences(msg)
      } else if (msg.content.match(/!chat/)) {
        this.togglePreference(msg, 'chat')
      } else if (msg.content.match(/!joinMessages/)) {
        this.togglePreference(msg, 'joinMessages')
      } else if (msg.content.match(/!achievements/)) {
        this.togglePreference(msg, 'achievements')
      } else if (msg.content.match(/!leaveMessages/)) {
        this.togglePreference(msg, 'leaveMessages')
      } else if (msg.content.match(/!help/)) {
        this.showAtHelp(msg)
      } else if (msg.content.match(/!addAdmin/)) {
        this.addAdmin(msg)
      } else if (msg.content.match(/!removeAdmin/)) {
        this.removeAdmin(msg)
      }
    } else {
      // Only process if message was in the right channel
      if (msg.channel.id === this.preferences.channel(msg.guild.id)) {
        if (msg.content.match(/^!logins/) && this.preferences.loginsEnabled(msg.guild.id)) {
          this.replyLogins(msg)
        } else if (msg.content.match(/^!help/)) {
          this.showHelp(msg)
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

  isFromAdmin (msg) {
    if (msg.author.id === msg.guild.ownerID) {
      this.log.debug(`${msg.guild.name}|${msg.author.username}|Bot.isFromAdmin(): guild-owner=true`)
      return true
    }
    if (this.preferences.getAdmins(msg.guild.id).indexOf(msg.author.id) > -1) {
      this.log.debug(`${msg.guild.name}|${msg.author.username}|Bot.isFromAdmin(): adminWhiteList.users=true`)
      return true
    }
    if (msg.member.hasPermission(this.adminWhiteList.roles)) {
      this.log.debug(`${msg.guild.name}|${msg.author.username}|Bot.isFromAdmin(): adminWhiteList.roles=true`)
      return true
    }
    this.log.debug(`${msg.guild.name}|${msg.author.username}|Bot.isFromAdmin(): false`)
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
    if (this.botLogfileEnabled) {
      this.minecraft.logfile.on('line', line => this.handleOnLine(line))
    }
  }

  removeAdmin (msg) {
    // @bot !removeAdmin @userTag
    const user = msg.mentions.users.last()
    this.preferences.removeAdmin(msg.guild.id, user.id)
    this.discord.reply(msg, `${user.username} removed as a bot admin!`)
    this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.removeAdmin(): ${user.username}`)
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

  sendLogToGuilds (line, pref) {
    const message = line.replace(/^\[.+\]:\s/, '')
    this.preferences.getGuilds().forEach(guildId => {
      const channel = this.preferences.channel(guildId)
      const isEnabled = this.preferences.preference(guildId, pref)
      if (channel !== undefined && isEnabled) {
        this.log.debug(`Fetching channel for: ${channel}`)
        this.discord.client.channels.fetch(channel).then(c => {
          c.send(message)
          this.log.debug(`${guildId}|${c.name}|Bot.sendLogToGuilds(): ${message}`)
        }).catch(err => this.log.error(err))
      }
    })
  }

  setChannel (msg) {
    const channel = msg.mentions.channels.first()
    if (channel !== undefined) {
      this.preferences.channel(msg.guild.id, channel.id)
      this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.setChannel(): channel=${channel.id} (${channel.name})`)
      this.discord.reply(msg, `channel set to ${channel.name}!`)
    }
  }

  showStatus (msg) {
    this.formatStatus(msg)
      .then(status => {
        this.discord.reply(msg, status)
        this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.showStatus()`)
      })
      .catch(e => this.log.error(e))
    // this.discord.reply(msg, this.formatStatus(msg.guild))
    // this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.showStatus()`)
  }

  showAtHelp (msg) {
    const help = []
    const me = this.discord.client.user.username

    help.push('here are commands you send @ me:')
    help.push(`@${me} !help (shows this message)`)
    help.push(`@${me} !status (displays my settings)`)
    help.push(`@${me} !channel #channelName (set the channel I listen to)`)
    help.push(`@${me} !savePreferences true|false (whether or not I store settings)`)
    help.push(`@${me} !clearPreferences (reset preferences to default for this server)`)
    help.push(`@${me} !chat true|false (toggle ability to chat with Minecraft server)`)
    help.push(`@${me} !joinMessages true|false (toggle sending a message when a player joins the server)`)
    help.push(`@${me} !leaveMessages true|false (toggle sending a message when a player leaves the server`)
    help.push(`@${me} !achievements true|false (toggle sending a message when a player gains an achievement)`)
    help.push(`@${me} !addAdmin @user (give a user permission to run these commands)`)
    help.push(`@${me} !removeAdmin @user (revoke permission for a user to run these commands)`)
    help.push('See !help in channel for channel commands.')

    this.discord.reply(msg, help.join('\n'))
    this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.showAtHelp()`)
  }

  showHelp (msg) {
    const help = []

    help.push('here are commands I\'ll respond to:')
    help.push('!help (shows this message)')
    help.push('!logins 1 (show player logins for the past 1 day)')

    this.discord.reply(msg, help.join('\n'))
    this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.showHelp()`)
  }

  togglePreference (msg, pref) {
    if (msg.content.match(/true/)) {
      this.preferences.preference(msg.guild.id, pref, true)
      this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.togglePreference(): ${pref}=true`)
      this.discord.reply(msg, `${pref} set to true.`)
    }
    if (msg.content.match(/false/)) {
      this.preferences.preference(msg.guild.id, pref, false)
      this.log.info(`${msg.guild.name}|${msg.author.username}|Bot.togglePreference(): ${pref}=false`)
      this.discord.reply(msg, `${pref} set to false.`)
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
