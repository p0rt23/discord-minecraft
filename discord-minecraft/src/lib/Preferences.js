'use strict'

const fs = require('fs')

module.exports = class Preferences {
  constructor (config, log) {
    this.botLoginsEnabled = config.elasticSearch.enabled
    this.botChatEnabled = config.minecraft.rconEnabled
    this.botPrefsEnabled = config.preferences.enabled
    this.defaultMinecraftChannel = config.bot.minecraftChannel
    this.prefsPath = config.preferences.path
    this.log = log
    this.prefs = {}
  }

  init () {
    if (this.botPrefsEnabled) {
      this.log.info('Preferences Enabled')
      this.loadPrefs()
    }
  }

  loginsEnabled (guildId, isEnabled) {
    return this.preference(guildId, 'logins', isEnabled)
  }

  chatEnabled (guildId, isEnabled) {
    return this.preference(guildId, 'chat', isEnabled)
  }

  preference (id, pref, bool) {
    if (this.botPrefsEnabled && (bool !== undefined)) {
      this.setPref(id, pref, bool)
      this.savePrefs()
    }
    return this.botLoginsEnabled && this.getPref(id, pref)
  }

  setPref (id, pref, bool) {
    if (this.prefs[id] === undefined) {
      this.prefs[id] = {}
    }
    this.prefs[id][pref] = bool
  }

  getPref (id, pref) {
    if ((this.prefs[id] !== undefined) && (this.prefs[id][pref] !== undefined)) {
      return this.prefs[id][pref]
    } else {
      return true
    }
  }

  savePrefs () {
    this.log.debug(`Writing preferences to: ${this.prefsPath}`)
    let json = {}
    try {
      json = JSON.stringify(this.prefs)
    } catch (err) {
      this.log.error(err)
    }
    fs.writeFile(this.prefsPath, json, (err) => {
      if (err) {
        this.log.error(err)
      }
    })
  }

  loadPrefs () {
    this.log.debug(`Reading preferences from: ${this.prefsPath}`)
    fs.access(this.prefsPath, fs.F_OK, (err) => {
      if (err) {
        this.log.debug(`${this.prefsPath} doesn't exist.`)
        this.prefs = {}
        return
      }
      fs.readFile(this.prefsPath, (err, data) => {
        if (err) {
          this.log.error(err)
          return
        }
        try {
          this.prefs = JSON.parse(data)
        } catch (err) {
          this.log.error(err)
        }
      })
    })
  }
}
