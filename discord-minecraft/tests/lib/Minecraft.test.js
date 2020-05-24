jest.mock('rcon-client')
jest.mock('tail-file')

const Minecraft = require('../../src/lib/Minecraft.js')

const log = {
  info: jest.fn(),
  error: jest.fn()
}

const config = {
  rconEnabled: true,
  rconHost: 'minecraft',
  rconPort: 25564,
  rconPassword: 'secret',
  logfileEnabled: true,
  logPath: '/minecraft/logs/latest.log'
}

const minecraft = new Minecraft(config, log)

describe('Minecraft Class', () => {
  test('constructor()', () => {
    expect(minecraft.rconEnabled).toBe(config.rconEnabled)
    expect(minecraft.rconHost).toBe(config.rconHost)
    expect(minecraft.rconPort).toBe(config.rconPort)
    expect(minecraft.rconPassword).toBe(config.rconPassword)
    expect(minecraft.logfileEnabled).toBe(config.logfileEnabled)
    expect(minecraft.logPath).toBe(config.logPath)
    expect(minecraft.log).toBe(log)
  })

  test('init()', () => {
    minecraft.init()
    expect(minecraft.logfile.start).toHaveBeenCalled()
  })

  test('say()', () => {
    jest.spyOn(minecraft, 'doRcon')

    minecraft.say('test')

    expect(minecraft.doRcon).toHaveBeenCalled()
  })
})
