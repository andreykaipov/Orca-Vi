'use strict'

function History (client) {
  this.index = 0
  this.frames = [] // {board:"...", cursor:{x:1, y:2}}
  this.host = null
  this.key = null

  this.bind = function (host, key) {
    console.log('History is recording..')
    this.host = host
    this.key = key
    this.reset()
  }

  this.reset = function () {
    this.index = 0
    this.frames = []
  }

  this.record = function (data) {
    if (this.index === this.frames.length) {
      this.append(data)
    } else {
      this.fork(data)
    }
    this.trim()
    this.index = this.frames.length
  }

  this.undo = function () {
    if (this.index === 0) { console.warn('History', 'Reached beginning'); return }
    this.index = clamp(this.index - 1, 0, this.frames.length - 2)

    const frame = this.frames[this.index]
    this.apply(frame.board)
    client.cursor.moveTo(frame.cursor.x, frame.cursor.y)
  }

  this.redo = function () {
    if (this.index + 1 > this.frames.length - 1) { console.warn('History', 'Reached end'); return }
    this.index = clamp(this.index + 1, 0, this.frames.length - 1)

    const frame = this.frames[this.index]
    this.apply(frame.board)
    client.cursor.moveTo(frame.cursor.x, frame.cursor.y)
  }

  this.apply = function (f) {
    if (!this.host[this.key]) { console.log(`Unknown binding to key ${this.key}`); return }
    if (!f || f.length !== this.host[this.key].length) { return }
    this.host[this.key] = this.frames[this.index].board
  }

  this.append = function (data) {
    if (!data) { return }

    const {x,y} = client.cursor
    const cursor = {x,y}

    if (
      this.frames[this.index-1] &&
      this.frames[this.index-1].board === data &&
      this.frames[this.index-1].cursor.x == x &&
      this.frames[this.index-1].cursor.y == y
    ) { return }

    this.frames.push({board: data, cursor: cursor})
  }

  this.fork = function (data) {
    this.frames = this.frames.slice(0, this.index + 1)
    this.append(data)
  }

  this.trim = function (limit = 30) {
    if (this.frames.length < limit) { return }
    this.frames.shift()
  }

  this.last = function () {
    return this.frames[this.index - 1]
  }

  this.length = function () {
    return this.frames.length
  }

  function clamp (v, min, max) { return v < min ? min : v > max ? max : v }
}
