# ORCΛVI

It's [Hundred Rabbits' Orca](https://github.com/hundredrabbits/orca) but with
a hacky Vi mode.

Please see their repo for Orca documentation.


## contents

* [contents](#contents)
* [info](#info)
* [normal mode](#normal-mode)
  + [movements](#movements)
  + [deletions](#deletions)
  + [replacements](#replacements)
  + [mode switches](#mode-switches)
* [visual modes](#visual-modes)
  + [scaling](#scaling)
  + [dragging](#dragging)
  + [replacements](#replacements-1)
  + [mode switches](#mode-switches-1)
* [insert mode](#insert-mode)
* [replace mode](#replace-mode)
* [command mode](#command-mode)
* [find mode](#find-mode)


## info

We start in Vi mode by default. Use `Ctrl+Shift+/` to toggle it.

In the tables below, `C` and `M` represent `Ctrl` and `Alt` respectively.

With all modes, `Esc` will switch us back normal mode.


## normal mode

### movements

Key | Action
----| ------ 
`h` | Moves cursor left
`j` | Moves cursor down
`k` | Moves cursor up
`l` | Moves cursor right
`7l` | Moves cursor right by 7 units
`gg` | Moves cursor to the top-left corner
`11gg` | Moves cursor to line 11
`G` | Moves cursor to the bottom-left corner
`0` | Moves to the start of the line
`$` | Moves to the end of the line
`M-h` | Moves one grid square unit left
`M-j` | Moves one grid square unit down
`M-k` | Moves one grid square unit up
`M-l` | Moves one grid square unit right
`w` | Moves forward to a word beginning
`e` | Moves forward to a word ending
`b` | Moves backward to a word beginning

### deletions

Key | Action
----| ------
`x` | Deletes the character under the cursor
`dd` | Deletes the entire line
`5dd` | Deletes 5 lines
`dgg` | Deletes to the top of the page
`dG` | Deletes to the bottom of the page
`d0` | Deletes to the start of the line
`d$` | Deletes to the end of the line
`dw` | Deletes to a word beginning
`de` | Deletes to a word ending
`db` | _not implemented_

### replacements

Key | Action
----| ------
`r?` | Replaces the character under the cursor with an `?`
`~` | Switches casing of current letter
`p` | Paste
`4p` | Pastes our clipboard four times
`u` | Undo
`C-r` | Redo

### mode switches

Key | Action
----| ------
`i` | Insert mode before the current character
`I` | Insert mode at the start of the line
`a` | Insert mode after the current character
`A` | Insert mode after the last word on the line
`o` | Insert mode on the line below the current word beginning; otherwise directly below
`O` | Insert mode on the line above the current word beginning; otherwise directly above
`R` | Replace mode
`C-v` | Visual block mode
`vgg` | Visual block mode, with a selection up to the top of the page
`vG` | Visual block mode, with a selection to the bottom of the page
`v0` | Visual block mode, with a selection to the start of the line
`v$` | Visual block mode, with a selection to the end of the line
`V` | Visual line mode
`:` | Command mode
`/` | Find mode


## visual modes

We have a choice of visual line and visual block selection. The former is
really just a convenience. For example, we can easily mimic line selection
through `0v$`, saving two strokes over `V`.

### scaling

Key | Action
----| ------
`h` | Scales our selection left
`j` | Scales our selection down
`k` | Scales our selection up
`l` | Scales our selection right
`3l` | Scales our selection right by 3 units
`gg` | Scales our selection to the top of the page
`G` | Scales our selection to the bottom of the page
`0` | Scales our selection to the start of the line
`$` | Scales our selection to the end of the line
`M-h` | Scales our selection one grid square unit left
`M-j` | Scales our selection one grid square unit down
`M-k` | Scales our selection one grid square unit up
`M-l` | Scales our selection one grid square unit right

### dragging

Key | Action
----| ------
`H` | Drags our selection left
`J` | Drags our selection down
`3J` | Drags our selection down by 3 units
`K` | Drags our selection up
`L` | Drags our selection right
`M-L` | Drags our selection one grid square unit right
`M-H` | Drags our selection one grid square unit left
`M-J` | Drags our selection one grid square unit down
`M-L` | Drags our selection one grid square unit up

### replacements

Key | Action
----| ------
`y` | Copies selection to our clipboard
`x` | Cuts selection to our clipboard
`r?` | Replaces selection with `?` characters
`~` | Switches casing of selection

### mode switches

Key | Action
----| ------
`I` | Block insertion mode


## insert mode

Just type slowly. No pressure.

Key | Action
----| ------
`Shift+Enter` | Replace mode on a new line


## replace mode

It's insert mode but text gets replaced by directly typing over it.
Also `Backspace` does not delete text here.


## command mode

Orca's [command](https://github.com/hundredrabbits/Orca#commands) mode.

Orca uses `:` as the separator between command and value, but since we preface
`:` is in front of our command for a Vi-esque feel, we use a space as the
separator. For example, `:bpm 80` or `:color ;;ff0`.

Key | Action
----| ------
`Ctrl+U` | Clear current command
`Ctrl+P` | Traverse history backwards
`Ctrl+N` | Traverse history forwards
`ArrowUp` | Traverse history backwards
`ArrowDown` | Traverse history forwards


## find mode

We can use the above bindings from [command mode](#command-mode) to traverse
our search history. In addition, we've also got the following:

Key | Action
----| ------
`n` | Search forward
`N` | Search backward