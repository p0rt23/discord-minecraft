const DiscordMinecraft = require('../../src/lib/Bot.js')

jest.mock('../../src/lib/Discord.js')
jest.mock('../../src/lib/Elastic.js')
jest.mock('../../src/lib/Minecraft.js')
jest.mock('../../src/lib/Preferences.js')

const config = {
  bot: {
    token: process.env.token,
    minecraftChannel: 712098346805756004,
    logName: 'discord-minecraft'
  },
  elasticSearch: {
    enabled: true,
    url: 'http://elasticsearch:9200'
  },
  minecraft: {
    rconEnabled: true,
    rconHost: 'minecraft',
    rconPort: 25564,
    rconPassword: 'secret',
    logfileEnabled: true,
    logPath: '/minecraft/logs/latest.log'
  },
  preferences: {
    enabled: true,
    path: 'testpath.json'
  }
}

const bot = new DiscordMinecraft(config)
bot.log = {
  info: jest.fn(),
  error: jest.fn()
}

describe('DiscordMinecraft', () => {
  test('constructor()', () => {
    expect(bot.chatEnabled).toBe(config.minecraft.rconEnabled)
    expect(bot.minecraftChannel).toBe(config.bot.minecraftChannel)
    expect(bot.log).toBeDefined()
    expect(bot.discord).toBeDefined()
    expect(bot.elastic).toBeDefined()
    expect(bot.minecraft).toBeDefined()
  })

  test('run()', () => {
    bot.discord.client = { on: jest.fn() }
    bot.minecraft.logfile = { on: jest.fn() }

    bot.run()

    expect(bot.discord.init).toHaveBeenCalled()
    expect(bot.elastic.init).toHaveBeenCalled()
    expect(bot.minecraft.init).toHaveBeenCalled()
    expect(bot.discord.client.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(bot.discord.client.on).toHaveBeenCalledWith('message', expect.any(Function))
    expect(bot.minecraft.logfile.on).toHaveBeenCalledWith('line', expect.any(Function))
  })

  test('formatLogins(): !mc-logins', () => {
    const logins = [{
      _source: {
        '@timestamp': '2020-05-23T01:35:34.264Z',
        message: '[test]: Player1 logged in!'
      }
    }]

    const text = bot.formatLogins(logins, 5)

    expect(text).toBeDefined()
  })

  test('handleOnMessage(): !mc-logins', () => {
    const msg = {
      guild: { id: 123 },
      content: '!mc-logins',
      author: {
        username: 'TestUser'
      }
    }
    bot.elastic.getLogins = jest.fn(() => Promise.resolve([{
      _source: {
        '@timestamp': '2020-05-23T01:35:34.264Z',
        message: '[test]: Player1 logged in!'
      }
    }]))
    jest.spyOn(bot, 'replyLogins')
    bot.formatLogins = jest.fn()
    bot.preferences.loginsEnabled = jest.fn(() => { return true })

    bot.handleOnMessage(msg)

    expect(bot.replyLogins).toHaveBeenCalled()
    expect(bot.elastic.getLogins).toHaveBeenCalled()
    bot.elastic.getLogins.mockClear()
  })

  test('handleOnMessage(): !say', () => {
    const msg = {
      guild: { id: 123 },
      author: { username: 'TestUser1' },
      content: '!say Hi'
    }
    bot.preferences.chatEnabled = jest.fn(() => { return true })
    bot.minecraft.say = jest.fn()

    bot.handleOnMessage(msg)

    expect(bot.minecraft.say).toHaveBeenCalled()
    bot.minecraft.say.mockClear()
  })

  test('handleOnMessage(): Random Text', () => {
    const msg = { content: 'Random Text' }

    bot.handleOnMessage(msg)

    expect(bot.elastic.getLogins).not.toHaveBeenCalled()
    expect(bot.minecraft.say).not.toHaveBeenCalled()
  })

  test('handleOnLine()', () => {
    const line = '[test] [test]: <TestUser1> Testing!'
    bot.discord.client.channels = {
      fetch: jest.fn(() => Promise.resolve('channelName'))
    }

    bot.handleOnLine(line)

    expect(bot.discord.client.channels.fetch).toHaveBeenCalled()
  })
})
