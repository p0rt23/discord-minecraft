const Elastic = require('../../src/lib/elastic.js')

jest.mock('@elastic/elasticsearch')

const url = 'http://test-elastic-instance'
const log = {
  info: jest.fn(),
  error: jest.fn()
}
const elastic = new Elastic(url, log)

describe('lib/Elastic', () => {
  test('constructor()', () => {
    expect(elastic.log).toMatchObject(log)
    expect(elastic.client).toBeDefined()
  })

  test('getLogins()', () => {
    elastic.client.search = jest.fn(() => {
      return new Promise((resolve, reject) => {
        resolve({ body: { hits: { total: { value: 5 } } } })
      })
    })
    // elastic.getLogins()
    // expect(elastic.client.search).toHaveBeenCalled()
    expect(elastic.getLogins()).resolves.toMatch(/5/)
  })

  test('getLogins(): exception', () => {
    elastic.client.search = () => { throw new Error('Test Error') }
    elastic.getLogins()
    expect(elastic.log.error).toHaveBeenCalled()
  })
})
