'use strict'

const fs = require('fs')

module.exports = class Preferences {
  constructor (config, log) {
    this.botLoginsEnabled = config.elasticSearch.enabled
    this.botChatEnabled = config.minecraft.rconEnabled
    this.botPrefsEnabled = config.preferences.enabled
    this.botLogfileEnabled = config.minecraft.logfileEnabled
    this.prefsPath = config.preferences.path
    this.adminWhiteListUsers = config.bot.adminWhiteList.users
    this.log = log
    this.prefs = {}
  }

  init () {
    if (this.botPrefsEnabled) {
      this.log.info('Preferences Enabled')
      this.loadPrefs()
    }
  }

  getGuilds () {
    return Object.keys(this.prefs)
  }

  loginsEnabled (guildId, isEnabled) {
    return this.botLoginsEnabled && this.preference(guildId, 'logins', isEnabled)
  }

  chatEnabled (guildId, isEnabled) {
    return this.botChatEnabled && this.preference(guildId, 'chat', isEnabled)
  }

  savePreferences (guildId, isEnabled) {
    return this.preference(guildId, 'savePreferences', isEnabled)
  }

  joinMessages (guildId, isEnabled) {
    return this.botLogfileEnabled && this.preference(guildId, 'joinMessages', isEnabled)
  }

  achievements (guildId, isEnabled) {
    return this.botLogfileEnabled && this.preference(guildId, 'achievements', isEnabled)
  }

  leaveMessages (guildId, isEnabled) {
    return this.botLogfileEnabled && this.preference(guildId, 'leaveMessages', isEnabled)
  }

  channel (guildId, channelId) {
    if (channelId !== undefined) {
      return this.preference(guildId, 'channel', channelId)
    } else {
      // preference() returns true if undefined as default value
      return this.preference(guildId, 'channel') === true
        ? undefined : this.preference(guildId, 'channel')
    }
  }

  getAdmins (guildId) {
    // preference() returns true if undefined as default value
    let admins = this.preference(guildId, 'admins')
    if (admins === true) {
      admins = []
    }
    return this.adminWhiteListUsers.length > 0
      ? admins.concat(this.adminWhiteListUsers) : admins
  }

  addAdmin (guildId, userId) {
    if (userId !== undefined) {
      let admins = this.preference(guildId, 'admins')
      // preference() returns true if undefined as default value
      if (admins === true) {
        admins = []
      }
      admins.push(userId)
      return this.preference(guildId, 'admins', admins)
    }
  }

  removeAdmin (guildId, userId) {
    if (userId !== undefined) {
      const admins = this.preference(guildId, 'admins')
      // preference() returns true if undefined as default value
      if (admins === true) {
        return
      }
      const newAdmins = []
      admins.forEach(id => {
        if (id !== userId) {
          newAdmins.push(id)
        }
      })
      return this.preference(guildId, 'admins', newAdmins)
    }
  }

  clearPreferences (guildId) {
    if (guildId !== undefined) {
      this.log.debug(`Clearing preferences for ${guildId}`)
      this.prefs[guildId] = {}
      if (this.savePreferences(guildId)) {
        this.savePrefs()
      }
    }
  }

  preference (id, pref, val) {
    if (this.botPrefsEnabled && (val !== undefined)) {
      this.setPref(id, pref, val)
      if (this.savePreferences(id)) {
        this.savePrefs()
      }
    }
    return this.getPref(id, pref)
  }

  setPref (id, pref, val) {
    if (this.prefs[id] === undefined) {
      this.prefs[id] = {}
    }
    this.prefs[id][pref] = val
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
