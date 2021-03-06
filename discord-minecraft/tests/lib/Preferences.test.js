const Preferences = require('../../src/lib/Preferences.js')
const fs = require('fs')

jest.mock('fs')

const config = {
  bot: {
    minecraftChannel: 123,
    adminWhiteList: {
      roles: [
        'ADMINISTRATOR',
        'MANAGE_GUILD',
        'MANAGE_ROLES_OR_PERMISSIONS'
      ],
      users: [
        '191614980552916992', // @Reven
        '5678'
      ]
    }
  },
  elasticSearch: { enabled: true },
  minecraft: {
    rconEnabled: true,
    logfileEnabled: true
  },
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
    expect(pref.botLogfileEnabled).toBe(config.minecraft.logfileEnabled)
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

  test('loginsEnabled(): bot: true, server: true, is: true', () => {
    pref.botLoginsEnabled = true
    pref.prefs = {
      123: { logins: true }
    }

    expect(pref.loginsEnabled(123)).toBe(true)
  })

  test('loginsEnabled(): bot: true, server: false, is: false', () => {
    pref.botLoginsEnabled = true
    pref.prefs = {
      123: { logins: false }
    }

    expect(pref.loginsEnabled(123)).toBe(false)
  })

  test('loginsEnabled(): bot: true, server: undef, is: true', () => {
    pref.botLoginsEnabled = true
    pref.prefs = { }

    expect(pref.loginsEnabled(123)).toBe(true)
  })

  test('loginsEnabled(): bot: true, server: undef2, is: true', () => {
    pref.botLoginsEnabled = true
    pref.prefs = {
      123: {}
    }

    expect(pref.loginsEnabled(123)).toBe(true)
  })

  test('loginsEnabled(): bot: false, server: true, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {
      123: { logins: true }
    }

    expect(pref.loginsEnabled(123)).toBe(false)
  })

  test('loginsEnabled(): bot: false, server: false, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {
      123: { logins: false }
    }

    expect(pref.loginsEnabled(123)).toBe(false)
  })

  test('loginsEnabled(): bot: false, server: undef, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {}

    expect(pref.loginsEnabled(123)).toBe(false)
  })

  test('loginsEnabled(): bot: false, server: undef2, is: false', () => {
    pref.botLoginsEnabled = false
    pref.prefs = {
      123: {}
    }

    expect(pref.loginsEnabled(123)).toBe(false)
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

  test('savePreferences(): set false', () => {
    expect(pref.savePreferences(123, false)).toBe(false)
  })

  test('joinMessages(): set false', () => {
    expect(pref.joinMessages(123, false)).toBe(false)
  })

  test('achievements(): set false', () => {
    expect(pref.achievements(123, false)).toBe(false)
  })

  test('leaveMessages(): set false', () => {
    expect(pref.leaveMessages(123, false)).toBe(false)
  })

  test('channel(): set 567', () => {
    expect(pref.channel(123, '567')).toBe('567')
  })

  test('clearPreferences()', () => {
    pref.channel(123, '567')
    pref.clearPreferences(123)
    expect(pref.channel(123)).not.toBeDefined()
  })

  test('getAdmins()', () => {
    const admins = pref.getAdmins(123)
    expect(admins.indexOf('5678') > -1).toBe(true)
  })

  test('addAdmin()', () => {
    const admins = pref.addAdmin(123, '6789')
    expect(admins.indexOf('6789') > -1).toBe(true)
  })

  test('removeAdmin()', () => {
    const admins = pref.removeAdmin(123, '6789')
    expect(admins.indexOf('6789') === -1).toBe(true)
  })
})
