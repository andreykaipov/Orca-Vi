# ORCΛVI

It's [Hundred Rabbits' Orca](https://github.com/hundredrabbits/orca) but with
a hacky Vi mode.

Please see their repo for Orca documentation.

## keybindings

Most of these are standard Vi keybindings, but you might find behaviors of
a few have been modified to fit the Orca environment.

Below `C` and `M` are the Ctrl and Alt keys respectively.

### normal mode

#### movements

Key | Action
----| ------ 
`h` | Moves cursor left
`j` | Moves cursor down
`k` | Moves cursor up
`l` | Moves cursor right
`0` | Moves to the start of the line
`$` | Moves to the end of the line
`M-h` | Moves one grid square unit left
`M-j` | Moves one grid square unit down
`M-k` | Moves one grid square unit up
`M-l` | Moves one grid square unit right
`w` | Moves forward to a word beginning
`e` | Moves forward to a word ending
`b` | Moves backward to a word beginning
`gg` | Moves the cursor to the top-left corner
`11gg` | Moves the cursor to line 11
`G` | Moves the cursor to the bottom-left corner

#### deletions

Key | Action
----| ------
`x` | Deletes the character under the cursor
`dd` | Deletes the entire line
`5dd` | Deletes five lines (kinda buggy)
`d0` | Deletes to the start of the line
`d$` | Deletes to the end of the line
`dw` | Deletes to a word beginning
`de` | Deletes to a word ending
`db` | _not implemented_
`r?` | Replaces the character under the cursor with an `?`

#### clipboard

Key | Action
----| ------
`u` | Undo
`C-R` | Redo
`P` | Paste

#### mode switches

Key | Action
----| ------
`i` | Insert mode before the current character
`s` | Insert mode at the start of the line
`a` | Insert mode after the current character
`A` | Insert mode after the last word on the line
`o` | Insert mode on the line below the current word beginning; otherwise directly below
`O` | Insert mode on the line above the current word beginning; otherwise directly above
`R` | Replace mode
`C-v` | Visual block mode
`V` | Visual line mode
`:` | Command mode
`/` | Find mode

### visual mode

The following is common across both visual line and visual block modes:

Key | Action
----| ------
`h` | Scales our selection left
`j` | Scales our selection down
`k` | Scales our selection up
`l` | Scales our selection right
`0` | Scales our selection to the start of the line
`$` | Scales our selection to the end of the line
`M-h` | Scales our selection one grid square unit left
`M-j` | Scales our selection one grid square unit down
`M-k` | Scales our selection one grid square unit up
`M-l` | Scales our selection one grid square unit right
`H` | Drags our selection left
`J` | Drags our selection down
`K` | Drags our selection up
`L` | Drags our selection right
`M-L` | Drags our selection one grid square unit right
`M-H` | Drags our selection one grid square unit left
`M-J` | Drags our selection one grid square unit down
`M-L` | Drags our selection one grid square unit up
`y` | Copies to our clipboard
`x` | Cuts to our clipboard
`r?` | Replaces the entire selection with `?` characters

#### visual block mode

Key | Action
----| ------
`I` | Block insertion mode

### insert mode

You know how insert mode works, don't you?

The only interesting part about insert mode is you can enter replace mode by
pressing `Shift+Enter`. This will not break for a new line.

### replace mode

It's insert mode but text gets replaced by directly typing over it.

### command mode

Orca's command mode. See
[its documentation](https://github.com/hundredrabbits/Orca#commands).

Key | Action
----| ------
`Ctrl+U` | Clear current command
`Ctrl+P` | Traverse history backwards
`Ctrl+N` | Traverse history forwards
`ArrowUp` | Traverse history backwards
`ArrowDown` | Traverse history forwards

### find mode

Key | Action
----| ------
`n` | Search forward (not implemented)