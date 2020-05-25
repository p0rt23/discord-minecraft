const Bot = require('../../src/lib/Bot.js')

jest.mock('../../src/lib/Discord.js')
jest.mock('../../src/lib/Elastic.js')
jest.mock('../../src/lib/Minecraft.js')
jest.mock('../../src/lib/Preferences.js')

const config = {
  bot: {
    token: process.env.token,
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

function getMsg (...mentions) {
  const msg = {
    guild: { id: 123 },
    content: '',
    author: { username: 'TestUser' },
    channel: { id: '567' },
    mentions: {
      users: { first: () => undefined },
      channels: { first: () => undefined }
    }
  }

  mentions.map(mention => {
    if (mention.match(/^@/)) {
      const parts = mention.split('@')
      msg.mentions.users.first = () => {
        return { username: parts[1] }
      }
    }
    if (mention.match(/^#/)) {
      const parts = mention.split('#')
      msg.mentions.channels.first = () => {
        return { name: parts[1] }
      }
    }
  })

  return msg
}

const bot = new Bot(config)
bot.log = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}
bot.preferences.channel = jest.fn(() => { return '567' })
bot.preferences.botPrefsEnabled = true
bot.discord.client = {
  user: { username: 'BlockyBot' },
  on: jest.fn(),
  channels: { fetch: jest.fn(() => Promise.resolve('channelName')) }
}

describe('lib/Bot.js', () => {
  test('constructor()', () => {
    expect(bot.chatEnabled).toBe(config.minecraft.rconEnabled)
    expect(bot.log).toBeDefined()
    expect(bot.discord).toBeDefined()
    expect(bot.elastic).toBeDefined()
    expect(bot.minecraft).toBeDefined()
  })

  test('run()', () => {
    bot.minecraft.logfile = { on: jest.fn() }

    bot.run()

    expect(bot.discord.init).toHaveBeenCalled()
    expect(bot.elastic.init).toHaveBeenCalled()
    expect(bot.minecraft.init).toHaveBeenCalled()
    expect(bot.discord.client.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(bot.discord.client.on).toHaveBeenCalledWith('message', expect.any(Function))
    expect(bot.minecraft.logfile.on).toHaveBeenCalledWith('line', expect.any(Function))
  })

  test('formatLogins(): !logins', () => {
    const logins = [{
      _source: {
        '@timestamp': '2020-05-23T01:35:34.264Z',
        message: '[test]: Player1 logged in!'
      }
    }]

    const text = bot.formatLogins(logins, 5)

    expect(text).toBeDefined()
  })

  test('isAtMe(): true', () => {
    const msg = getMsg('@BlockyBot')
    msg.content = '@BlockyBot, how are you?'

    expect(bot.isAtMe(msg)).toBe(true)
  })

  test('isAtMe(): false', () => {
    const msg = getMsg('@reven')
    msg.content = '@reven, how are you?'

    expect(bot.isAtMe(msg)).toBe(false)
  })

  test('toggleSavePreferences()', () => {
    const msg = getMsg('@reven')
    msg.content = '@BlockyBot !savePreferences false'

    bot.toggleSavePreferences(msg)
    expect(bot.preferences.savePreferences).toHaveBeenCalledWith(msg.guild.id, false)

    msg.content = '@BlockyBot !savePreferences true'
    bot.toggleSavePreferences(msg)
    expect(bot.preferences.savePreferences).toHaveBeenCalledWith(msg.guild.id, true)
  })

  test('formatStatus():', () => {
    bot.preferences.prefs = {
      123: {
        savePreferences: false,
        chat: false
      }
    }

    expect(bot.formatStatus('123')).toBeDefined()
  })

  test('showStatus():', () => {
    const msg = getMsg('@BlockyBot')
    msg.content = '!showStatus'

    bot.showStatus(msg)

    expect(bot.discord.reply).toHaveBeenCalled()
  })

  test('clearPreferences():', () => {
    const msg = getMsg('@BlockyBot')
    msg.content = '@BlockyBot !clearPreferences'

    bot.clearPreferences(msg)

    expect(bot.preferences.clearPreferences).toHaveBeenCalled()
  })

  test('handleOnLine()', () => {
    const line = '[test] [test]: <TestUser1> Testing!'
    bot.handleOnLine(line)

    expect(bot.discord.client.channels.fetch).toHaveBeenCalled()
  })

  test('handleOnMessage(): !logins', () => {
    const msg = getMsg()
    msg.content = '!logins'
    bot.elastic.getLogins = jest.fn(() => Promise.resolve([{
      _source: {
        '@timestamp': '2020-05-23T01:35:34.264Z',
        message: '[test]: Player1 logged in!'
      }
    }]))
    bot.formatLogins = jest.fn()
    bot.preferences.loginsEnabled = jest.fn(() => { return true })
    jest.spyOn(bot, 'replyLogins')

    bot.handleOnMessage(msg)

    expect(bot.replyLogins).toHaveBeenCalled()
    expect(bot.elastic.getLogins).toHaveBeenCalled()
    bot.elastic.getLogins.mockClear()
  })

  test('handleOnMessage(): !say', () => {
    const msg = getMsg()
    msg.content = '!say Hi'
    bot.preferences.chatEnabled = jest.fn(() => { return true })
    bot.minecraft.say = jest.fn()

    bot.handleOnMessage(msg)

    expect(bot.minecraft.say).toHaveBeenCalled()
    bot.minecraft.say.mockClear()
  })

  test('handleOnMessage(): Random Text', () => {
    const msg = getMsg()
    msg.content = 'Random Text'

    bot.handleOnMessage(msg)

    expect(bot.elastic.getLogins).not.toHaveBeenCalled()
    expect(bot.minecraft.say).not.toHaveBeenCalled()
  })

  test('handleOnMessage(): !savePreferences', () => {
    const msg = getMsg('@BlockyBot')
    msg.content = '@BlockyBot !savePreferences false'
    jest.spyOn(bot, 'toggleSavePreferences')

    bot.handleOnMessage(msg)

    expect(bot.toggleSavePreferences).toHaveBeenCalled()
  })

  test('handleOnMessage(): !showStatus', () => {
    const msg = getMsg('@BlockyBot')
    msg.content = '@BlockyBot !status'

    jest.spyOn(bot, 'showStatus')

    bot.handleOnMessage(msg)

    expect(bot.showStatus).toHaveBeenCalled()
  })

  test('handleOnMessage(): !channel', () => {
    const msg = getMsg('@BlockyBot', '#minecraft')
    msg.content = '@BlockyBot !channel #minecraft'
    jest.spyOn(bot, 'setChannel')

    bot.handleOnMessage(msg)

    expect(bot.setChannel).toHaveBeenCalled()
  })

  test('handleOnMessage(): !clearPreferences', () => {
    const msg = getMsg('@BlockyBot')
    msg.content = '@BlockyBot !clearPreferences'
    jest.spyOn(bot, 'clearPreferences')

    bot.handleOnMessage(msg)

    expect(bot.clearPreferences).toHaveBeenCalled()
  })
})
