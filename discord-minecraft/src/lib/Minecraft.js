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
    this.doRcon((rcon) => {
      try {
        rcon.send(`say ${message}`)
        this.log.info(`Sent to minecraft server (${this.rconHost}): ${message}`)
      } catch (err) {
        this.log.error(err)
      }
    })
  }

  doRcon (callback) {
    if (this.rconEnabled) {
      try {
        // Establish a connection for each call.
        // Minecraft server can't shut down with open rcon connection
        this.log.debug(`Connecting to Minecraft RCON: ${this.rconHost}:${this.rconPort}`)
        const rcon = new Rcon({
          host: this.rconHost,
          port: this.rconPort,
          password: this.rconPassword
        })
        callback(rcon)
        this.log.debug(`Disconnecting from Minecraft RCON: ${this.rconHost}:${this.rconPort}`)
        rcon.end()
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  finish () {
    if (this.logfileEnabled) {
      this.logfile.stop()
    }
  }
}
