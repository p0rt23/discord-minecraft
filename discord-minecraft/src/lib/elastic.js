const { Client } = require('@elastic/elasticsearch')
// const util = require('util')

module.exports = class Elastic {
  constructor (elasticUrl, log) {
    this.log = log
    try {
      this.client = new Client({ node: elasticUrl })
    } catch (e) {
      this.log.error(e)
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
                          // message: 'joined the game'
                          message: 'Logged in as'
                        }
                      }],
                      minimum_should_match: 1
                    }
                  },
                  {
                    match_phrase: {
                      // 'container.name': 'minecraft'
                      'container.name': 'discord-minecraft'
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

        // return `Logins for past ${days} days: ${body.hits.total.value}`
        // return body.hits.hits.map(e => e._source.message).join('\n')
        return body.hits.hits
      } catch (e) {
        self.log.error(e)
      }
    }
  }
}
