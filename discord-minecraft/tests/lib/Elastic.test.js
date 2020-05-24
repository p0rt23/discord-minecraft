const Elastic = require('../../src/lib/Elastic.js')

jest.mock('@elastic/elasticsearch')

const log = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}
const config = {
  url: 'http://test-elastic-instance',
  enabled: true
}

const elastic = new Elastic(config, log)

describe('lib/Elastic', () => {
  test('constructor()', () => {
    expect(elastic.log).toMatchObject(log)
  })

  test('init()', () => {
    elastic.init()

    expect(elastic.client).toBeDefined()
  })

  test('getLogins()', () => {
    elastic.client.search = jest.fn(() => Promise.resolve())

    elastic.getLogins().then(c => {
      expect(elastic.client.search).toHaveBeenCalled()
    })
  })

  test('getLogins(): exception', () => {
    elastic.client.search = () => { throw new Error('Test Error') }
    elastic.getLogins()
    expect(elastic.log.error).toHaveBeenCalled()
  })
})
