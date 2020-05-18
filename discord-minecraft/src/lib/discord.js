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
      // Can't send more than 2000 characters
      if (text.length >= 2000) {
        text = text.substring(0, 1950)
        this.log.info(`Replied to ${msg.author.username}: (TRUNCATED) ${text}`)
      } else {
        this.log.info(`Replied to ${msg.author.username}: ${text}`)
      }
      msg.reply(text).catch(e => {
        this.log.error(e)
      })
    } catch (e) {
      this.log.error(e)
    }
  }
}
