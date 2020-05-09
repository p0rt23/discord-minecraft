'use strict'

const bunyan = require('bunyan')
const log = bunyan.createLogger({ name: 'discord-minecraft' })

require('dotenv').config()
const token = process.env.TOKEN

const { Client } = require('@elastic/elasticsearch')
const elastic = new Client({ node: 'http://elasticsearch:9200' })

const Discord = require('discord.js')
const discord = new Discord.Client()

discord.on('ready', () => {
  log.info(`minecraft-bot: Logged in as ${discord.user.tag}!`)
})

discord.login(token)

discord.on('message', msg => {
  if (msg.content === '!mc-logins') {
    log.info(`minecraft-bot: ${msg.author.username} said "${msg.content}"`)

    getLogins(24).then(logins => {
      if (logins) {
        msg.reply(logins)
      } else {
        msg.reply('No logins!')
      }
    })
  }
})

async function getLogins (hours) {
  try {
    const { body } = await elastic.search({
      index: 'filebeat-*',
      body: {
        query: {
          bool: {
            must: [],
            filter: [
              {
                bool: {
                  should: [{
                    'match-phrase': {
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
    log.info(body)
    return `Logins for past ${hours} hours: ${body.hits.total.value}`
  } catch (e) {
    log.error(e)
  }
}
