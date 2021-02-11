'use strict'

function Commander (client) {
  this.isActive = false
  this.query = ''
  this.cmdHistory = []
  this.cmdHistoryIndex = 0
  this.findHistory = []
  this.findHistoryIndex = 0

  // Library

  this.passives = {
    '/': (p) => { client.cursor.find(p.str) },
    find: (p) => { client.cursor.find(p.str) },
    select: (p) => { client.cursor.select(p.x, p.y, p.w || 0, p.h || 0) },
    inject: (p) => {
      client.cursor.select(p._x, p._y)
      if (client.source.cache[p._str + '.orca']) {
        const block = client.source.cache[p._str + '.orca']
        const rect = client.orca.toRect(block)
        client.cursor.scaleTo(rect.x, rect.y)
        client.history.record(client.orca.s)
      }
    }
  }

  this.actives = {
    // Ports
    osc: (p) => { client.io.osc.select(p.int) },
    udp: (p) => {
      client.io.udp.selectOutput(p.x)
      if (p.y !== null) { client.io.udp.selectInput(p.y) }
    },
    midi: (p) => {
      client.io.midi.selectOutput(p.x)
      if (p.y !== null) { client.io.midi.selectInput(p.y) }
    },
    ip: (p) => { client.io.setIp(p.str) },
    cc: (p) => { client.io.cc.setOffset(p.int) },
    pg: (p) => { client.io.cc.stack.push({ channel: clamp(p.ints[0], 0, 15), bank: p.ints[1], sub: p.ints[2], pgm: clamp(p.ints[3], 0, 127), type: 'pg' }); client.io.cc.run() },
    // Cursor
    copy: (p) => { client.cursor.copy() },
    paste: (p) => { client.cursor.paste(true) },
    erase: (p) => { client.cursor.erase() },
    // Controls
    play: (p) => { client.clock.play() },
    stop: (p) => { client.clock.stop() },
    run: (p) => { client.run() },
    // Time
    apm: (p) => { client.clock.setSpeed(null, p.int) },
    bpm: (p) => { client.clock.setSpeed(p.int, p.int, true) },
    frame: (p) => { client.clock.setFrame(p.int) },
    rewind: (p) => { client.clock.setFrame(client.orca.f - p.int) },
    skip: (p) => { client.clock.setFrame(client.orca.f + p.int) },
    time: (p, origin) => {
      const formatted = new Date(250 * (client.orca.f * (60 / client.clock.speed.value))).toISOString().substr(14, 5).replace(/:/g, '')
      client.orca.writeBlock(origin ? origin.x : client.cursor.x, origin ? origin.y : client.cursor.y, `${formatted}`)
    },
    // Themeing
    color: (p) => {
      if (p.parts[0]) { client.theme.set('b_low', p.parts[0]) }
      if (p.parts[1]) { client.theme.set('b_med', p.parts[1]) }
      if (p.parts[2]) { client.theme.set('b_high', p.parts[2]) }
    },
    colo: (p) => this.actives['color'](p),
    // Edit
    '/': (p) => { client.cursor.find(p.str) },
    find: (p) => { client.cursor.find(p.str) },
    select: (p) => { client.cursor.select(p.x, p.y, p.w || 0, p.h || 0) },
    inject: (p, origin) => {
      const block = client.source.cache[p._str + '.orca']
      if (!block) { console.warn('Commander', 'Unknown block: ' + p._str); return }
      client.orca.writeBlock(origin ? origin.x : client.cursor.x, origin ? origin.y : client.cursor.y, block)
      client.cursor.scaleTo(0, 0)
      client.history.record(client.orca.s)
    },
    write: (p) => {
      client.orca.writeBlock(p._x || client.cursor.x, p._y || client.cursor.y, p._str)
    }
  }

  // Make shorthands
  for (const id in this.actives) {
    this.actives[id.substr(0, 2)] = this.actives[id]
  }

  function Param (val) {
    this.str = `${val}`
    this.length = this.str.length
    this.chars = this.str.split('')
    this.int = !isNaN(val) ? parseInt(val) : null
    this.parts = val.split(';')
    this.ints = this.parts.map((val) => { return parseInt(val) })
    this.x = parseInt(this.parts[0])
    this.y = parseInt(this.parts[1])
    this.w = parseInt(this.parts[2])
    this.h = parseInt(this.parts[3])
    // Optionals Position Style
    this._str = this.parts[0]
    this._x = parseInt(this.parts[1])
    this._y = parseInt(this.parts[2])
  }

  // Begin

  this.start = (q = '') => {
    this.isActive = true
    this.query = q
    client.cursor.ins = false
    client.update()
  }

  this.stop = () => {
    if (this.query.startsWith('/')) {
      this.findHistoryIndex = this.findHistory.length
    } else {
      this.cmdHistoryIndex = this.cmdHistory.length
    }

    this.isActive = false
    this.query = ''
    client.update()
  }

  this.erase = function () {
    this.query = this.query.slice(0, -1)
    this.preview()
  }

  this.write = (key) => {
    if (key === 'Backspace') { this.erase(); return }
    if (key === 'Enter') { this.run(); return }
    if (key === 'Escape') { this.stop(); return }
    if (key.length > 1) { return }
    this.query += key
    this.preview()
  }

  this.run = () => {
    const tool = this.isActive === true ? 'commander' : 'cursor'
    client[tool].trigger()
    client.update()
  }

  this.trigger = (msg = this.query, origin = null, stopping = true) => {
    let cmd = ''
    let val = ''
    this.recordHistory(msg)

    if (msg.startsWith('/')) {
      cmd = '/'
      val = msg.slice(1)
    } else {
      const split = msg.split(' ')
      cmd = split[0].trim().toLowerCase()
      val = msg.substring(cmd.length + 1)
      if (cmd.startsWith(':')) cmd = cmd.slice(1)
    }

    const fn = this.actives[cmd]
    if (!fn) { console.warn('Commander', `Unknown message: ${msg}`); this.stop(); return }
    fn(new Param(val), origin)
    if (stopping) {
      this.stop()
    }
  }

  this.preview = function (msg = this.query) {
    let cmd = ''
    let val = ''

    if (msg.startsWith('/')) {
      cmd = '/'
      val = msg.slice(1)
    } else {
      const split = msg.split(' ')
      cmd = split[0].trim().toLowerCase()
      val = msg.substring(cmd.length + 1)
      if (cmd.startsWith(':')) cmd = cmd.slice(1)
    }

    if (!this.passives[cmd]) { return }
    this.passives[cmd](new Param(val), false)
  }

  this.recordHistory = (msg, limit=30) => {
    if (msg.startsWith('/')) {
      this.findHistory.push(msg)
      if (this.findHistory.length > limit) this.findHistory.shift()
      this.findHistoryIndex = this.findHistory.length
    } else {
      this.cmdHistory.push(msg)
      if (this.cmdHistory.length > limit) this.cmdHistory.shift()
      this.cmdHistoryIndex = this.cmdHistory.length
    }
  }

  // Events

  this.onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) { return }
    client[this.isActive === true ? 'commander' : 'cursor'].write(e.key)
    e.stopPropagation()
  }

  this.onKeyUp = (e) => {
    client.update()
  }

  // UI

  this.toString = function () {
    return `${this.query}`
  }

  // Utils

  function clamp (v, min, max) { return v < min ? min : v > max ? max : v }
}
