'use strict'

const { Client } = require('@elastic/elasticsearch')

module.exports = class Elastic {
  constructor (config, log) {
    this.url = config.url
    this.enabled = config.enabled
    this.log = log
    this.client = {}
  }

  init () {
    if (this.enabled) {
      try {
        this.client = new Client({ node: this.url })
        this.log.debug(`ElasticSearch enabled: ${this.url}`)
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  getLogins (days = 1) {
    return getLogins(this, days)

    async function getLogins (self, days) {
      try {
        const { body } = await self.client.search({
          index: 'filebeat-*',
          body: {
            sort: [{ '@timestamp': 'desc' }],
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
                        gte: `now-${days}d/d`,
                        lte: 'now/d'
                      }
                    }
                  }
                ]
              }
            }
          }
        })
        self.log.debug(body.hits.hits)
        return body.hits.hits
      } catch (e) {
        self.log.error(e)
      }
    }
  }
}
