'use strict'

const DiscordJs = require('discord.js')

module.exports = class Discord {
  constructor (token, log) {
    this.log = log
    this.client = new DiscordJs.Client()
    this.client.login(token)
  }

  reply (msg, text) {
    try {
      this.log.info(`Replied to ${msg.author.username}: ${text}`)
      msg.reply(text)
    } catch (e) {
      this.log.error(e)
    }
  }
}
