const Preferences = require('../../src/lib/Preferences.js')
const fs = require('fs')

jest.mock('fs')

const config = {
  bot: { minecraftChannel: 123 },
  elasticSearch: { enabled: true },
  minecraft: { rconEnabled: true },
  preferences: {
    enabled: true,
    path: 'preferences.js'
  }
}
const log = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}

const pref = new Preferences(config, log)

describe('lib/Preferences.js', () => {
  test('constructor()', () => {
    expect(pref.botLoginsEnabled).toBe(config.elasticSearch.enabled)
    expect(pref.botChatEnabled).toBe(config.minecraft.rconEnabled)
    expect(pref.botPrefsEnabled).toBe(config.preferences.enabled)
    expect(pref.defaultMinecraftChannel).toBe(config.bot.minecraftChannel)
    expect(pref.prefsPath).toBe(config.preferences.path)
    expect(pref.log).toBe(log)
    expect(pref.prefs).toBeDefined()
  })

  test('init()', () => {
    jest.spyOn(pref, 'loadPrefs')

    pref.init()

    expect(pref.loadPrefs).toHaveBeenCalled()
  })

  test('setPref(): undef', () => {
    pref.prefs = {}

    pref.setPref(123, 'logins', true)

    expect(pref.prefs[123].logins).toBe(true)
  })

  test('setPref(): undef2', () => {
    pref.prefs = { 123: {} }

    pref.setPref(123, 'logins', true)

    expect(pref.prefs[123].logins).toBe(true)
  })

  test('setPref(): false to true', () => {
    pref.prefs = { 123: { logins: false } }

    pref.setPref(123, 'logins', true)

    expect(pref.prefs[123].logins).toBe(true)
  })

  test('getPref(): undef', () => {
    pref.prefs = {}

    expect(pref.getPref(123, 'logins')).toBe(true)
  })

  test('getPref(): undef2', () => {
    pref.prefs = { 123: {} }

    expect(pref.getPref(123, 'logins')).toBe(true)
  })

  test('getPref(): false', () => {
    pref.prefs = { 123: { logins: false } }

    expect(pref.getPref(123, 'logins')).toBe(false)
  })

  test('savePrefs()', () => {
    pref.prefs = { 123: { logins: false } }

    pref.savePrefs()

    expect(fs.writeFile).toHaveBeenCalled()
  })

  test('loadPrefs()', () => {
    pref.loadPrefs()

    expect(fs.access).toHaveBeenCalled()
  })

  test('preference(): bot: true, server: true, is: true', () => {
    pref.botLoginsEnabled = true
    pref.prefs = {
      123: { logins: true }
    }

    expect(pref.preference(123, 'logins')).toBe(true)
  })

  test('preference(): bot: true, server: false, is: false', () => {
    pref.botLoginsEnabled = true
    pref.prefs = {
      123: { logins: false }
    }

    expect(pref.preference(123, 'logins')).toBe(false)
  })

  test('preference(): bot: true, server: undef, is: true', () => {
    pref.botLoginsEnabled = true
    pref.prefs = { }

    expect(pref.preference(123, 'logins')).toBe(true)
  })

  test('preference(): bot: true, server: undef2, is: true', () => {
    pref.botLoginsEnabled = true
    pref.prefs = {
      123: {}
    }

    expect(pref.preference(123, 'logins')).toBe(true)
  })

  test('preference(): bot: false, server: true, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {
      123: { logins: true }
    }

    expect(pref.preference(123, 'logins')).toBe(false)
  })

  test('preference(): bot: false, server: false, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {
      123: { logins: false }
    }

    expect(pref.preference(123, 'logins')).toBe(false)
  })

  test('preference(): bot: false, server: undef, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {}

    expect(pref.preference(123, 'logins')).toBe(false)
  })

  test('preference(): bot: false, server: undef2, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {
      123: {}
    }

    expect(pref.preference(123, 'logins')).toBe(false)
  })

  test('preference(): set true', () => {
    jest.spyOn(pref, 'savePrefs')
    pref.botLoginsEnabled = true
    pref.prefs = {}

    pref.preference(123, 'logins', true)

    expect(pref.preference(123, 'logins')).toBe(true)
    expect(pref.savePrefs).toHaveBeenCalled()
  })

  test('preference(): set false', () => {
    pref.preference(123, 'logins', false)

    expect(pref.preference(123, 'logins')).toBe(false)
  })

  test('loginsEnabled(): set false', () => {
    expect(pref.loginsEnabled(123, false)).toBe(false)
  })

  test('chatEnabled(): set false', () => {
    expect(pref.chatEnabled(123, false)).toBe(false)
  })
})
