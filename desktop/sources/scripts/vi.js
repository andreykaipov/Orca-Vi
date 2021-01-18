'use strict'

    // 
    // console.log(`Vi mode is now ${this.mode}`)
    // console.log(client.acels.pipe)

/**
 * Implements a small subset of Vi.
 *
 *
 * todo ~
 *
 * https://github.com/hundredrabbits/Orca/pull/112
 */
function Vi (client) {
  this.mode = null
  this.chordPrefix = ''
  this.originalCommanderKeyDownHandler = client.commander.onKeyDown
  this.originalCommanderKeyUpHandler = client.commander.onKeyUp

  this.inspectMode = () => this.mode ? `-- ${this.mode} --` : ""
  this.inspectChord = () => this.mode /*&& this.chordPrefix != 1*/ ? `${this.chordPrefix}` : ""

  this.toggle = () => {
    if (this.mode == null) {
      client.history.record(client.orca.s)
      this.switchTo("NORMAL")
    } else {
      this.mode = null
      this.resetAcels()
      client.install()
      client.commander.onKeyDown = this.originalCommanderKeyDownHandler
      client.commander.onKeyUp = this.originalCommanderKeyUpHandler
    }
  }

  this.resetChord = () => this.chordPrefix = ''
  this.resetAcels = () => {
    client.acels.unset(
      /* common      */ 'Escape',
      /* normal mode */ 'I', 'Shift+I', 'O', 'Shift+O', 'A', 'Shift+A',
                        'X', 'D',
                        'H', 'J', 'K', 'L', 'Alt+H', 'Alt+J', 'Alt+K', 'Alt+L', '0', 'Shift+$',
                        'W', 'E', 'B', 'G', 'Shift+G',
                        'P', 'R',
                        'U', 'Ctrl+R',
                        'Ctrl+V', 'Shift+V',
                        '1', '2', '3', '4', '5', '6', '7', '8', '9',
      /* insert mode */ 'Space', 'Delete', 'Enter',
      /* visual mode */ 'Shift+H', 'Shift+J', 'Shift+K', 'Shift+L', 'Y',
    )

    // We overwrite these so they don't work in any mode
    // Easily reverted by a client.install()
    client.acels.set('Cursor', 'Toggle Insert Mode', 'CmdOrCtrl+I', () => {})
    client.acels.set('Edit', 'Erase Selection', 'Backspace', () => {})
    client.acels.set('Edit', 'Undo', 'CmdOrCtrl+Z', () => {})
    client.acels.set('Edit', 'Redo', 'CmdOrCtrl+Shift+Z', () => {})
    client.acels.set('Edit', 'Paste', 'CmdOrCtrl+V', () => {})
  }

  this.switchTo = (mode) => {
    this.resetAcels()
    this.resetChord()
    client.cursor.reset()

    switch (mode) {
      case "NORMAL": this.normalMode(); break
      case "INSERT": this.insertMode(); break
      case "VISUAL BLOCK": this.visualBlockMode(); break
      case "VISUAL LINE": this.visualLineMode(); break
      case "COMMAND": this.commandMode(); break
    }

    this.mode = mode
  }

  this.normalMode = () => {

    // into insert mode
    client.acels.set('Vi', 'Insert',               'I',       () => { this.switchTo("INSERT") })
    client.acels.set('Vi', 'Insert Start Line',    'Shift+I', () => { client.cursor.moveTo(0, client.cursor.y); this.switchTo("INSERT") })
    client.acels.set('Vi', 'Insert Next Line',     'O',       () => {
      const line = this.lineLeftOfCursor().split('').reverse().slice(1)
      if (line[0] === '.' || line[1] !== '.') this.jumpWordBack()
      const {x,y} = client.cursor
      client.cursor.selectNoUpdate(0, client.cursor.y+1, client.orca.w, client.orca.h-client.cursor.y-1)
      client.cursor.drag(0, -1, false)
      client.cursor.moveTo(x, y+1)
      client.history.record(client.orca.s)
      this.switchTo("INSERT")
    })
    client.acels.set('Vi', 'Insert Previous Line', 'Shift+O', () => {
      const line = this.lineLeftOfCursor().split('').reverse().slice(1)
      if (line[0] === '.' || line[1] !== '.') this.jumpWordBack()
      const {x,y} = client.cursor
      client.cursor.selectNoUpdate(0, client.cursor.y, client.orca.w, client.orca.h-client.cursor.y-1)
      client.cursor.drag(0, -1, false)
      client.cursor.moveTo(x, y)
      client.history.record(client.orca.s)
      this.switchTo("INSERT")
    })
    client.acels.set('Vi', 'Append',               'A',       () => { client.cursor.move(1, 0); this.switchTo("INSERT") })
    client.acels.set('Vi', 'Append End Line',      'Shift+A', () => {
      // modified Shift+A fit for Orca
      const lastWordIndex = client.orca.w-this.lineRightOfCursor().split('').reverse().slice(1).findIndex(x => x !== '.')
      console.log(this.lineRightOfCursor().split('').reverse().findIndex(x => x !== '.'))
      client.cursor.moveTo(lastWordIndex, client.cursor.y)
      this.switchTo("INSERT")
    })

    // into visual modes; normal visual mode doesn't make sense because Orca selections can't wrap lines
    client.acels.set('Vi', 'Visual Block', 'CmdOrCtrl+V',  () => { this.switchTo("VISUAL BLOCK") })
    client.acels.set('Vi', 'Visual Line',  'Shift+V', () => { this.switchTo("VISUAL LINE") })

    // deletions
    client.acels.set('Vi', 'Erase', 'X', () => {
      client.orca.writeBlock(client.cursor.x, client.cursor.y, this.lineRightOfCursor().substring(1))
      client.history.record(client.orca.s)
    })
    client.acels.set('Vi', 'Delete', 'D', () => {
      if (this.chordPrefix.endsWith('d')) {
        const prefix = this.chordPrefix.slice(0, -1)*1 || 1
        if (!isNaN(prefix)) {
          const {x,y} = client.cursor
          client.cursor.selectNoUpdate(0, y, client.orca.w, prefix-1)
          client.cursor.copy()
          client.cursor.selectNoUpdate(0, y+prefix, client.orca.w, client.orca.h-y-prefix-1)
          client.cursor.drag(0, prefix)
          client.cursor.selectNoUpdate(x, y, 0, 0)
          client.history.record(client.orca.s)
        } else {
          console.error(`Huh? ${prefix}`)
        }
        this.resetChord()
      } else {
        this.chordPrefix += 'd'
      }
    })

    // simple movements
    client.acels.set('Vi', 'Move West', 'H', () => { client.cursor.move(-1*(this.chordPrefix||1), 0); this.resetChord() })
    client.acels.set('Vi', 'Move South', 'J', () => { client.cursor.move(0, -1*(this.chordPrefix||1)); this.resetChord() })
    client.acels.set('Vi', 'Move North', 'K', () => { client.cursor.move(0, 1*(this.chordPrefix||1)); this.resetChord() })
    client.acels.set('Vi', 'Move East', 'L', () => { client.cursor.move(1*(this.chordPrefix||1), 0); this.resetChord() })

    // just some extra stuff
    client.acels.set('Vi', 'Move West(Leap)', 'Alt+H', () => { client.cursor.move(-client.grid.w, 0) })
    client.acels.set('Vi', 'Move South(Leap)', 'Alt+J', () => { client.cursor.move(0, -client.grid.h) })
    client.acels.set('Vi', 'Move North(Leap)', 'Alt+K', () => { client.cursor.move(0, client.grid.h) })
    client.acels.set('Vi', 'Move East(Leap)', 'Alt+L', () => { client.cursor.move(client.grid.w, 0) })

    // line start and end
    client.acels.set('Vi', 'Start of line', '0', () => {
      if (this.chordPrefix.endsWith('d')) {
        const {x,y} = client.cursor
        client.cursor.selectNoUpdate(x-1, y, -client.cursor.x, 0)
        client.cursor.cut()
        client.orca.writeBlock(-1, client.cursor.y, this.lineRightOfCursor())
        client.history.record(client.orca.s)
        client.cursor.moveTo(0, client.cursor.y)
        client.cursor.reset()
        this.resetChord()
      } else if (!isNaN(this.chordPrefix||'x')) {
        this.chordPrefix += '0'
      } else {
        client.cursor.moveTo(0, client.cursor.y)
      }
    })
    client.acels.set('Vi', 'End of line', 'Shift+$', () => {
      if (this.chordPrefix.endsWith('d')) {
        const {x,y} = client.cursor
        client.cursor.selectNoUpdate(x, y, client.orca.w, 0)
        client.cursor.cut()
        client.history.record(client.orca.s)
        client.cursor.move(-1, 0)
        client.cursor.reset()
        this.resetChord()
      } else {
        client.cursor.moveTo(client.orca.w, client.cursor.y)
      }
    })

    // word traversals
    client.acels.set('Vi', 'Go to word beginning', 'W', () => this.jumpWordBeginning())
    client.acels.set('Vi', 'Go to word ending', 'E', () => this.jumpWordEnding())
    client.acels.set('Vi', 'Go back word', 'B', () => this.jumpWordBack())
    client.acels.set('Vi', 'Goto', 'G', () => {
      if (this.chordPrefix.endsWith('g')) {
        const prefix = this.chordPrefix.slice(0, -1)
        if (prefix === '') { client.cursor.moveTo(0, 0) }
        else if (!isNaN(prefix)) { client.cursor.moveTo(0, prefix) }
        else { console.error(`Huh? ${prefix}`) }
        this.resetChord()
      } else {
        this.chordPrefix += 'g'
      }
    })
    client.acels.set('Vi', 'Goto End', 'Shift+G', () => client.cursor.moveTo(0, client.orca.h))

    client.acels.set('Vi', 'Paste', 'P', () => {
      client.history.record(client.orca.s)
      client.cursor.paste()
      client.cursor.reset()
    })

    client.acels.set('Vi', 'Undo', 'U', () => client.history.undo())
    client.acels.set('Vi', 'Redo', 'CmdOrCtrl+R', () => client.history.redo())

    client.acels.set('Vi', 'Normal mode', 'Escape', () => {
      client.cursor.reset()
      this.resetChord()
    })

    ;[1,2,3,4,5,6,7,8,9].forEach(n => {
      client.acels.set('Vi', `${n}`, n, () => {
        if (!isNaN(this.chordPrefix)) { // isNaN('') is false because JavaScript <3
          this.chordPrefix += `${n}`
        }
      })
    })

    client.acels.set('Vi', 'Replace', 'R', () => { this.chordPrefix = 'r'; this.resetAcels() })

    client.commander.onKeyDown = (e) => {
      if (this.chordPrefix == 'r') {
        if (e.shiftKey && e.key == 'Shift') return // skip just shift key; wait for combo
        client.cursor.write(e.key)
        this.resetChord()
        this.normalMode()
      }
      e.stopPropagation()
    }
  }

  this.insertMode = () => {
    client.acels.set('Vi', 'Normal mode', 'Escape', () => {
      client.history.record(client.orca.s)
      client.cursor.reset()
      client.cursor.move(-1, 0)
      this.switchTo("NORMAL")
    })

    client.acels.set('Vi', 'Erase', 'Backspace', () => {
      client.orca.writeBlock(client.cursor.x-1, client.cursor.y, this.lineRightOfCursor())
      client.history.record(client.orca.s)
      client.cursor.move(-1, 0)
    })

    // just like x in normal mode
    client.acels.set('Vi', 'Erase Forward', 'Delete', () => {
      client.orca.writeBlock(client.cursor.x, client.cursor.y, this.lineRightOfCursor())
      client.history.record(client.orca.s)
    })

    // Same logic as o in normal mode
    client.acels.set('Vi', 'Next line', 'Enter', () => {
      const line = this.lineLeftOfCursor().split('').reverse().slice(1)
      if (line[0] === '.' || line[1] !== '.') this.jumpWordBack()
      const {x,y} = client.cursor
      client.cursor.selectNoUpdate(0, client.cursor.y+1, client.orca.w, client.orca.h-client.cursor.y-1)
      client.cursor.drag(0, -1, false)
      client.cursor.moveTo(x, y+1)
      client.cursor.reset()
    })

    // Handled similarly as any key in the commandar below, but has to be an acel to override the existing
    client.acels.set('Vi', 'Space', 'Space', () => {
      client.orca.writeBlock(client.cursor.x+1, client.cursor.y, this.lineRightOfCursor())
      client.orca.write(client.cursor.x, client.cursor.y, '.')
      client.cursor.move(1, 0)
    })

    client.commander.onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) { return }

      if (
        !e.altKey &&
        e.key !== 'CapsLock' &&
        !(e.shiftKey && e.key == "Shift")
      ) {
        console.log(e.keyCode)
        client.orca.writeBlock(client.cursor.x+1, client.cursor.y, this.lineRightOfCursor())
        client.cursor.write(e.key, false)
        client.cursor.move(1, 0)
      }

      e.stopPropagation()
      // e.preventDefault()
    }
  }

  this.visualModeCommon = () => {
    client.acels.set('Vi', 'Scale West', 'H', () => { client.cursor.scale(-1*(this.chordPrefix||1), 0); this.resetChord() })
    client.acels.set('Vi', 'Scale South', 'J', () => { client.cursor.scale(0, -1*(this.chordPrefix||1)); this.resetChord() })
    client.acels.set('Vi', 'Scale North', 'K', () => { client.cursor.scale(0, 1*(this.chordPrefix||1)); this.resetChord() })
    client.acels.set('Vi', 'Scale East', 'L', () => { client.cursor.scale(1*(this.chordPrefix||1), 0); this.resetChord() })
    client.acels.set('Vi', 'Start of line', '0', () => { if (!isNaN(this.chordPrefix||'x')) { this.chordPrefix += '0' } else { client.cursor.scaleTo(-client.cursor.x, client.cursor.h) } })
    client.acels.set('Vi', 'End of line', 'Shift+$', () => { client.cursor.scaleTo(client.orca.w-client.cursor.x-1, client.cursor.h) })
    client.acels.set('Vi', 'Move West(Leap)', 'Alt+H', () => { client.cursor.scale(-client.grid.w, 0) })
    client.acels.set('Vi', 'Move South(Leap)', 'Alt+J', () => { client.cursor.scale(0, -client.grid.h) })
    client.acels.set('Vi', 'Move North(Leap)', 'Alt+K', () => { client.cursor.scale(0, client.grid.h) })
    client.acels.set('Vi', 'Move East(Leap)', 'Alt+L', () => { client.cursor.scale(client.grid.w, 0) })

    client.acels.set('Vi', 'Drag West', 'Shift+H', () => { client.cursor.drag(-1*(this.chordPrefix||1), 0); this.resetChord(); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag South', 'Shift+J', () => { client.cursor.drag(0, -1*(this.chordPrefix||1)); this.resetChord(); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag North', 'Shift+K', () => { client.cursor.drag(0, 1*(this.chordPrefix||1)); this.resetChord(); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag East', 'Shift+L', () => { client.cursor.drag(1*(this.chordPrefix||1), 0); this.resetChord(); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag West(Leap)', 'Shift+Alt+H', () => { client.cursor.drag(-client.grid.w, 0); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag South(Leap)', 'Shift+Alt+J', () => { client.cursor.drag(0, -client.grid.h); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag North(Leap)', 'Shift+Alt+K', () => { client.cursor.drag(0, client.grid.h); client.history.record(client.orca.s) })
    client.acels.set('Vi', 'Drag East(Leap)', 'Shift+Alt+L', () => { client.cursor.drag(client.grid.w, 0); client.history.record(client.orca.s) })

    client.acels.set('Vi', 'Copy', 'Y', () => { client.cursor.copy(); this.switchTo("NORMAL") })
    client.acels.set('Vi', 'Cut', 'X', () => { client.cursor.cut(); this.switchTo("NORMAL") })

    ;[1,2,3,4,5,6,7,8,9].forEach(n => {
      client.acels.set('Vi', `${n}`, n, () => {
        if (!isNaN(this.chordPrefix)) { // isNaN('') is false because JavaScript <3
          this.chordPrefix += `${n}`
        }
      })
    })

    client.acels.set('Vi', 'Replace', 'R', () => { this.chordPrefix = 'r'; this.resetAcels() })

    client.commander.onKeyDown = (e) => {
      if (this.chordPrefix == 'r') {
        if (e.shiftKey && e.key == 'Shift') return // skip just shift key; wait for combo
        client.cursor.write(e.key)
        const block = client.cursor.toRect()
        client.orca.writeBlock(block.x, block.y, `${e.key.repeat(block.w)}\n`.repeat(block.h))
        client.history.record(client.orca.s)
        this.resetChord()
        this.switchTo("NORMAL")
      }
      e.stopPropagation()
    }
  }

  this.visualBlockMode = () => {
    const {x,y} = client.cursor
    client.cursor.selectNoUpdate(x, y, 0, 0)
    client.acels.set('Vi', 'Normal mode', 'Escape', () => { this.switchTo("NORMAL") })
    client.acels.set('Vi', 'Visual Line',  'Shift+V', () => { this.switchTo("VISUAL LINE") })
    this.visualModeCommon()
  }

  this.visualLineMode = () => {
    const {x,y} = client.cursor
    client.cursor.selectNoUpdate(0, y, client.orca.w, 0)
    client.acels.set('Vi', 'Normal mode', 'Escape', () => { client.cursor.x = x; this.switchTo("NORMAL") })
    client.acels.set('Vi', 'Visual Block', 'CmdOrCtrl+V',  () => { this.switchTo("VISUAL BLOCK") })
    this.visualModeCommon()
  }

  // Returns the text to the right of our cursor until the end of the line
  // This includes the character under our cursor!
  this.lineRightOfCursor = () => {
    return client.orca.getBlock(
      client.cursor.x,
      client.cursor.y,
      client.orca.w-client.cursor.x,
      1,
    )
  }

  // Returns the text to the left of our cursor until the start of the line
  // This includes the character under our cursor!
  this.lineLeftOfCursor = () => {
    return client.orca.getBlock(
      0,
      client.cursor.y,
      client.cursor.x+1,
      1,
    )
  }

  this.jumpWordBeginning = () => {
    while (true) {
      const line = this.lineRightOfCursor().split('')
      let charUnderCursor = line[0]
      let moves = 0

      // Calculate the number of spaces we need to move until the next word, depending on what character we're currently on
      if (charUnderCursor === '.') {
        moves = line.findIndex(x => x != '.')
      } else {
        const movesUntilDot = line.indexOf('.')
        moves = movesUntilDot + line.slice(movesUntilDot).findIndex(x => x != '.')
      }

      // Test for two (literal) edge cases:
      // 1. Our cursor is over a word that extends until the end of the line. There are no more dots on this line, e.g. ...abc|
      // 2. Our cursor is over the last word in this line. There are no more words to the right of this word on this line, e.g. ..abc..|
      // In either case, our goal is to repeat the above search on the next line.
      if (moves === -1 || moves === line.length-1) {
        if (this.chordPrefix.endsWith('d')) {
          client.orca.writeBlock(client.cursor.x, client.cursor.y, ".".repeat(client.orca.w))
          client.history.record(client.orca.s)
          this.resetChord()
          break
        }

        // don't recurse past Orca's height
        if (client.cursor.y+1 >= client.orca.h) break

        client.cursor.moveTo(0, client.cursor.y+1)

        // don't recurse if we already found a new word, e.g. ..a| -> |b..
        if (client.cursor.read() != '.') break

        continue
      }

      if (this.chordPrefix.endsWith('d')) {
        const line = this.lineRightOfCursor().substring(moves)
        client.orca.writeBlock(client.cursor.x, client.cursor.y, ".".repeat(client.orca.w))
        client.orca.writeBlock(client.cursor.x, client.cursor.y, line)
        client.history.record(client.orca.s)
        this.resetChord()
      } else {
        // Otherwise, simply just move the amount of spaces we calculated
        client.cursor.move(moves, 0)
      }
      break
    }
  }

  // After conditionally jumping to the next word's beginning, we know we're at a word character, so just find the next dot.
  // If no dot, then the word extends until the of the line, in which case, just move the line length.
  this.jumpWordEnding = () => {
    let line = this.lineRightOfCursor()

    const toDelete = this.chordPrefix.endsWith('d') // check this now in as jumpWordBeginning might do some for us

    // Find the next word if we're on a dot, or we're already at the end of our current word
    if (line[0] === '.' || line[1] === '.' || line[1] === '\n') {
      this.jumpWordBeginning()
      line = this.lineRightOfCursor()
    }

    let moves = line.indexOf('.')

    if (moves === -1) {
      moves = line.length-1
    }

    if (toDelete) {
      const line = this.lineRightOfCursor().substring(moves)
      client.orca.writeBlock(client.cursor.x, client.cursor.y, ".".repeat(client.orca.w))
      client.orca.writeBlock(client.cursor.x, client.cursor.y, line)
      this.resetChord()
    } else {
      client.cursor.move(moves-1, 0) // moves to the last character of the word
    }
  }

  this.jumpWordBack = () => {
    while (true) {
      let line = [...this.lineLeftOfCursor().split('').reverse().slice(1), '.']
      let charUnderCursor = line[0]
      let moves = 0

      // If we're at the start of a word  against the border, i.e. |abc.. with cursor over 'a'
      if (line.length == 2) {
        client.cursor.moveTo(client.orca.w, client.cursor.y-1)
        continue
      }

      if (charUnderCursor === '.') {
        const movesUntilWordEnd = line.findIndex(x => x != '.')
        moves = movesUntilWordEnd + line.slice(movesUntilWordEnd).indexOf('.')
      } else {
        moves = line.indexOf('.')
        // if we're at the start of a word already, we should go to the next one, so recurse
        if (moves == 1) {
          client.cursor.move(-1, 0)
          continue
        }
      }

      // If we're at the start of the word and there's nothing else on the line, i.e ...abc..| with cursor over 'a'
      if (moves === -1) {
        if (client.cursor.y <= 0) { client.cursor.moveTo(0, 0); break }
        client.cursor.moveTo(client.orca.w, client.cursor.y-1)
        continue
      }

      client.cursor.move(-moves+1, 0)
      break
    }
  }
}