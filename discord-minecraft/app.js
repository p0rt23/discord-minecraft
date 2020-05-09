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
  log.info(`discord-minecraft: Logged in as ${discord.user.tag}!`)
})

discord.login(token)

discord.on('message', msg => {
  if (msg.content === '!mc-logins') {
    log.info(`discord-minecraft: ${msg.author.username} said "${msg.content}"`)

    getLogins(1).then(logins => {
      if (logins) {
        log.info(`discord-minecraft: ${logins}`)
        msg.reply(logins)
      } else {
        log.info(`discord-minecraft: No logins!`)
        msg.reply('No logins!')
      }
    })
  }
})

async function getLogins (days) {
  try {
    const { body } = await elastic.search({
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
    log.error(e)
  }
}
