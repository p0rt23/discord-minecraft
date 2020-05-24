const Discord = require('../../src/lib/Discord.js')

jest.mock('discord.js')

const token = 'myToken'
const log = {
  info: jest.fn(),
  error: jest.fn()
}
const discord = new Discord(token, log)

describe('Discord Class', () => {
  test('constructor()', () => {
    expect(discord.log).toBeDefined()
  })

  test('init()', () => {
    discord.init()

    expect(discord.client.login).toHaveBeenCalledWith(token)
  })

  test('reply()', () => {
    const msg = {
      author: { username: 'TestUsername' },
      reply: jest.fn()
    }

    discord.reply(msg, 'Test Reply')

    expect(msg.reply).toHaveBeenCalled()
    expect(discord.log.info).toHaveBeenCalled()
  })

  test('reply(): Exception', () => {
    const msg = {
      reply: () => {
        throw new Error('Test Error')
      }
    }

    discord.reply(msg, 'Test Message')

    expect(discord.log.error).toHaveBeenCalled()
  })
})
