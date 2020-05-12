const { Client } = require('@elastic/elasticsearch')

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

        return `Logins for past ${days} days: ${body.hits.total.value}`
      } catch (e) {
        self.log.error(e)
      }
    }
  }
}