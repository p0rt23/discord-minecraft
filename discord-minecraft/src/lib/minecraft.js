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
    this.rcon = {}
  }

  init () {
    if (this.logfileEnabled) {
      try {
        this.logfile = new Tail(this.logPath, { force: true })
        this.logfile.start()
        this.logfile.on('line', line => this.handleOnLine(line))
        this.logfile.on('error', err => this.log.error(err))
        this.log.debug(`Minecraft logfile watching enabled: ${this.logPath}`)
      } catch (e) {
        this.log.error(e)
      }
    }

    if (this.rconEnabled) {
      try {
        this.rcon = new Rcon({
          host: this.rconHost,
          port: this.rconPort,
          password: this.rconPassword
        })
        this.rcon.connect()
        this.log.debug(`Minecraft RCON enabled: ${this.rconHost}:${this.rconPort}`)
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  say (message) {
    try {
      this.rcon.send(`say ${message}`)
      this.log.info(`Sent to minecraft server (${this.rconHost}): ${message}`)
    } catch (e) {
      this.log.error(e)
    }
  }

  finish () {
    if (this.logfileEnabled) {
      this.logfile.stop()
    }
    if (this.rconEnabled) {
      this.rcon.end()
    }
  }
}
