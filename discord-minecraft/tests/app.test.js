const DiscordMinecraft = require('../src/app.js')

jest.mock('discord.js')
jest.mock('@elastic/elasticsearch')
jest.mock('rcon-client')
jest.mock('tail-file')

const bot = new DiscordMinecraft('test-logger', 'elastic-url', 'channel', 'container', 1234, 'password')

describe('DiscordMinecraft', () => {
  test('run()', () => {
    bot.registerEvents = jest.fn()
    bot.run()
    expect(bot.registerEvents).toHaveBeenCalled()
  })

  test('handleOnMessage(): !mc-logins', () => {
    const msg = { content: '!mc-logins' }
    bot.replyLogins = jest.fn()
    bot.handleOnMessage(msg)
    expect(bot.replyLogins).toHaveBeenCalledWith(msg)
  })

  test('handleOnMessage(): Random Text', () => {
    const msg = { content: 'Random Text' }
    bot.replyLogins = jest.fn()
    bot.handleOnMessage(msg)
    expect(bot.replyLogins).not.toHaveBeenCalled()
  })

  test('registerEvents()', () => {
    bot.registerEvents()
    expect(bot.discord.client.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(bot.discord.client.on).toHaveBeenCalledWith('message', expect.any(Function))
  })

  test('handleOnReady()', () => {
    bot.log = {
      info: jest.fn()
    }
    bot.discord.client.user = {
      tag: 'TestUserTag'
    }
    bot.handleOnReady()
    expect(bot.log.info).toHaveBeenCalled()
  })
})
