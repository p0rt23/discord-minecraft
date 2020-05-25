'use strict'

const { Rcon } = require('rcon-client')
const Tail = require('tail-file')

module.exports = class Minecraft {
  constructor (config, log) {
    this.rconEnabled = config.rconEnabled
    this.rconHost = config.rconHost
    this.rconPort = config.rconPort
    this.rconPassword = config.rconPassword
    this.logfileEnabled = config.logfileEnabled
    this.logPath = config.logPath
    this.log = log
    this.logfile = {}
  }

  init () {
    if (this.logfileEnabled) {
      try {
        this.logfile = new Tail(this.logPath, { force: true })
        this.logfile.start()
        this.logfile.on('error', err => this.log.error(err))
        this.log.info(`Minecraft logfile watching enabled: ${this.logPath}`)
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  say (message) {
    if (this.rconEnabled) {
      this.doRcon(async (rcon) => {
        try {
          await rcon.send(`say ${message}`)
          this.log.info(`Sent to minecraft server (${this.rconHost}): ${message}`)
        } catch (e) {
          this.log.error(e)
        }
      }).catch((e) => this.log.error(e))
    }
  }

  doRcon (callback) {
    return doRcon(this, callback)

    async function doRcon (self) {
      try {
        self.log.debug(`Connecting to Minecraft RCON: ${self.rconHost}:${self.rconPort}`)
        const rcon = new Rcon({ host: self.rconHost, port: self.rconPort, password: self.rconPassword })
        await rcon.connect()

        await callback(rcon)

        self.log.debug(`Disconnecting from Minecraft RCON: ${self.rconHost}:${self.rconPort}`)
        rcon.end()
      } catch (err) {
        self.log.error(err)
      }
    }
  }

  finish () {
    if (this.logfileEnabled) {
      this.logfile.stop()
    }
  }
}
