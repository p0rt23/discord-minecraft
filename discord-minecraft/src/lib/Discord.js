'use strict'

const DiscordJs = require('discord.js')

module.exports = class Discord {
  constructor (token, log) {
    this.log = log
    this.token = token
  }

  init () {
    try {
      this.client = new DiscordJs.Client()
      this.client.login(this.token)
    } catch (e) {
      this.log.error(e)
    }
  }

  reply (msg, text) {
    try {
      // Can't send more than 2000 characters
      if (text.length >= 2000) {
        text = text.substring(0, 1950)
        this.log.debug(`${msg.guild.name}|${msg.author.username}|Discord.reply(): (TRUNCATED) ${text}`)
      } else {
        this.log.debug(`${msg.guild.name}|${msg.author.username}|Discord.reply(): ${text}`)
      }
      msg.reply(text).catch(e => {
        this.log.error(e)
      })
    } catch (e) {
      this.log.error(e)
    }
  }

  finish () {
    this.client.destroy()
  }
}
