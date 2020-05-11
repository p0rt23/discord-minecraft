'use strict'

require('dotenv').config()
const bunyan = require('bunyan')
const Discord = require('./lib/discord.js')
const { Client } = require('@elastic/elasticsearch')

const loggerName = 'discord-minecraft'
const elasticUrl = 'http://elasticsearch:9200'

class DiscordMinecraft {
  constructor (loggerName, elasticUrl) {
    const token = process.env.TOKEN

    this.log = bunyan.createLogger({ name: loggerName })
    this.elastic = new Client({ node: elasticUrl })
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

    getLogins(this, 1).then(logins => {
      if (logins) {
        this.discord.reply(msg, `${logins}`)
      } else {
        this.discord.reply(msg, 'No logins!')
      }
    })

    async function getLogins (self, days) {
      try {
        const { body } = await self.elastic.search({
          index: 'filebeat-*',
          body: {
            query: {
              bool: {
                filter: [
                  {
                    bool: {
                      should: [{
                        match_phrase: {
                          message: 'joined the game'
                        }
                      }],
                      minimum_should_match: 1
                    }
                  },
                  {
                    match_phrase: {
                      'container.name': 'minecraft'
                    }
                  },
                  {
                    range: {
                      '@timestamp': {
                        gte: 'now-1d/d',
                        lte: 'now/d'
                      }
                    }
                  }
                ]
              }
            }
          }
        })
        return `Logins for past ${days} days: ${body.hits.total.value}`
      } catch (e) {
        self.log.error(e)
      }
    }
  }
}
module.exports = DiscordMinecraft

const bot = new DiscordMinecraft(loggerName, elasticUrl)
bot.run()
