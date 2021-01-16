'use strict'

    // 
    // console.log(`Vi mode is now ${this.mode}`)
    // console.log(client.acels.pipe)

/**
 * Implements a small subset of Vi.
 *
 * Differences:
 * - o, O, and Enter in insertion mode start new lines, but keep the cursor's X coordinate.
 */
function Vi (client) {
  this.mode = null
  this.chordPrefix = null
  this.originalCommanderKeyDownHandler = client.commander.onKeyDown
  this.originalCommanderKeyUpHandler = client.commander.onKeyUp

  this.inspectMode = () => this.mode ? `-- ${this.mode} --` : ""
  this.inspectChord = () => this.mode /*&& this.chordPrefix != 1*/ ? `${this.chordPrefix}` : ""

  this.toggle = () => {
    if (this.mode == null) {
      this.switchTo("NORMAL")
    } else {
      this.mode = null
      this.resetAcels()
      client.install()
      client.commander.onKeyDown = this.originalCommanderKeyDownHandler
      client.commander.onKeyUp = this.originalCommanderKeyUpHandler
    }
  }

  this.resetChord = () => this.chordPrefix = null
  this.resetAcels = () => {
    client.acels.unset(
      /* normal mode */ 'I', 'O', 'Shift+O', 'A',
                        'X',
                        'H', 'J', 'K', 'L', 'Alt+H', 'Alt+J', 'Alt+K', 'Alt+L', '0', 'Shift+$',
                        'W', 'E',
      /* insert mode */ 'Escape', 'Space', 'Delete', 'Enter',
    )

    // We overwrite these so they don't work in any mode
    // Easily reverted by a client.install()
    client.acels.set('Cursor', 'Toggle Insert Mode', 'CmdOrCtrl+I', () => {})
    client.acels.set('Edit', 'Erase Selection', 'Backspace', () => {})
  }

  this.switchTo = (mode) => {
    this.resetAcels()

    switch (mode) {
      case "NORMAL": this.normalMode(); break
      case "INSERT": this.insertMode(); break
      case "VISUAL": this.visualMode(); break
      case "COMMAND": this.commandMode(); break
    }

    this.mode = mode
  }

  this.normalMode = () => {
    client.cursor.reset()

    // into insert mode
    client.acels.set('Vi', 'Insert', 'I', () => { this.switchTo("INSERT") })
    client.acels.set('Vi', 'Insert Previous Line', 'Shift+O', () => { client.cursor.move(0, 1); this.switchTo("INSERT") })
    client.acels.set('Vi', 'Insert Next Line', 'O', () => { client.cursor.move(0, -1); this.switchTo("INSERT") })
    client.acels.set('Vi', 'Append', 'A', () => { client.cursor.move(1, 0); this.switchTo("INSERT") })

    // deletions
    client.acels.set('Vi', 'Erase', 'X', () => {
      client.orca.writeBlock(client.cursor.x, client.cursor.y, this.lineRightOfCursor().substring(1))
      client.history.record(client.orca.s)
    })

    // simple movements
    client.acels.set('Vi', 'Move West', 'H', () => { client.cursor.move(-1*(this.chordPrefix||1), 0); this.resetChord() })
    client.acels.set('Vi', 'Move South', 'J', () => { client.cursor.move(0, -1*(this.chordPrefix||1)); this.resetChord() })
    client.acels.set('Vi', 'Move North', 'K', () => { client.cursor.move(0, 1*(this.chordPrefix||1)); this.resetChord() })
    client.acels.set('Vi', 'Move East', 'L', () => { client.cursor.move(1*(this.chordPrefix||1), 0); this.resetChord() })
    client.acels.set('Vi', 'Move West(Leap)', 'Alt+H', () => { client.cursor.move(-client.grid.w, 0) })
    client.acels.set('Vi', 'Move South(Leap)', 'Alt+J', () => { client.cursor.move(0, -client.grid.h) })
    client.acels.set('Vi', 'Move North(Leap)', 'Alt+K', () => { client.cursor.move(0, client.grid.h) })
    client.acels.set('Vi', 'Move East(Leap)', 'Alt+L', () => { client.cursor.move(client.grid.w, 0) })
    client.acels.set('Vi', 'Start of line', '0', () => { this.chordPrefix ? this.chordPrefix = this.chordPrefix+'0' : client.cursor.moveTo(0, client.cursor.y) })
    client.acels.set('Vi', 'End of line', 'Shift+$', () => { client.cursor.moveTo(client.orca.w, client.cursor.y) })

    // traversals
    client.acels.set('Vi', 'Jump to word beginning', 'W', () => this.jumpWordBeginning())
    client.acels.set('Vi', 'Jump to word ending', 'E', () => this.jumpWordEnding())

    // chords? idk guess they're like their own little mini mode in a way
    client.acels.set('Vi', 'Delete chord', 'D', () => {
      this.chordPrefix = 'd'
      // client.acels.set('Vi', '')
    })
    
    client.acels.set('Vi', 'Normal mode', 'Escape', () => {
      this.resetChord()
    })

    client.commander.onKeyDown = (e) => {
      if (!isNaN(e.key)) {
        if (!isNaN(this.chordPrefix)) {
          this.chordPrefix = this.chordPrefix ? this.chordPrefix + e.key : e.key
          // this.normalMode()
        }
      }
      e.stopPropagation()
    }
  }

  this.insertMode = () => {
    client.acels.set('Vi', 'Normal mode', 'Escape', () => {
      client.cursor.reset()
      client.cursor.move(-1, 0)
      this.switchTo("NORMAL")
    })

    client.acels.set('Vi', 'Erase', 'Backspace', () => {
      client.orca.writeBlock(client.cursor.x-1, client.cursor.y, this.lineRightOfCursor())
      client.history.record(client.orca.s)
      client.cursor.move(-1, 0)
    })

    client.acels.set('Vi', 'Space', 'Space', () => {
      client.orca.write(client.cursor.x, client.cursor.y, '.')
      client.cursor.move(1, 0)
    })

    // just like x in normal mode
    client.acels.set('Vi', 'Erase Forward', 'Delete', () => {
      client.orca.writeBlock(client.cursor.x, client.cursor.y, this.lineRightOfCursor())
      client.history.record(client.orca.s)
    })

    client.acels.set('Vi', 'Next line', 'Enter', () => { client.cursor.move(0, -1) })

    client.commander.onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) { return }

      if (
        !e.altKey &&
        e.key !== 'CapsLock' &&
        !(e.shiftKey && e.key == "Shift")
      ) {
        console.log(e.keyCode)
        client.orca.writeBlock(client.cursor.x+1, client.cursor.y, this.lineRightOfCursor())
        client.cursor.write(e.key)
        client.cursor.move(1, 0)
      }

      e.stopPropagation()
      // e.preventDefault()
    }
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

      // Test for two edge cases:
      // 1. Our cursor is over a word that extends until the end of the line. There are no more dots on this line, e.g. ...abc|
      // 2. Our cursor is over the last word in this line. There are no more words to the right of this word on this line, e.g. ..abc..|
      // In either case, our goal is to repeat the above search on the next line.
      if (moves === -1 || moves === line.length-1) {
        // don't recurse past Orca's height
        if (client.cursor.y+1 >= client.orca.h) break

        client.cursor.moveTo(0, client.cursor.y+1)

        // don't recurse if we already found a new word, e.g. ..a| -> |b..
        if (client.cursor.read() != '.') break

        continue
      }

      // Otherwise, simply just move the amount of spaces we calculated
      client.cursor.move(moves, 0)
      break
    }
  }

  // After conditionally jumping to the next word's beginning, we know we're at a word character, so just find the next dot.
  // If no dot, then the word extends until the of the line, in which case, just move the line length.
  this.jumpWordEnding = () => {
    let line = this.lineRightOfCursor()

    console.log(line)
    // Find the next word if we're on a dot, or we're already at the end of our current word
    if (line[0] == '.' || line[1] == '.' || line[1] == '\n') {
      this.jumpWordBeginning()
      line = this.lineRightOfCursor()
    }

    let moves = line.indexOf('.')

    if (moves === -1) {
      moves = line.length-1
    }

    client.cursor.move(moves-1, 0) // moves to the last character of the word
  }
}